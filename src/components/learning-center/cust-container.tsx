"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export interface CustContainerProps {
  title?: React.ReactNode
  description?: string
  icon?: React.ReactNode
  badge?: React.ReactNode
  headerActions?: React.ReactNode
  variant?: "auto" | "gradient" | "glass" | "dark" | "minimal"
  children: React.ReactNode
  className?: string
}

const variantClasses = {
  // auto: matches stat cards (My Watch Time) glassmorphism/card bg
  auto: "bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800 shadow-sm",
  glass: "bg-card/70 border-slate-200/80 backdrop-blur-xl shadow-sm",
  gradient: "bg-gradient-to-r from-indigo-900/15 via-purple-900/10 to-indigo-900/15 border-indigo-200/80 dark:border-indigo-900/50 backdrop-blur-md shadow-md",
  dark: "bg-slate-950/90 dark:bg-black/90 border-indigo-500/40 text-slate-100 shadow-xl shadow-indigo-950/30",
  minimal: "bg-slate-50/90 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 shadow-none",
}

/**
 * CustContainer — reusable container card component.
 * By default ('auto'), renders glassmorphism in Light Mode and gradient glow in Dark Mode.
 */
export function CustContainer({
  title,
  description,
  icon,
  badge,
  headerActions,
  variant = "auto",
  children,
  className = "",
}: CustContainerProps) {
  const chosenVariantClass = variantClasses[variant] || variantClasses.auto

  return (
    <Card className={`border transition-all duration-300 overflow-hidden gap-1 pt-1 ${chosenVariantClass} ${className}`}>
      {(title || description || headerActions || badge) && (
        <CardHeader className="pb-1.5 pt-3.5 px-4 sm:px-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              {title && (
                <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                  {icon && (
                    <div className="p-1 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                      {icon}
                    </div>
                  )}
                  {title}
                </CardTitle>
              )}
              {description && (
                <CardDescription className={`text-xs text-slate-500 dark:text-slate-400 ${icon ? "pl-7" : ""}`}>
                  {description}
                </CardDescription>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {badge}
              {headerActions}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="px-4 sm:px-5 pb-3.5 pt-0">{children}</CardContent>
    </Card>
  )
}
