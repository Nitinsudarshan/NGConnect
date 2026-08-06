"use client"

import React from "react"
import { Play, PlayCircle, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LearningSession } from "@/lib/learning-center/queries"

export interface PastSessionCardProps {
  session: LearningSession
  onPlay: (session: LearningSession) => void
  percentWatched?: number
  className?: string
}

export function PastSessionCard({
  session,
  onPlay,
  percentWatched,
  className = "",
}: PastSessionCardProps) {
  const durationMins = session.duration_minutes && session.duration_minutes > 0 ? session.duration_minutes : 60
  const hasProgress = typeof percentWatched === "number" && percentWatched > 0
  const isCompleted = hasProgress && percentWatched >= 95

  return (
    <Card
      onClick={() => onPlay(session)}
      className={`group gap-0 overflow-hidden rounded-lg bg-card/85 hover:bg-card hover:shadow-md py-0 transition-all duration-300 border border-slate-200/80 dark:border-zinc-800 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700/60 cursor-pointer ${className}`}
    >
      {/* Top Video Preview Header with Category Badge & Watch Progress ON TOP */}
      <div className="relative h-32 w-full bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 overflow-hidden flex items-center justify-center">
        {/* Radial background graphic */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_70%)]" />

        {/* Category Badges ON TOP */}
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 flex-wrap max-w-[85%]">
          {session.learning_categories?.name ? (
            <Badge className="bg-indigo-600/90 hover:bg-indigo-600 text-white font-medium text-[10px] px-2 py-0.5 rounded-lg shadow-sm backdrop-blur-md border border-indigo-400/30">
              {session.learning_categories.name}
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-white text-[10px] font-normal border border-white/10 rounded-lg">
              {session.learning_audiences?.name || "Global"}
            </Badge>
          )}
        </div>

        {/* Play Button Overlay */}
        <div className="relative z-10 flex flex-col items-center gap-1">
          <div className="bg-indigo-600/90 text-white p-2 rounded-full shadow-lg group-hover:scale-110 group-hover:bg-indigo-500 transition-all duration-300">
            <PlayCircle className="w-5 h-5 fill-white/20" />
          </div>
          <span className="text-[10px] font-medium text-indigo-200 tracking-wide bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm border border-indigo-500/20">
            {hasProgress && !isCompleted ? `Resume (${percentWatched}%)` : "Watch Session"}
          </span>
        </div>
      </div>

      {/* Compact Inner Body */}
      <div className="px-5 py-2.5 flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1.5">
          {/* Top Meta: Duration & Date */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Clock className="w-3 h-3 text-indigo-500 mr-0.5" /> Duration: {durationMins}m
            </span>
            <span className="font-mono text-[10px] bg-muted/60 px-1.5 py-0.5 rounded border border-slate-200/40 dark:border-zinc-800">
              {new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          {/* Title & Mentor */}
          <div>
            <h4 className="font-semibold text-xs sm:text-sm line-clamp-1 text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {session.topic}
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
              Mentor: <span className="font-medium text-slate-700 dark:text-slate-300">{session.mentors?.name || "Unknown"}</span>
            </p>
          </div>
        </div>

        {/* Video Completion Progress Bar if user has progress */}
        {hasProgress && (
          <div className="space-y-1 pt-1">
            <div className="flex justify-between items-center text-[10px] font-medium">
              <span className="text-slate-500 dark:text-slate-400">Watched Progress</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{percentWatched}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-zinc-800/90 h-1.5 rounded-full overflow-hidden border border-slate-200/50 dark:border-zinc-700/50">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(percentWatched, 2)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Compact Button Footer */}
      <div className="p-3 pt-1">
        <Button
          size="sm"
          className="w-full h-8 text-xs font-semibold gap-1.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xs hover:shadow-indigo-500/25 rounded-lg transition-all duration-200 group/btn"
          onClick={(e) => {
            e.stopPropagation()
            onPlay(session)
          }}
        >
          <Play className="w-3 h-3 fill-white group-hover/btn:scale-110 transition-transform" />
          {hasProgress && !isCompleted ? `Resume Recording (${percentWatched}%)` : "Watch Recording"}
        </Button>
      </div>
    </Card>
  )
}
