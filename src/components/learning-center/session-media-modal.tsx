"use client"

import React, { useState, useEffect } from "react"
import { Link2, Video, FileText, MessageSquare, Loader2, Save, ExternalLink, Info, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { LearningSession } from "@/lib/learning-center/queries"
import { updateSessionMedia } from "@/lib/learning-center/actions"

interface SessionMediaModalProps {
  session: LearningSession | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (updated: Partial<LearningSession>) => void
}

/**
 * Converts various Google Drive share/view URLs to the embeddable preview format.
 * Input:  https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * Output: https://drive.google.com/file/d/FILE_ID/preview
 */
function normalizeDriveUrl(url: string): string {
  const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (match) {
    return `https://drive.google.com/file/d/${match[1]}/preview`
  }
  // Handle /open?id= format
  const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/)
  if (openMatch) {
    return `https://drive.google.com/file/d/${openMatch[1]}/preview`
  }
  return url
}

function isDriveUrl(url: string): boolean {
  return url.includes("drive.google.com")
}

export function SessionMediaModal({
  session,
  open,
  onOpenChange,
  onSaved,
}: SessionMediaModalProps) {
  const [recordingUrl, setRecordingUrl] = useState("")
  const [transcriptUrl, setTranscriptUrl] = useState("")
  const [chatUrl, setChatUrl] = useState("")
  const [durationMinutes, setDurationMinutes] = useState<number | "">("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session) {
      setRecordingUrl(session.recording_url || "")
      setTranscriptUrl(session.transcript_url || "")
      setChatUrl(session.chat_url || "")
      setDurationMinutes(session.duration_minutes || "")
    }
  }, [session])

  if (!session) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      // Auto-normalize Google Drive links to embeddable format
      const normalizedRecording = recordingUrl && isDriveUrl(recordingUrl)
        ? normalizeDriveUrl(recordingUrl)
        : recordingUrl || null
      const normalizedTranscript = transcriptUrl || null
      const normalizedChat = chatUrl || null
      const parsedDuration = typeof durationMinutes === "number" ? durationMinutes : (parseInt(durationMinutes as string, 10) || null)

      const result = await updateSessionMedia(session.id, {
        recording_url: normalizedRecording,
        transcript_url: normalizedTranscript,
        chat_url: normalizedChat,
        duration_minutes: parsedDuration,
      })

      if (!result.success) {
        toast.error(result.error || "Failed to save media links")
        return
      }

      toast.success("Session media updated!")
      onSaved?.({
        recording_url: normalizedRecording,
        transcript_url: normalizedTranscript,
        chat_url: normalizedChat,
        ...(parsedDuration ? { duration_minutes: parsedDuration } : {}),
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-500" />
            Session Media Links
          </DialogTitle>
          <DialogDescription className="line-clamp-1">
            {session.topic}
          </DialogDescription>
        </DialogHeader>

        {/* Google Drive tip */}
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/10 p-3 text-sm text-blue-700 dark:text-blue-300">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">Using Google Drive?</p>
            <p className="text-xs opacity-90">
              Right-click your file → <strong>Share → Anyone with the link</strong> → Copy. Paste the link here — we'll auto-convert it to the embed format.
            </p>
          </div>
        </div>

        <div className="space-y-5 pt-1">
          {/* Recording URL */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Video className="w-4 h-4 text-indigo-500" />
              Recording <span className="text-xs text-muted-foreground font-normal">(mp4 or Google Drive video link)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://drive.google.com/file/d/... or direct .mp4 URL"
                value={recordingUrl}
                onChange={(e) => setRecordingUrl(e.target.value)}
                className="text-xs"
              />
              {recordingUrl && (
                <Button variant="ghost" size="icon" asChild className="shrink-0">
                  <a href={recordingUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
            {recordingUrl && isDriveUrl(recordingUrl) && !recordingUrl.includes("/preview") && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                ⚡ Will be auto-converted to embed format on save
              </p>
            )}
          </div>

          {/* Transcript URL */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <FileText className="w-4 h-4 text-emerald-500" />
              Transcript <span className="text-xs text-muted-foreground font-normal">(.vtt or Google Drive link)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://drive.google.com/file/d/... or direct .vtt URL"
                value={transcriptUrl}
                onChange={(e) => setTranscriptUrl(e.target.value)}
                className="text-xs"
              />
              {transcriptUrl && (
                <Button variant="ghost" size="icon" asChild className="shrink-0">
                  <a href={transcriptUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Zoom exports .vtt files after the meeting. The transcript will be displayed with timestamps in the player.
            </p>
          </div>

          {/* Chat URL */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="w-4 h-4 text-purple-500" />
              Chat Log <span className="text-xs text-muted-foreground font-normal">(.txt or Google Drive link)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://drive.google.com/file/d/... or direct .txt URL"
                value={chatUrl}
                onChange={(e) => setChatUrl(e.target.value)}
                className="text-xs"
              />
              {chatUrl && (
                <Button variant="ghost" size="icon" asChild className="shrink-0">
                  <a href={chatUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Zoom exports meeting_saved_chat.txt. Upload to Drive and share the link here.
            </p>
          </div>

          {/* Actual Video Duration (Mins) */}
          <div className="space-y-2 pt-2 border-t">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Clock className="w-4 h-4 text-blue-500" />
              Actual Video Duration (minutes)
            </Label>
            <Input
              type="number"
              placeholder="e.g. 31"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value ? parseInt(e.target.value, 10) : "")}
              className="text-xs w-36"
            />
            <p className="text-[11px] text-muted-foreground">
              Overrides the scheduled session duration with the actual length of the recording.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Links
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
