"use client"

import React, { useState } from "react"
import { HeartHandshake, ArrowRight, X } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import Link from "next/link"

export function PayForwardSidebarBanner() {
  const [dismissed, setDismissed] = useState(false)
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDismissed(true)
  }

  if (dismissed || isCollapsed) return null

  return (
    <div className="mx-2 mb-3 shrink-0 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 p-3 shadow-sm relative overflow-hidden">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-1.5 right-1.5 p-0.5 rounded-md text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Icon + Title */}
      <div className="flex items-center gap-2 mb-1.5 pr-4">
        <div className="p-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-md shrink-0">
          <HeartHandshake className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 leading-tight">
          Pay It Forward
        </p>
      </div>

      {/* Body */}
      <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed mb-2">
        Help fellow alumni by mentoring or sharing opportunities.
      </p>

      {/* CTA */}
      <a
        href="mailto:alumni@navgurukul.org?subject=I%20want%20to%20Pay%20It%20Forward"
        className="flex items-center gap-1 text-[10px] font-medium text-white bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-md px-2 py-1 w-full justify-center transition-colors"
      >
        <ArrowRight className="w-3 h-3 shrink-0" />
        Get Started
      </a>
    </div>
  )
}
