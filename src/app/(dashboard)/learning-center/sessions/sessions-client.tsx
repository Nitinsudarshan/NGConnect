"use client"

import React, { useState } from "react"
import { Search, Plus, Filter, Video, Edit, Play, FileText, MessageSquare } from "lucide-react"
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
import { PageBanner } from "@/components/shared/page-banner"
import { SessionPlaybackModal } from "@/components/shared/session-playback-modal"
import { SessionMediaModal } from "@/components/learning-center/session-media-modal"
import { EditSessionModal } from "@/components/learning-center/edit-session-modal"
import { LearningSession, Mentor, LearningAudience, LearningCategory } from "@/lib/learning-center/queries"

export function SessionsClient({ 
  initialSessions,
  mentors = [],
  audiences = [],
  categories = [],
}: { 
  initialSessions: LearningSession[]
  mentors?: Mentor[]
  audiences?: LearningAudience[]
  categories?: LearningCategory[]
}) {
  const [search, setSearch] = useState("")
  const [sessions, setSessions] = useState<LearningSession[]>(initialSessions)
  const [selectedVideoSession, setSelectedVideoSession] = useState<LearningSession | null>(null)
  const [editMediaSession, setEditMediaSession] = useState<LearningSession | null>(null)
  const [editDetailsSession, setEditDetailsSession] = useState<LearningSession | null>(null)

  const filteredSessions = sessions.filter(s =>
    s.topic.toLowerCase().includes(search.toLowerCase()) ||
    (s.mentors?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.learning_categories?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.learning_subcategories?.name || "").toLowerCase().includes(search.toLowerCase())
  )

  // Update session in local state after detail or media save
  const handleSessionSaved = (sessionId: string, updated: Partial<LearningSession>) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updated } : s))
    if (selectedVideoSession?.id === sessionId) {
      setSelectedVideoSession(prev => prev ? { ...prev, ...updated } : null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageBanner
        title="Sessions"
        description="Manage upcoming and past mentorship sessions."
        icon={<Video className="w-6 h-6" />}
        actions={
          <Button asChild>
            <Link href="/learning-center/sessions/create">
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Link>
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search topic, mentor, category..."
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

      <div className="border rounded-md bg-card px-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session No.</TableHead>
              <TableHead>Mentor</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Category / Subcategory</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Media</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center h-24 text-muted-foreground">
                  No sessions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium text-muted-foreground">{session.id.substring(0, 8)}</TableCell>
                  <TableCell className="font-medium">{session.mentors?.name || "Unknown"}</TableCell>
                  <TableCell className="font-semibold">{session.topic}</TableCell>
                  <TableCell>
                    {session.learning_categories?.name ? (
                      <div className="flex flex-col text-xs">
                        <span className="font-medium text-foreground">{session.learning_categories.name}</span>
                        {session.learning_subcategories?.name && (
                          <span className="text-[11px] text-muted-foreground">{session.learning_subcategories.name}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">Uncategorized</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(session.date).toLocaleDateString("en-US")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">{session.mode}</Badge>
                  </TableCell>
                  <TableCell>
                    {session.start_time ? (
                      session.start_time.replace(/(:\d{2}):\d{2}$/, "$1")
                    ) : (
                      <span className="text-muted-foreground italic">Time TBD</span>
                    )}
                  </TableCell>
                  <TableCell>{session.duration_minutes} min</TableCell>
                  <TableCell>
                    {session.platform === "Zoom" ? (
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <Video className="w-3.5 h-3.5" /> Zoom
                      </span>
                    ) : session.platform || "N/A"}
                  </TableCell>

                  {/* Media column — icons for each available file */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {session.recording_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                          onClick={() => setSelectedVideoSession(session)}
                          title="Watch Recording"
                        >
                          <Play className="w-3 h-3 fill-indigo-600" />
                          Watch
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">No recording</span>
                      )}
                      {session.transcript_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          onClick={() => setSelectedVideoSession(session)}
                          title="View Transcript"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {session.chat_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                          onClick={() => setSelectedVideoSession(session)}
                          title="View Chat"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary" className="font-normal">{session.learning_audiences?.name || "Global"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs gap-1.5 font-medium border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 whitespace-nowrap"
                        onClick={() => setEditDetailsSession(session)}
                        title="Edit session details"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-500" />
                        Edit Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-xs gap-1.5 font-medium border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 dark:border-indigo-800 dark:text-indigo-300 dark:bg-indigo-950/30 whitespace-nowrap"
                        onClick={() => setEditMediaSession(session)}
                        title="Add or edit session recording"
                      >
                        <Plus className="w-3.5 h-3.5 text-indigo-500" />
                        {session.recording_url ? "Edit Recording" : "Add Recording"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* In-Platform Playback Modal */}
      <SessionPlaybackModal
        session={selectedVideoSession}
        open={!!selectedVideoSession}
        onOpenChange={(open) => !open && setSelectedVideoSession(null)}
      />

      {/* Media Links Edit Modal */}
      <SessionMediaModal
        session={editMediaSession}
        open={!!editMediaSession}
        onOpenChange={(open) => !open && setEditMediaSession(null)}
        onSaved={(updated) => {
          if (editMediaSession) handleSessionSaved(editMediaSession.id, updated)
        }}
      />

      {/* General Session Details Edit Modal */}
      <EditSessionModal
        session={editDetailsSession}
        open={!!editDetailsSession}
        onOpenChange={(open) => !open && setEditDetailsSession(null)}
        mentors={mentors}
        audiences={audiences}
        categories={categories}
        onSaved={(updated) => {
          if (editDetailsSession) handleSessionSaved(editDetailsSession.id, updated)
        }}
      />
    </div>
  )
}
