import React from "react"
import { GraduationCap, Clock, Sparkles } from "lucide-react"
import { PageBanner } from "@/components/shared/page-banner"

export const metadata = {
  title: "Learning Hub | Coming Soon",
}

export default function ContentHubPage() {
  return (
    <div className="p-6 space-y-8">
      <PageBanner
        title="Learning Hub"
        description="A curated space for courses, resources, and personalised learning paths."
        icon={<GraduationCap className="w-6 h-6 text-indigo-500" />}
      />

      {/* Centered Coming Soon Content */}
      <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
        {/* Icon with ping badge */}
        <div className="relative">
          <div className="p-5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl shadow-md">
            <GraduationCap className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-5 w-5 bg-indigo-500 items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </span>
          </span>
        </div>

        {/* Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
          <Clock className="w-3 h-3" />
          Coming Soon
        </div>

        {/* Description */}
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
          We&apos;re building a powerful learning hub with curated courses, progress tracking, and mentor-recommended resources — personalized for every NavGurukul member.
        </p>


      </div>
    </div>
  )
}
