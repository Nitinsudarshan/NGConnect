"use client"

/**
 * VideoPlayer — robust watch progress tracking & resume playback component.
 *
 * Features:
 * - HTML5 Native <video>: Precise event tracking via onTimeUpdate and initial seek.
 * - Embed Iframes (Google Drive / YouTube / Zoom):
 *   - Auto-resume: passes start timestamp to embed URL (?start=N or #t=N).
 *   - Active watch time: tracks watch duration while session is open and persists to DB.
 *   - Hides Google Drive popout button with top-right cover overlay.
 *   - Displays slim "Resumed from X:XX" badge on top-right.
 */

import React, { useRef, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Play } from "lucide-react"
import { toast } from "sonner"
import { syncSessionDurationAction } from "@/lib/learning-center/actions"

interface VideoPlayerProps {
  src: string
  sourceId: string
  sourceType: "session_recording" | "course_item"
  sessionDurationMinutes?: number
  onCompleted?: () => void
  completionThresholdPct?: number
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s < 10 ? "0" : ""}${s}`
}

function detectEmbed(url: string): boolean {
  return (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("drive.google.com") ||
    url.includes("vimeo.com") ||
    url.includes("zoom.us") ||
    !/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)
  )
}

function buildEmbedUrl(url: string, startSecs: number): string {
  let out = url

  if (url.includes("youtube.com/watch?v=")) {
    out = url.replace("youtube.com/watch?v=", "youtube-nocookie.com/embed/")
  } else if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0]
    out = `https://www.youtube-nocookie.com/embed/${id}`
  } else if (url.includes("youtube.com/embed/")) {
    out = url.replace("youtube.com/embed/", "youtube-nocookie.com/embed/")
  } else if (url.includes("drive.google.com/file/d/")) {
    const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (match) {
      out = `https://drive.google.com/file/d/${match[1]}/preview`
    }
  }

  if (startSecs > 0) {
    const sep = out.includes("?") ? "&" : "?"
    if (out.includes("youtube-nocookie.com/embed/") || out.includes("youtube.com/embed/")) {
      out = `${out}${sep}start=${Math.floor(startSecs)}&autoplay=1`
    } else if (out.includes("vimeo.com/")) {
      out = `${out}${sep}t=${Math.floor(startSecs)}`
    } else {
      out = `${out}#t=${Math.floor(startSecs)}`
    }
  }

  return out
}

export function VideoPlayer({
  src,
  sourceId,
  sourceType,
  sessionDurationMinutes,
  onCompleted,
  completionThresholdPct = 90,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Stable refs
  const supabaseRef = useRef(createClient())
  const userIdRef = useRef<string | null>(null)
  const sourceIdRef = useRef(sourceId)
  const sourceTypeRef = useRef(sourceType)
  const thresholdRef = useRef(completionThresholdPct)
  const sessionDurationRef = useRef(sessionDurationMinutes)
  const resumeAtRef = useRef<number>(0)
  const currentTimeRef = useRef<number>(0)
  const durationRef = useRef<number>(0)
  const lastSyncRef = useRef<number>(0)
  const seekDoneRef = useRef(false)
  const completedRef = useRef(false)

  // UI state
  const [loading, setLoading] = useState(true)
  const [resumeAt, setResumeAt] = useState(0)

  useEffect(() => {
    sourceIdRef.current = sourceId
    sourceTypeRef.current = sourceType
    thresholdRef.current = completionThresholdPct
    sessionDurationRef.current = sessionDurationMinutes
  })

  function persist(seconds: number, duration: number) {
    const uid = userIdRef.current
    const sid = sourceIdRef.current
    const stype = sourceTypeRef.current
    const threshold = thresholdRef.current
    const db = supabaseRef.current

    if (!uid || !sid || seconds < 3) return

    const effectiveDur = duration > 0 ? duration : (sessionDurationRef.current && sessionDurationRef.current > 0 ? sessionDurationRef.current * 60 : 3600)
    const pct = (seconds / effectiveDur) * 100
    const isCompleted = pct >= threshold

    db.from("watch_progress")
      .upsert(
        {
          user_id: uid,
          video_source_type: stype,
          video_source_id: sid,
          watched_seconds: Math.floor(seconds),
          percent_watched: Math.min(Math.max(Math.floor(pct), pct > 0 ? 1 : 0), 100),
          updated_at: new Date().toISOString(),
          ...(isCompleted && { completed_at: new Date().toISOString() }),
        },
        { onConflict: "user_id, video_source_type, video_source_id" }
      )
      .then(({ error }) => {
        if (error) console.error("[VideoPlayer] DB error:", error.message)
      })
  }

  // 1. Init: fetch user + saved progress
  useEffect(() => {
    let alive = true
    const db = supabaseRef.current

    async function init() {
      try {
        const { data: { user }, error: authError } = await db.auth.getUser()
        if (authError) console.error("[VideoPlayer] auth error:", authError.message)
        if (!user || !alive) return

        userIdRef.current = user.id

        const { data, error: dbError } = await db
          .from("watch_progress")
          .select("watched_seconds, completed_at")
          .eq("user_id", user.id)
          .eq("video_source_type", sourceTypeRef.current)
          .eq("video_source_id", sourceIdRef.current)
          .maybeSingle()

        if (dbError) console.error("[VideoPlayer] fetch progress error:", dbError.message)

        if (data && alive && data.watched_seconds > 5) {
          resumeAtRef.current = data.watched_seconds
          currentTimeRef.current = data.watched_seconds
          setResumeAt(data.watched_seconds)
        }
      } catch (err) {
        console.error("[VideoPlayer] init exception:", err)
      } finally {
        if (alive) setLoading(false)
      }
    }

    init()
    return () => { alive = false }
  }, [])

  // 2. Embed watch duration tracking — ticks every 10s & flushes on unmount
  useEffect(() => {
    if (loading || !detectEmbed(src)) return

    const startTime = Date.now()
    const initialResume = resumeAtRef.current

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const currentPos = initialResume + elapsed
      currentTimeRef.current = currentPos
      persist(currentPos, 0)
    }, 10000)

    return () => {
      clearInterval(interval)
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      if (elapsed > 3) {
        const currentPos = initialResume + elapsed
        currentTimeRef.current = currentPos
        persist(currentPos, 0)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, src])

  // 3. Native <video> handlers
  function doInitialSeek() {
    const el = videoRef.current
    if (!el) return

    // Auto-calculate and sync actual video duration to DB
    if (el.duration && !isNaN(el.duration) && el.duration > 0 && sourceTypeRef.current === "session_recording") {
      const actualMins = Math.round(el.duration / 60)
      if (actualMins > 0 && sourceIdRef.current) {
        syncSessionDurationAction(sourceIdRef.current, actualMins)
      }
    }

    if (seekDoneRef.current || resumeAtRef.current <= 0) return
    if (el.readyState >= 1) {
      el.currentTime = resumeAtRef.current
      seekDoneRef.current = true
      toast.info(`Resumed from ${formatTime(resumeAtRef.current)}`, { duration: 2500 })
    }
  }

  function handleTimeUpdate() {
    const el = videoRef.current
    if (!el) return
    const t = el.currentTime
    const dur = el.duration
    if (!dur || isNaN(dur) || t <= 0) return

    currentTimeRef.current = t
    durationRef.current = dur

    if (t - lastSyncRef.current >= 10) {
      lastSyncRef.current = t
      persist(t, dur)
    }

    const pct = (t / dur) * 100
    if (!completedRef.current && pct >= thresholdRef.current) {
      completedRef.current = true
      persist(t, dur)
      onCompleted?.()
    }
  }

  function handlePause() {
    const t = currentTimeRef.current
    const dur = durationRef.current
    if (t > 3) persist(t, dur)
  }

  function handleEnded() {
    const dur = durationRef.current
    if (!completedRef.current) {
      completedRef.current = true
      persist(dur, dur)
      onCompleted?.()
    }
  }

  // 4. Native video unmount flush
  useEffect(() => {
    return () => {
      const t = currentTimeRef.current
      const dur = durationRef.current
      if (t > 3 && !detectEmbed(src)) persist(t, dur)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceId, sourceType])

  if (loading) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video w-full flex flex-col items-center justify-center gap-2 text-slate-400">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        <p className="text-[11px] tracking-wide">Loading session…</p>
      </div>
    )
  }

  const isEmbed = detectEmbed(src)

  return (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-video w-full shadow-lg group">
      {/* Slim native video controls styling */}
      <style>{`
        video::-webkit-media-controls-timeline {
          height: 3px !important;
          margin-top: 0px !important;
          margin-bottom: 0px !important;
        }
        video::-webkit-media-controls-current-time-display,
        video::-webkit-media-controls-time-remaining-display {
          font-size: 10px !important;
          font-family: ui-monospace, monospace !important;
        }
        video::-webkit-media-controls-panel {
          padding: 0 6px !important;
        }
      `}</style>

      {isEmbed ? (
        <>
          <iframe
            key={`${sourceId}-${resumeAt}`}
            src={buildEmbedUrl(src, resumeAt)}
            className="border-0"
            style={{
              width: "125%",
              height: "125%",
              transform: "scale(0.8)",
              transformOrigin: "0 0",
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            title="Session Recording"
          />

          {/* Solid black cover overlay on top-right to fully hide and disable Google Drive pop-out button */}
          <div
            className="absolute top-0 right-0 w-24 h-14 bg-black z-20 pointer-events-auto rounded-bl-lg select-none"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
          />

          {/* Micro "Resumed from X:XX" badge on top-left */}
          {resumeAt > 0 && (
            <div className="absolute top-2 left-2 z-30 bg-black/90 text-white text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 pointer-events-none border border-white/10 shadow-sm">
              <Play className="w-2.5 h-2.5 fill-white" />
              Resumed {formatTime(resumeAt)}
            </div>
          )}
        </>
      ) : (
        <video
          ref={videoRef}
          src={src}
          controls
          controlsList="nodownload"
          className="w-full h-full"
          playsInline
          preload="metadata"
          onLoadedMetadata={() => doInitialSeek()}
          onCanPlay={() => doInitialSeek()}
          onTimeUpdate={handleTimeUpdate}
          onPause={handlePause}
          onEnded={handleEnded}
        />
      )}
    </div>
  )
}
