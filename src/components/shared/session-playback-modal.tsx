"use client"

import React, { useState, useEffect } from "react"
import { Search, Video, MessageSquare, FileText, Clock, User, Loader2, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VideoPlayer } from "@/components/shared/video-player"
import { LearningSession } from "@/lib/learning-center/queries"
import { fetchExternalTextAction } from "@/lib/learning-center/actions"

// ── VTT parser ────────────────────────────────────────────────────────────────

interface VttEntry {
  time: string
  speaker: string
  text: string
}

function parseVtt(raw: string): VttEntry[] {
  const entries: VttEntry[] = []
  const blocks = raw.replace(/\r\n/g, "\n").split(/\n\n+/)

  for (const block of blocks) {
    const lines = block.trim().split("\n")
    if (lines.length < 2) continue

    // Find the timestamp line: 00:01:15.000 --> 00:01:20.000
    const tsLine = lines.find(l => l.includes("-->"))
    if (!tsLine) continue

    const startRaw = tsLine.split("-->")[0].trim()
    // Convert HH:MM:SS.mmm or MM:SS.mmm to MM:SS
    const parts = startRaw.replace(/\.\d+$/, "").split(":")
    const time = parts.length === 3
      ? `${parts[1]}:${parts[2]}`
      : `${parts[0]}:${parts[1]}`

    // Text lines after the timestamp — may include <v Speaker>Text or plain text
    const textLines = lines.slice(lines.indexOf(tsLine) + 1).join(" ").trim()

    // Parse WebVTT speaker tag: <v Speaker Name>text
    const speakerMatch = textLines.match(/<v\s+([^>]+)>(.+)/)
    if (speakerMatch) {
      entries.push({
        time,
        speaker: speakerMatch[1].trim(),
        text: speakerMatch[2].replace(/<[^>]+>/g, "").trim(),
      })
    } else if (textLines && !textLines.startsWith("WEBVTT") && !textLines.startsWith("NOTE")) {
      entries.push({
        time,
        speaker: "Speaker",
        text: textLines.replace(/<[^>]+>/g, "").trim(),
      })
    }
  }

  return entries
}

// ── Zoom chat .txt parser ─────────────────────────────────────────────────────

interface ChatEntry {
  id: string
  time: string
  name: string
  text: string
  avatar: string
  color: string
}

const AVATAR_COLORS = [
  "bg-indigo-600", "bg-purple-600", "bg-blue-600",
  "bg-pink-600", "bg-emerald-600", "bg-amber-600",
]

function parseZoomChat(raw: string): ChatEntry[] {
  const entries: ChatEntry[] = []
  const colorMap: Record<string, string> = {}
  let colorIdx = 0
  const lines = raw.split(/\r?\n/)

  let currentEntry: ChatEntry | null = null

  for (let line of lines) {
    line = line.trim()
    if (!line) continue

    // Matches Zoom chat formats:
    // 12:34:56 From John Doe to Everyone: Hello
    // 12:34:56 From John Doe: Hello
    // 12:34:56 John Doe: Hello
    // 00:01:23 From John Doe to Waiting Room: Hello
    const match = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(?:From\s+)?(.+?)(?:\s+to\s+[^:]+)?\s*:\s*(.+)$/i)

    if (match) {
      const [, rawTime, rawName, text] = match
      const name = rawName.trim()
      const parts = rawTime.split(":")
      const time = parts.length === 3 ? `${parts[0]}:${parts[1]}` : rawTime

      if (!colorMap[name]) {
        colorMap[name] = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length]
        colorIdx++
      }

      const initials = name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?"

      currentEntry = {
        id: `${time}-${name}-${entries.length}`,
        time,
        name,
        text: text.trim(),
        avatar: initials,
        color: colorMap[name],
      }
      entries.push(currentEntry)
    } else if (currentEntry && !line.startsWith("WEBVTT") && !line.startsWith("NOTE")) {
      // Append multi-line chat message
      currentEntry.text += "\n" + line
    }
  }

  return entries
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SessionPlaybackModalProps {
  session: LearningSession | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SessionPlaybackModal({ session, open, onOpenChange }: SessionPlaybackModalProps) {
  const [activeTab, setActiveTab] = useState<"transcript" | "chat">("transcript")
  const [transcriptSearch, setTranscriptSearch] = useState("")
  const [chatSearch, setChatSearch] = useState("")

  const [transcriptEntries, setTranscriptEntries] = useState<VttEntry[]>([])
  const [chatEntries, setChatEntries] = useState<ChatEntry[]>([])
  const [loadingTranscript, setLoadingTranscript] = useState(false)
  const [loadingChat, setLoadingChat] = useState(false)

  // Fetch transcript and chat files whenever session changes
  useEffect(() => {
    if (!session || !open) return

    if (session.transcript_url) {
      setLoadingTranscript(true)
      fetchExternalTextAction(session.transcript_url).then(raw => {
        if (raw) setTranscriptEntries(parseVtt(raw))
        setLoadingTranscript(false)
      })
    } else {
      setTranscriptEntries([])
    }

    if (session.chat_url) {
      setLoadingChat(true)
      fetchExternalTextAction(session.chat_url).then(raw => {
        if (raw) setChatEntries(parseZoomChat(raw))
        setLoadingChat(false)
      })
    } else {
      setChatEntries([])
    }
  }, [session?.id, open])

  if (!session) return null

  const filteredTranscripts = transcriptEntries.filter(t =>
    t.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
    t.speaker.toLowerCase().includes(transcriptSearch.toLowerCase())
  )

  const filteredChats = chatEntries.filter(c =>
    c.text.toLowerCase().includes(chatSearch.toLowerCase()) ||
    c.name.toLowerCase().includes(chatSearch.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[95vw] max-w-[95vw] sm:max-w-[95vw] h-[90vh] max-h-[90vh] sm:max-h-[90vh] p-4 sm:p-6 overflow-hidden flex flex-col gap-4 bg-background border shadow-2xl rounded-2xl"
        style={{ width: "95vw", maxWidth: "95vw", height: "90vh", maxHeight: "90vh" }}
      >
        {/* Header: LHS Title | RHS Mentor, actual time, date, Cancel/Close button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight line-clamp-1">
            {session.topic}
          </h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <User className="w-3.5 h-3.5 text-muted-foreground" /> {session.mentors?.name || "Unknown"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" /> {session.duration_minutes || 60} mins
            </span>
            <span>•</span>
            <span>
              {new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>

            {/* Cancel / Close Button: rounded-lg box, border, red hover */}
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 dark:hover:border-rose-800 transition-colors ml-1.5 shrink-0"
              onClick={() => onOpenChange(false)}
              title="Close modal"
            >
              <X className="w-3.5 h-3.5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Main Content Layout: Video (Left) + Sidebar (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 flex-1 overflow-hidden min-h-0">
          {/* Left: Video Player */}
          <div className="lg:col-span-8 flex flex-col justify-center bg-black/95 rounded-xl overflow-hidden relative shadow-inner">
            {session.recording_url ? (
              <VideoPlayer
                src={session.recording_url}
                sourceId={session.id}
                sourceType="session_recording"
                sessionDurationMinutes={session.duration_minutes}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 aspect-video">
                <Video className="w-12 h-12 mb-3 text-slate-600 animate-pulse" />
                <p className="font-semibold text-lg text-slate-200">No Recording Yet</p>
                <p className="text-sm text-slate-400 max-w-sm mt-1">
                  Use the ✏️ Edit button on the Sessions list to add a recording link.
                </p>
              </div>
            )}
          </div>

          {/* Right: Transcripts & Chat Sidebar */}
          <div className="lg:col-span-4 flex flex-col border rounded-xl bg-card/60 backdrop-blur-sm overflow-hidden h-full">
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="flex flex-col h-full">
              {/* Tab Selector */}
              <div className="p-3 border-b bg-muted/30">
                <TabsList className="grid grid-cols-2 w-full bg-slate-100 dark:bg-zinc-800/80 p-1">
                  <TabsTrigger value="transcript" className="text-xs font-medium gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Transcript
                    {transcriptEntries.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{transcriptEntries.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="text-xs font-medium gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                    {chatEntries.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{chatEntries.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Transcript Tab */}
              <TabsContent value="transcript" className="flex-1 flex flex-col overflow-hidden m-0 p-3 space-y-3">
                <div className="relative shrink-0">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search transcript..."
                    className="pl-8 text-xs h-8 bg-background"
                    value={transcriptSearch}
                    onChange={(e) => setTranscriptSearch(e.target.value)}
                  />
                </div>
                <div className="flex-1 overflow-y-auto pr-1 space-y-3 font-sans text-xs">
                  {loadingTranscript ? (
                    <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <p>Loading transcript…</p>
                    </div>
                  ) : !session.transcript_url ? (
                    <div className="py-8 text-center text-muted-foreground space-y-1">
                      <FileText className="w-8 h-8 mx-auto opacity-30" />
                      <p>No transcript uploaded yet.</p>
                      <p className="text-[11px]">Edit this session to add a .vtt transcript link.</p>
                    </div>
                  ) : filteredTranscripts.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      {transcriptSearch ? "No transcript matching search." : "Transcript is empty or could not be parsed."}
                    </div>
                  ) : (
                    filteredTranscripts.map((t, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg border bg-background/50 hover:bg-accent/40 transition-colors space-y-1 group">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-primary">{t.speaker}</span>
                          <span className="font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded text-[10px]">{t.time}</span>
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed">{t.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Chat Tab */}
              <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0 p-3 space-y-3">
                <div className="relative shrink-0">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search chat..."
                    className="pl-8 text-xs h-8 bg-background"
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                  />
                </div>
                <div className="flex-1 overflow-y-auto pr-1 space-y-3 font-sans text-xs">
                  {loadingChat ? (
                    <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <p>Loading chat…</p>
                    </div>
                  ) : !session.chat_url ? (
                    <div className="py-8 text-center text-muted-foreground space-y-1">
                      <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
                      <p>No chat log uploaded yet.</p>
                      <p className="text-[11px]">Edit this session to add a Zoom chat .txt link.</p>
                    </div>
                  ) : filteredChats.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      {chatSearch ? "No chat messages matching search." : "Chat is empty or could not be parsed."}
                    </div>
                  ) : (
                    filteredChats.map((msg) => (
                      <div key={msg.id} className="flex items-start gap-2.5 group">
                        <div className={`w-7 h-7 rounded-full ${msg.color} flex items-center justify-center font-bold text-[11px] text-white shrink-0 shadow-sm`}>
                          {msg.avatar}
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-semibold text-foreground text-xs">{msg.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{msg.time}</span>
                          </div>
                          <div className="inline-block bg-slate-100 dark:bg-zinc-800/90 text-foreground px-3 py-1.5 rounded-2xl rounded-tl-none text-xs leading-snug break-words border border-slate-200/60 dark:border-zinc-700/50">
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
