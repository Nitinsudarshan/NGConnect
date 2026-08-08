"use client"

import React, { ReactNode, useState, useEffect } from "react"
import { LucideIcon, ChevronRight } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export interface SettingsNavItem {
  label: string
  value: string
  icon?: LucideIcon
  group?: string
}

export interface SettingsLayoutProps {
  navItems: SettingsNavItem[]
  activeValue: string
  onValueChange: (value: string) => void
  children: ReactNode
}

/**
 * Shared layout component for all Settings pages across the application.
 * (e.g. Learning Center Settings, Alumni Growth Settings, etc.)
 *
 * Provides a standard two-column layout:
 * - LHS: Vertical navigation card with collapsible group headers.
 *   - Groups expand automatically when an item inside them is selected.
 *   - Inactive groups collapse to just their header title + chevron icon.
 * - RHS: Main content card for the selected section.
 */
export function SettingsLayout({ navItems, activeValue, onValueChange, children }: SettingsLayoutProps) {
  // Extract unique groups in order of appearance
  const groupKeys = Array.from(new Set(navItems.map((item) => item.group)))

  // State to track open/collapsed state of each group
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  // Automatically expand group containing the active item
  useEffect(() => {
    const activeItem = navItems.find((i) => i.value === activeValue)
    if (activeItem?.group) {
      setOpenGroups((prev) => ({
        ...prev,
        [activeItem.group!]: true,
      }))
    }
  }, [activeValue, navItems])

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }))
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full items-start">
      {/* Left Column: Nav Block */}
      <div className="w-full md:w-64 flex-shrink-0 bg-card border border-slate-200 dark:border-zinc-800 rounded-xl p-2 sticky top-6 shadow-sm overflow-x-auto md:overflow-visible no-scrollbar">
        <nav className="flex md:flex-col gap-1 min-w-max md:min-w-0">
          {groupKeys.map((group) => {
            if (!group) {
              // Render ungrouped items directly
              return navItems
                .filter((item) => !item.group)
                .map((item) => {
                  const isActive = activeValue === item.value
                  return (
                    <button
                      key={item.value}
                      onClick={() => onValueChange(item.value)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left
                        ${isActive
                          ? "bg-primary! text-primary-foreground! shadow-sm font-semibold hover:bg-primary! hover:text-primary-foreground!"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                    >
                      {item.icon && (
                        <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary-foreground!" : "text-muted-foreground"}`} />
                      )}
                      <span>{item.label}</span>
                    </button>
                  )
                })
            }

            const groupItems = navItems.filter((item) => item.group === group)
            const hasActiveItem = groupItems.some((item) => item.value === activeValue)
            const isOpen = openGroups[group] ?? hasActiveItem

            return (
              <Collapsible
                key={group}
                open={isOpen}
                onOpenChange={() => toggleGroup(group)}
                className="w-full"
              >
                {/* Group Header Trigger */}
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider w-full text-left transition-colors select-none group/trigger
                      ${hasActiveItem
                        ? "text-foreground font-bold"
                        : "text-muted-foreground/80 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                      }`}
                  >
                    <span>{group}</span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-90 text-foreground" : "text-muted-foreground/60"
                        }`}
                    />
                  </button>
                </CollapsibleTrigger>

                {/* Sub-items list */}
                <CollapsibleContent className="space-y-0.5 pl-2 ml-2 border-l border-slate-200 dark:border-zinc-800/80 my-1">
                  {groupItems.map((item) => {
                    const isActive = activeValue === item.value
                    return (
                      <button
                        key={item.value}
                        onClick={() => onValueChange(item.value)}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors w-full text-left
                          ${isActive
                            ? "bg-primary! text-primary-foreground! font-semibold shadow-xs hover:bg-primary! hover:text-primary-foreground!"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`}
                      >
                        {item.icon && (
                          <item.icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-primary-foreground!" : "text-muted-foreground"}`} />
                        )}
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
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
