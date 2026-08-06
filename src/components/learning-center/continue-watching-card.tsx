"use client"

import React from "react"
import { Play, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ContinueWatchingItem, LearningSession } from "@/lib/learning-center/queries"

export interface ContinueWatchingCardProps {
  item?: ContinueWatchingItem
  session?: LearningSession
  watchedSeconds?: number
  percentWatched?: number
  onResume: (session: LearningSession) => void
  className?: string
}

function formatSecondsToMinutes(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

export function ContinueWatchingCard({
  item,
  session,
  watchedSeconds,
  percentWatched,
  onResume,
  className = "",
}: ContinueWatchingCardProps) {
  const sess = session || item?.session
  if (!sess) return null

  const watched = watchedSeconds ?? item?.watched_seconds ?? 0
  const durationMins = sess.duration_minutes && sess.duration_minutes > 0 ? sess.duration_minutes : 60
  const durationSecs = durationMins * 60

  let percent = percentWatched ?? item?.percent_watched ?? 0
  if (!percent || percent === 0) {
    if (watched > 0) {
      percent = Math.min(Math.max(Math.round((watched / durationSecs) * 100), 1), 99)
    } else {
      percent = 0
    }
  }

  return (
    <Card
      className={`group overflow-hidden bg-card/85 hover:bg-card hover:shadow-md py-3 rounded-lg transition-all duration-300 border border-slate-200/80 dark:border-zinc-800 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700/60 ${className}`}
    >
      {/* Compact Inner Body with reduced padding */}
      <div className="px-5 py-1 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Top Meta: Time Elapsed */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Clock className="w-3 h-3 text-indigo-500 mr-1" />  Watch Progress
            </span>
            <span className="font-mono text-[10px] bg-muted/60 px-1.5 py-0.5 rounded border border-slate-200/40 dark:border-zinc-800">
              {formatSecondsToMinutes(watched)} / {durationMins}m
            </span>
          </div>

          {/* Title & Mentor */}
          <div>
            <h4 className="font-semibold text-xs sm:text-sm line-clamp-1 text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {sess.topic}
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
              Mentor: <span className="font-medium text-slate-700 dark:text-slate-300">{sess.mentors?.name || "Unknown"}</span>
            </p>
          </div>
        </div>

        {/* Video Completion Progress Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between items-center text-[10px] font-medium">
            <span className="text-slate-500 dark:text-slate-400">Completed</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{percent}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-800/90 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-zinc-700/50">
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
              style={{ width: `${Math.max(percent, 2)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Compact Button Footer */}
      <div className="px-3 pb-3 pt-0">
        <Button
          size="sm"
          className="w-full h-8 text-xs font-semibold gap-1.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xs hover:shadow-indigo-500/25 rounded-lg transition-all duration-200 group/btn"
          onClick={() => onResume(sess)}
        >
          <Play className="w-3 h-3 fill-white group-hover/btn:scale-110 transition-transform" /> Resume
        </Button>
      </div>
    </Card>
  )
}
