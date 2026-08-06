"use client"

import React, { useState, useEffect } from "react"
import { Edit, Save, Loader2, Calendar, Clock, Video, Users, Link as LinkIcon, FileText, FolderTree } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { LearningSession, Mentor, LearningAudience, LearningCategory } from "@/lib/learning-center/queries"
import { updateSessionAction } from "@/lib/learning-center/actions"

interface EditSessionModalProps {
  session: LearningSession | null
  open: boolean
  onOpenChange: (open: boolean) => void
  mentors: Mentor[]
  audiences: LearningAudience[]
  categories?: LearningCategory[]
  onSaved?: (updated: Partial<LearningSession>) => void
}

export function EditSessionModal({
  session,
  open,
  onOpenChange,
  mentors,
  audiences,
  categories = [],
  onSaved,
}: EditSessionModalProps) {
  const [topic, setTopic] = useState("")
  const [mentorId, setMentorId] = useState("")
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [durationMinutes, setDurationMinutes] = useState<number | "">(60)
  const [mode, setMode] = useState("Online")
  const [platform, setPlatform] = useState("Zoom")
  const [meetingLink, setMeetingLink] = useState("")
  const [audienceId, setAudienceId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [subcategoryId, setSubcategoryId] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session) {
      setTopic(session.topic || "")
      setMentorId(session.mentor_id || "")
      // Format date for date input (YYYY-MM-DD)
      setDate(session.date ? session.date.substring(0, 10) : "")
      setStartTime(session.start_time || "")
      setDurationMinutes(session.duration_minutes || 60)
      setMode(session.mode || "Online")
      setPlatform(session.platform || "Zoom")
      setMeetingLink(session.meeting_link || "")
      setAudienceId(session.audience_id || "")
      setCategoryId(session.category_id || "")
      setSubcategoryId(session.subcategory_id || "")
      setDescription(session.description || "")
    }
  }, [session])

  if (!session) return null

  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId)
    setSubcategoryId("") // Reset subcategory when category changes
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) {
      toast.error("Topic is required")
      return
    }
    if (!date) {
      toast.error("Date is required")
      return
    }

    setSaving(true)
    try {
      const parsedDuration = typeof durationMinutes === "number" ? durationMinutes : (parseInt(durationMinutes as string, 10) || 60)
      const selectedMentor = mentors.find(m => m.id === mentorId)
      const selectedAudience = audiences.find(a => a.id === audienceId)
      const selectedCategory = categories.find(c => c.id === categoryId)
      const selectedSubcategory = selectedCategory?.subcategories?.find(s => s.id === subcategoryId)

      const payload = {
        topic,
        mentor_id: mentorId || null,
        date,
        start_time: startTime || null,
        duration_minutes: parsedDuration,
        mode,
        platform: platform || null,
        meeting_link: meetingLink || null,
        audience_id: audienceId || null,
        category_id: categoryId || null,
        subcategory_id: subcategoryId || null,
        description: description || null,
      }

      const result = await updateSessionAction(session.id, payload)

      if (!result.success) {
        toast.error(result.error || "Failed to update session")
        return
      }

      toast.success("Session updated successfully!")
      onSaved?.({
        ...payload,
        mentors: selectedMentor ? { name: selectedMentor.name } : session.mentors,
        learning_audiences: selectedAudience ? { name: selectedAudience.name } : session.learning_audiences,
        learning_categories: selectedCategory ? { name: selectedCategory.name } : session.learning_categories,
        learning_subcategories: selectedSubcategory ? { name: selectedSubcategory.name } : session.learning_subcategories,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-indigo-500" />
            Edit Session Details
          </DialogTitle>
          <DialogDescription>
            Update session information, mentor assignment, timing, and platform links.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* Topic */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Topic *</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Advanced System Design"
              required
              className="text-xs"
            />
          </div>

          {/* Mentor & Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-muted-foreground" /> Mentor
              </Label>
              <select
                value={mentorId}
                onChange={(e) => setMentorId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select a mentor</option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role || "No Role"})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-muted-foreground" /> Target Audience
              </Label>
              <select
                value={audienceId}
                onChange={(e) => setAudienceId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Global (All Alumni)</option>
                {audiences.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.audience_type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <FolderTree className="w-3.5 h-3.5 text-muted-foreground" /> Category
              </Label>
              <select
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Uncategorized (No Category)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <FolderTree className="w-3.5 h-3.5 text-muted-foreground" /> Subcategory
              </Label>
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                disabled={!categoryId}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {!categoryId ? "Select a category first" : "No Subcategory"}
                </option>
                {categoryId &&
                  (categories.find((c) => c.id === categoryId)?.subcategories || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Date, Time, Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Date *
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Start Time (IST)
              </Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Duration (mins) *
              </Label>
              <Input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value ? parseInt(e.target.value, 10) : "")}
                required
                min={1}
                className="text-xs"
              />
            </div>
          </div>

          {/* Mode & Platform */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mode</Label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-muted-foreground" /> Platform
              </Label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Zoom">Zoom</option>
                <option value="Google Meet">Google Meet</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Meeting Link */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" /> Meeting Join Link
            </Label>
            <Input
              placeholder="e.g. https://zoom.us/j/123456789"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Description
            </Label>
            <Textarea
              placeholder="Session agenda or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Session Details
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
