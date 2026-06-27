"use client"

import React, { useState } from "react"
import { useUserContext } from "@/contexts/user-context"
import { hourlyGreetings } from "@/components/dashboard-greeting"
import { ArrowLeft, Search, Sun, Moon, Sunrise, Sunset } from "lucide-react"
import Link from "next/link"

export default function GreetingsPreviewPage() {
  const user = useUserContext()
  const firstName = user?.name ? user.name.split(" ")[0] : "Friend"
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "morning" | "afternoon" | "evening" | "night">("all")

  // Helper to categorize hours
  const getPeriod = (hour: number): "morning" | "afternoon" | "evening" | "night" => {
    if (hour >= 5 && hour < 12) return "morning"
    if (hour >= 12 && hour < 17) return "afternoon"
    if (hour >= 17 && hour < 22) return "evening"
    return "night"
  }

  // Format hour label
  const formatHourLabel = (hour: number) => {
    const period = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 === 0 ? 12 : hour % 12
    return `${displayHour}:00 ${period} (${hour}:00)`
  }

  const periods = {
    all: { label: "All Hours 📅", bg: "bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-200" },
    morning: { label: "Morning 🌄 (5 AM - 12 PM)", bg: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300" },
    afternoon: { label: "Afternoon ☀️ (12 PM - 5 PM)", bg: "bg-sky-100 text-sky-800 dark:bg-sky-950/30 dark:text-sky-300" },
    evening: { label: "Evening 🌅 (5 PM - 10 PM)", bg: "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300" },
    night: { label: "Night 🌌 (10 PM - 5 AM)", bg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300" },
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 mb-2">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm font-medium transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Hourly Greetings Preview 🎨
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">
            Displaying all 120 creative greetings (5 per hour) with active gradients, icons, and emojis.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-4 rounded-xl">
        {/* Period Tabs */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(periods) as Array<keyof typeof periods>).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer ${
                activeTab === tab
                  ? periods[tab].bg + " shadow-sm scale-[1.02]"
                  : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-850"
              }`}
            >
              {periods[tab].label}
            </button>
          ))}
        </div>

        {/* Search Query */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search greeting text or subtext..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-slate-500/20 text-slate-950 dark:text-white"
          />
        </div>
      </div>

      {/* Greetings List */}
      <div className="space-y-12">
        {Object.entries(hourlyGreetings)
          .map(([hourStr, templates]) => {
            const hour = parseInt(hourStr)
            const period = getPeriod(hour)

            // Filter by active tab
            if (activeTab !== "all" && activeTab !== period) return null

            // Filter by search query
            const filteredTemplates = templates.filter(
              (t) =>
                t.text(firstName).toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.subtext(firstName).toLowerCase().includes(searchQuery.toLowerCase())
            )

            if (filteredTemplates.length === 0) return null

            return (
              <div key={hour} className="space-y-4 border-l-2 border-slate-200 dark:border-zinc-800 pl-4 md:pl-6">
                
                {/* Hour Header */}
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-900 px-3 py-1 rounded-md border border-slate-200 dark:border-zinc-800">
                    {formatHourLabel(hour)}
                  </h2>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${
                    period === "morning" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" :
                    period === "afternoon" ? "bg-sky-100 text-sky-800 dark:bg-sky-950/30 dark:text-sky-300" :
                    period === "evening" ? "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300" :
                    "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300"
                  }`}>
                    {period}
                  </span>
                </div>

                {/* Grid of 5 Greeting Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template, idx) => (
                    <div
                      key={idx}
                      className={`relative overflow-hidden bg-gradient-to-br ${template.gradient} bg-white dark:bg-zinc-950 border ${template.border} p-5 rounded-[12px] shadow-sm hover:shadow transition-all duration-500 flex flex-col justify-between`}
                    >
                      <div className="absolute top-2 right-2 text-xs font-mono text-slate-400 bg-white/50 dark:bg-zinc-900/50 px-1.5 py-0.5 rounded border border-slate-150 dark:border-zinc-800">
                        Var {idx + 1}
                      </div>

                      <div className="flex items-start gap-3 mt-2">
                        <div className="flex-1 space-y-1">
                          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                            {template.text(firstName)}
                          </h3>
                          <p className="text-slate-600 dark:text-zinc-300 text-xs sm:text-sm font-medium leading-relaxed">
                            {template.subtext(firstName)}
                          </p>
                        </div>
                        <div className="flex-shrink-0 bg-slate-50/50 dark:bg-zinc-900/60 p-2 rounded-full border border-slate-100 dark:border-zinc-850 shadow-inner">
                          {template.icon}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
      </div>

    </div>
  )
}
