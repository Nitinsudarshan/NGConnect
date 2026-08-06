import React from "react"
import Link from "next/link"
import { ChevronLeft, Star, Video, Users, Clock, MessageSquareQuote, Linkedin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MentorEditButton } from "@/components/settings/mentor-edit-button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getMentorById, getMentorSessions } from "@/lib/learning-center/queries"

export default async function MentorDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const [mentor, sessions] = await Promise.all([
    getMentorById(id),
    getMentorSessions(id)
  ])

  if (!mentor) {
    return <div className="p-10 flex justify-center text-muted-foreground">Mentor not found.</div>
  }
  // Aggregate stats from real sessions
  const stats = {
    totalSessions: sessions.length,
    totalDuration: sessions.reduce((acc, curr) => acc + curr.duration_minutes, 0) + " min",
    avgOverall: mentor.rating,
    avgDelivery: 4.7, // Mocked for now until feedback table exists
    avgRelevance: 4.9,
    totalFeedback: 145,
  }

  const getMentorStatusColor = (status: string) => {
    switch (status) {
      case 'Being Reviewed': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
      case 'Waitlisted': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
      case 'Onboarded': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      case 'Active': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
      case 'Inactive': return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-900/50'
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200'
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/learning-center/settings">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{mentor.name}</h1>
              <Badge variant="outline">{mentor.role || 'No Role'}</Badge>
              <Badge variant="outline" className={`font-normal ${getMentorStatusColor(mentor.status)}`}>
                {mentor.status}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm mt-1">
              <span>{mentor.email}</span>
              <span>•</span>
              <span>{mentor.city}</span>
              {mentor.contact_number && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {mentor.contact_number}</span>
                </>
              )}
              {mentor.linkedin_url && (
                <>
                  <span>•</span>
                  <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:text-blue-600">
                    <Linkedin className="w-3 h-3" /> LinkedIn
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
        <MentorEditButton mentor={mentor} />
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

        <div className="grid grid-cols-1 gap-2">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Content Relevance</div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(stats.avgRelevance/5)*100}%` }}></div>
                    </div>
                    <span className="text-sm font-medium">{stats.avgRelevance}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Delivery & Engagement</div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(stats.avgDelivery/5)*100}%` }}></div>
                    </div>
                    <span className="text-sm font-medium">{stats.avgDelivery}</span>
                  </div>
                </div>
        </div>

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
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-zinc-900/50">
              <TableRow>
                <TableHead className="pl-6">ID</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead className="text-right pr-6">Avg Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {sessions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">No sessions found for this mentor.</TableCell>
                  </TableRow>
                )}
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="pl-6 font-medium text-muted-foreground">{session.id.substring(0, 8)}</TableCell>
                    <TableCell className="font-medium">{session.topic}</TableCell>
                    <TableCell>{new Date(session.date).toLocaleDateString("en-US")}</TableCell>
                    <TableCell>{session.duration_minutes} min</TableCell>
                    <TableCell><Badge variant="secondary" className="font-normal">{session.learning_audiences?.name || 'Global'}</Badge></TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                        <Star className="w-3.5 h-3.5 fill-emerald-600 dark:fill-emerald-400" />
                        -
                        <span className="text-muted-foreground text-xs font-normal">(- resp)</span>
                      </div>
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
