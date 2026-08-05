import React from "react"
import { Edit, Star, Video, Clock, MessageSquareQuote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function MentorStatsModalContent({ mentorId }: { mentorId: string }) {
  // Mock Mentor Data
  const mentor = {
    id: mentorId,
    name: mentorId === "m2" ? "Jane Smith" : mentorId === "m3" ? "Michael Chen" : "Alex Johnson",
    domain: mentorId === "m2" ? "UI/UX Design" : mentorId === "m3" ? "Frontend React" : "Backend & Systems",
    email: mentorId === "m2" ? "jane@example.com" : mentorId === "m3" ? "michael@example.com" : "alex@example.com",
    linkedin: "linkedin.com/in/mentor",
    city: mentorId === "m2" ? "Remote" : mentorId === "m3" ? "Pune" : "Bangalore",
    stats: {
      totalSessions: 12,
      totalDuration: "840 min",
      avgOverall: 4.8,
      avgDelivery: 4.7,
      avgRelevance: 4.9,
      totalFeedback: 145,
    },
    sessions: [
      { id: "S-101", topic: "Database Indexing Strategies", date: "Sep 28, 2026", duration: "60", audience: "Internal Alumni", rating: 4.9, responses: 24 },
      { id: "S-085", topic: "Microservices Anti-patterns", date: "Aug 12, 2026", duration: "90", audience: "Both", rating: 4.7, responses: 45 },
      { id: "S-042", topic: "Docker for Beginners", date: "Jan 10, 2026", duration: "60", audience: "External Alumni", rating: 4.8, responses: 76 },
    ]
  }

  return (
    <div className="space-y-6 max-h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{mentor.name}</h2>
            <Badge variant="outline">{mentor.domain}</Badge>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">{mentor.email} • {mentor.city}</p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Edit className="w-4 h-4 mr-2" /> Edit Details
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm border-slate-200 dark:border-zinc-800">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Video className="w-4 h-4" /> Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{mentor.stats.totalSessions}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card shadow-sm border-slate-200 dark:border-zinc-800">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" /> Total Duration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{mentor.stats.totalDuration}</div>
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
              {mentor.stats.avgOverall.toFixed(1)} <span className="text-sm font-normal opacity-70 mb-1">/ 5.0</span>
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
            <div className="text-2xl font-bold">{mentor.stats.totalFeedback}</div>
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
              {mentor.sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="pl-6 font-medium">{session.topic}</TableCell>
                  <TableCell>{session.date}</TableCell>
                  <TableCell>{session.duration} min</TableCell>
                  <TableCell><Badge variant="secondary" className="font-normal">{session.audience}</Badge></TableCell>
                  <TableCell className="text-right text-muted-foreground">{session.responses}</TableCell>
                  <TableCell className="text-right pr-6 font-medium text-emerald-600 dark:text-emerald-400">
                    ★ {session.rating.toFixed(1)}
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
