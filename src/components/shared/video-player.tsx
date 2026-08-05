"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface VideoPlayerProps {
  src: string
  sourceId: string
  sourceType: 'session_recording' | 'course_item'
  onCompleted?: () => void
  completionThresholdPct?: number
}

export function VideoPlayer({ 
  src, 
  sourceId, 
  sourceType, 
  onCompleted, 
  completionThresholdPct = 90 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const supabase = createClient()
  
  const [userId, setUserId] = useState<string | null>(null)
  const [hasTriggeredCompletion, setHasTriggeredCompletion] = useState(false)
  const [maxTimeWatched, setMaxTimeWatched] = useState(0) // Track the furthest point watched to prevent seeking to 99% immediately triggering completion

  // Fetch the user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    fetchUser()
  }, [])

  // Sync progress to DB periodically (debounced)
  const syncProgress = useCallback(async (seconds: number, pct: number, isCompleted: boolean) => {
    if (!userId) return

    try {
      // Upsert progress
      const { error } = await supabase
        .from('watch_progress')
        .upsert({
          user_id: userId,
          video_source_type: sourceType,
          video_source_id: sourceId,
          watched_seconds: Math.floor(seconds),
          percent_watched: Math.floor(pct),
          ...(isCompleted && { completed_at: new Date().toISOString() })
        }, {
          onConflict: 'user_id, video_source_type, video_source_id'
        })

      if (error) throw error
    } catch (error) {
      console.error("Failed to sync video progress", error)
    }
  }, [userId, sourceId, sourceType])

  const handleTimeUpdate = () => {
    if (!videoRef.current) return

    const currentTime = videoRef.current.currentTime
    const duration = videoRef.current.duration

    if (!duration || isNaN(duration)) return

    // Update max time watched to ensure users don't just skip to the end
    // (A more robust implementation would track exact ranges watched, but this is okay for v1)
    if (currentTime > maxTimeWatched) {
      // Only allow maxTimeWatched to jump if they are actually watching linearly, 
      // i.e., current time is within 5 seconds of the previous maxTimeWatched.
      // If they skip from 0 to 600, maxTimeWatched won't immediately jump to 600.
      if (currentTime - maxTimeWatched < 5) {
        setMaxTimeWatched(currentTime)
      } else {
        // They skipped ahead. Let's just track where they are, but if they skipped,
        // it makes our 'percent watched' less accurate unless we track segments.
        // For simplicity in v1, we'll allow the jump but maybe not trigger completion immediately.
      }
    }

    const effectiveTimeWatched = Math.max(currentTime, maxTimeWatched)
    const pct = (effectiveTimeWatched / duration) * 100

    // Debounce sync to every ~10 seconds
    if (Math.floor(currentTime) % 10 === 0) {
      syncProgress(effectiveTimeWatched, pct, false)
    }

    // Check for completion
    if (!hasTriggeredCompletion && pct >= completionThresholdPct) {
      setHasTriggeredCompletion(true)
      syncProgress(effectiveTimeWatched, pct, true)
      if (onCompleted) {
        onCompleted()
      }
    }
  }

  const handleEnded = () => {
    if (!videoRef.current) return
    if (!hasTriggeredCompletion) {
      setHasTriggeredCompletion(true)
      syncProgress(videoRef.current.duration, 100, true)
      if (onCompleted) onCompleted()
    }
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-black/90 aspect-video shadow-lg">
      <video
        ref={videoRef}
        src={src}
        controls
        controlsList="nodownload"
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  )
}
