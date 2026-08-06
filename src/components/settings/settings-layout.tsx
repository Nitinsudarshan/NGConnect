"use client"

import React, { ReactNode } from "react"
import { LucideIcon } from "lucide-react"

export interface SettingsNavItem {
  label: string
  value: string
  icon?: LucideIcon
}

export interface SettingsLayoutProps {
  navItems: SettingsNavItem[]
  activeValue: string
  onValueChange: (value: string) => void
  children: ReactNode
}

/**
 * Shared layout component for all Settings pages across the application.
 * (e.g. Learning Center Settings, future Alumni Growth Settings, etc.)
 * 
 * Provides a standard two-column layout:
 * - LHS: Fixed-width vertical navigation card. On mobile, this transforms into a horizontal scrollable row of pills.
 * - RHS: Main content card for the selected section.
 */
export function SettingsLayout({ navItems, activeValue, onValueChange, children }: SettingsLayoutProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6 w-full items-start">
      {/* Left Column: Nav Block */}
      <div className="w-full md:w-64 flex-shrink-0 bg-card border border-slate-200 dark:border-zinc-800 rounded-xl p-2 sticky top-6 shadow-sm overflow-x-auto md:overflow-visible no-scrollbar">
        <nav className="flex md:flex-col gap-1 min-w-max md:min-w-0">
          {navItems.map((item) => {
            const isActive = activeValue === item.value
            return (
              <button
                key={item.value}
                onClick={() => onValueChange(item.value)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left
                  ${isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-zinc-800/50 hover:text-foreground"
                  }`}
              >
                {item.icon && <item.icon className="w-4 h-4 shrink-0" />}
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Right Column: Content Block */}
      <div className="flex-1 w-full min-w-0 bg-card border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        {children}
      </div>
    </div>
  )
}
