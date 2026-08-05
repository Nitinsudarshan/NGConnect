"use client"

import React, { useState } from "react"
import { Search, Plus, Filter, Video, Edit, Settings } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function SessionsPage() {
  const [search, setSearch] = useState("")
  
  // Mock Data
  const sessions = [
    { id: "S-105", mentor: "John Doe", topic: "Advanced React Patterns", date: "Oct 12, 2026", mode: "Online", time: "18:00", duration: "60 min", platform: "Zoom", recording: "Pending", audience: "Both" },
    { id: "S-104", mentor: "Jane Smith", topic: "Intro to UI Design", date: "Oct 15, 2026", mode: "Online", time: "10:00", duration: "90 min", platform: "Zoom", recording: "Pending", audience: "Internal Alumni" },
    { id: "S-103", mentor: "Alex Johnson", topic: "System Design Prep", date: "Oct 18, 2026", mode: "Online", time: "15:30", duration: "120 min", platform: "Google Meet", recording: "Pending", audience: "External Alumni" },
    { id: "S-102", mentor: "Sam Lee", topic: "Startup Funding 101", date: "Oct 20, 2026", mode: "Offline", time: "19:00", duration: "60 min", platform: "N/A", recording: "N/A", audience: "NG Team" },
  ]

  const filteredSessions = sessions.filter(s => 
    s.topic.toLowerCase().includes(search.toLowerCase()) || 
    s.mentor.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground">Manage upcoming and past mentorship sessions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/learning-center/settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>
          <Button asChild>
            <Link href="/learning-center/sessions/create">
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search topic or mentor..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session No.</TableHead>
              <TableHead>Mentor</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Recording</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center h-24 text-muted-foreground">
                  No sessions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium text-muted-foreground">{session.id}</TableCell>
                  <TableCell className="font-medium">{session.mentor}</TableCell>
                  <TableCell className="font-semibold">{session.topic}</TableCell>
                  <TableCell>{session.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">{session.mode}</Badge>
                  </TableCell>
                  <TableCell>{session.time}</TableCell>
                  <TableCell>{session.duration}</TableCell>
                  <TableCell>
                    {session.platform === "Zoom" ? (
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <Video className="w-3.5 h-3.5" /> Zoom
                      </span>
                    ) : session.platform}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{session.recording}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">{session.audience}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
