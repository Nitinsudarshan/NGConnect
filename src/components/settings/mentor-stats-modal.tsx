"use client"

import React, { useState, useEffect } from "react"
import { Edit, Star, Video, Clock, MessageSquareQuote, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getMentorById, getMentorSessions, Mentor, LearningSession } from "@/lib/learning-center/queries"

export function MentorStatsModalContent({ mentorId }: { mentorId: string }) {
  const [mentor, setMentor] = useState<Mentor | null>(null)
  const [sessions, setSessions] = useState<LearningSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [m, s] = await Promise.all([
        getMentorById(mentorId),
        getMentorSessions(mentorId)
      ])
      setMentor(m)
      setSessions(s)
      setLoading(false)
    }
    loadData()
  }, [mentorId])

  if (loading) {
    return <div className="p-10 flex justify-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></div>
  }

  if (!mentor) {
    return <div className="p-10 flex justify-center text-muted-foreground">Mentor not found.</div>
  }

  const stats = {
    totalSessions: sessions.length,
    totalDuration: sessions.reduce((acc, curr) => acc + curr.duration_minutes, 0) + " min",
    avgOverall: mentor.rating,
    avgDelivery: 4.7, // Mocked for now until feedback table exists
    avgRelevance: 4.9,
    totalFeedback: 145,
  }

  return (
    <div className="space-y-6 max-h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{mentor.name}</h2>
            <Badge variant="outline">{mentor.role || 'No Role'}</Badge>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">{mentor.email} • {mentor.city}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm border-slate-200 dark:border-zinc-800">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Video className="w-4 h-4" /> Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card shadow-sm border-slate-200 dark:border-zinc-800">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" /> Total Duration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.totalDuration}</div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <Star className="w-4 h-4" /> Avg Overall Rating
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 flex items-end gap-2">
              {stats.avgOverall.toFixed(1)} <span className="text-sm font-normal opacity-70 mb-1">/ 5.0</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-slate-200 dark:border-zinc-800">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <MessageSquareQuote className="w-4 h-4" /> Total Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.totalFeedback}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card shadow-sm border-slate-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>A breakdown of all sessions delivered by this mentor and their individual feedback scores.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader className="bg-slate-50 dark:bg-zinc-900/50">
              <TableRow>
                <TableHead className="pl-6">Topic</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead className="text-right">Responses</TableHead>
                <TableHead className="text-right pr-6">Avg Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">No sessions found.</TableCell>
                </TableRow>
              )}
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="pl-6 font-medium">{session.topic}</TableCell>
                  <TableCell>{new Date(session.date).toLocaleDateString()}</TableCell>
                  <TableCell>{session.duration_minutes} min</TableCell>
                  <TableCell><Badge variant="secondary" className="font-normal">{session.learning_audiences?.name || 'Global'}</Badge></TableCell>
                  <TableCell className="text-right text-muted-foreground">-</TableCell>
                  <TableCell className="text-right pr-6 font-medium text-emerald-600 dark:text-emerald-400">
                    ★ -
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
