"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useUserContext } from "@/contexts/user-context"
import { hourlyGreetings } from "./greetings-data"

/**
 * Returns a 0-4 index that's stable for a given calendar day but does NOT
 * repeat identically month over month (unlike `dayOfMonth % 5`, which made
 * the 1st/6th/11th/16th/21st/26th of every month show the exact same
 * greeting at a given hour, forever). Day-of-year varies its offset from
 * month to month, so the pattern only truly repeats once a year.
 */
function dailyVariantIndex(date: Date, variantCount: number): number {
  const start = Date.UTC(date.getFullYear(), 0, 1)
  const now = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const dayOfYear = Math.round((now - start) / 86_400_000)
  return dayOfYear % variantCount
}

export function DashboardGreeting() {
  const user = useUserContext()
  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    setMounted(true)
    setNow(new Date())

    // Re-check the clock once a minute so the greeting actually rolls over
    // when someone leaves the dashboard open across an hour boundary,
    // instead of only updating on the initial mount / a full refresh.
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const firstName = user?.name ? user.name.split(" ")[0] : "Friend"

  const activeTemplate = useMemo(() => {
    const currentHour = now.getHours()
    const hourData = hourlyGreetings[currentHour] ?? hourlyGreetings[12]
    const variantIndex = dailyVariantIndex(now, hourData.length)
    return hourData[variantIndex] ?? hourData[0]
  }, [now])

  // Fallback layout before mounting, to avoid a server/client hydration
  // mismatch on time-dependent content.
  if (!mounted) {
    return (
      <div
        className="relative rounded-xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-pulse"
        aria-hidden="true"
      >
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-5 bg-[repeating-linear-gradient(45deg,_#000_0,_#000_2px,_transparent_2px,_transparent_8px)] dark:bg-[repeating-linear-gradient(45deg,_#fff_0,_#fff_2px,_transparent_2px,_transparent_8px)] pointer-events-none" />
        <div className="relative z-10 flex items-start gap-6 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md p-6 rounded-xl border border-white/40 dark:border-zinc-800/50 shadow-sm">
          <div className="h-16 w-16 bg-slate-200 dark:bg-zinc-800 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded-md w-1/3" />
            <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded-md w-2/3 mt-2" />
          </div>
        </div>
      </div>
    )
  }

  const Icon = activeTemplate.icon
  const greetingText = activeTemplate.text.replace("{name}", firstName)
  const subtextText = activeTemplate.subtext.replace("{name}", firstName)

  return (
    <div
      className="relative rounded-xl p-2 sm:p-4 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden group transition-all duration-700 hover:shadow-md"
      role="region"
      aria-live="polite"
      aria-label="Dashboard greeting"
    >
      {/* Base gradient for a subtle two-tone backdrop */}
      <div className={`absolute inset-0 bg-gradient-to-br ${activeTemplate.gradient} opacity-100 pointer-events-none`} />

      {/* Pattern background simulated with repeating linear gradient */}
      <div className="absolute inset-0 opacity-[0.1] dark:opacity-[0.15] bg-[repeating-linear-gradient(45deg,_#000_0,_#000_2px,_transparent_2px,_transparent_8px)] dark:bg-[repeating-linear-gradient(45deg,_#fff_0,_#fff_2px,_transparent_2px,_transparent_8px)] pointer-events-none" />

      {/* Top-left glowing orb (Secondary tone) */}
      <div
        className="absolute -left-32 -top-32 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-1000"
      />

      {/* Bottom-right glowing orb (Dynamic primary tone) */}
      <div
        className={`absolute -right-32 -bottom-32 w-96 h-96 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-1000 ${activeTemplate.accentText}`}
        style={{ backgroundColor: "currentColor", opacity: 0.25 }}
      />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md p-6 rounded-xl border border-white/40 dark:border-zinc-800/50 shadow-sm transition-all duration-700">
        <div className={`bg-slate-50 dark:bg-zinc-900/80 p-4 rounded-full shrink-0 shadow-inner border ${activeTemplate.border} group-hover:rotate-12 transition-transform duration-500`}>
          <Icon className={`h-8 w-8 ${activeTemplate.iconClass}`} />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white transition-all duration-700">
            {greetingText}
          </h1>
          <p className="text-slate-700 dark:text-zinc-300 text-sm sm:text-base font-medium leading-relaxed max-w-2xl transition-all duration-700">
            {subtextText}
          </p>
        </div>
      </div>
    </div>
  )
}
