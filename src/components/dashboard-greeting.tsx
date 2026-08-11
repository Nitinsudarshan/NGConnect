"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useUserContext } from "@/contexts/user-context"
import { PageBanner } from "@/components/shared/page-banner"
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
    <PageBanner 
      title={greetingText}
      description={subtextText}
      icon={<Icon className={`h-8 w-8 ${activeTemplate.iconClass}`} />}
    />
  )
}
