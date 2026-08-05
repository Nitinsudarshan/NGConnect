"use client"

import React, { useState } from "react"
import { Search, Filter, PlayCircle, Clock, CalendarDays, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function RecordingsPage() {
  const [search, setSearch] = useState("")
  
  // Mock Data (will be replaced by Supabase data later)
  const recordings = [
    { id: "S-101", topic: "Database Indexing Strategies", mentor: "Alex Johnson", date: "Sep 28, 2026", duration: "60 min", audience: "Internal Alumni", thumbnail: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=600", progress: 100 },
    { id: "S-100", topic: "Resume Review Workshop", mentor: "Jane Smith", date: "Sep 20, 2026", duration: "90 min", audience: "Both", thumbnail: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=600", progress: 45 },
    { id: "S-099", topic: "Intro to System Design", mentor: "Michael Chen", date: "Sep 15, 2026", duration: "120 min", audience: "External Alumni", thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600", progress: 0 },
    { id: "S-098", topic: "Negotiating your Salary", mentor: "Sam Lee", date: "Sep 05, 2026", duration: "60 min", audience: "Internal Alumni", thumbnail: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=600", progress: 0 },
  ]

  const filteredRecordings = recordings.filter(r => r.topic.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recordings Library</h1>
          <p className="text-muted-foreground mt-1">Watch past sessions and complete your feedback.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topics..."
              className="pl-8 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="bg-card">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRecordings.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
            No recordings found matching your search.
          </div>
        ) : (
          filteredRecordings.map((rec) => (
            <Link key={rec.id} href={`/learning-center/recordings/${rec.id}`}>
              <Card className="overflow-hidden hover:shadow-md transition-all group cursor-pointer h-full flex flex-col bg-card/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800">
                <div className="relative aspect-video bg-muted overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={rec.thumbnail} alt={rec.topic} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/20 backdrop-blur-md rounded-full p-3">
                      <PlayCircle className="w-10 h-10 text-white drop-shadow-md" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-[10px] font-medium rounded backdrop-blur-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {rec.duration}
                  </div>
                  
                  {/* Progress bar overlay */}
                  {rec.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                      <div className="h-full bg-blue-500" style={{ width: `${rec.progress}%` }} />
                    </div>
                  )}
                </div>
                <CardContent className="p-4 flex-1">
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <Badge variant="outline" className="text-[10px] text-muted-foreground font-normal bg-background/50">
                        {rec.id}
                      </Badge>
                      {rec.progress === 100 && (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] border-emerald-200 dark:border-emerald-800">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-base line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {rec.topic}
                    </h3>
                    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        <span>{rec.mentor}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>{rec.date}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
