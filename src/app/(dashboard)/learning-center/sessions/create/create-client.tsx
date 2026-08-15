"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Video, Save, Loader2, Info, Link2, FileText, MessageSquare, FolderTree } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { Mentor, LearningAudience, LearningSessionType, LearningCategory } from "@/lib/learning-center/queries"
import { createSessionAction, generateGoogleMeetLinkAction } from "@/lib/learning-center/actions"
import { HelpModal } from "@/components/shared/HelpModal"

export function CreateSessionClient({ 
  mentors, 
  audiences, 
  sessionTypes,
  categories = []
}: { 
  mentors: Mentor[]
  audiences: LearningAudience[]
  sessionTypes: LearningSessionType[]
  categories?: LearningCategory[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showMediaLinks, setShowMediaLinks] = useState(false)

  const [topic, setTopic] = useState("")
  const [mentorId, setMentorId] = useState("")
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [durationMinutes, setDurationMinutes] = useState<number | "">(60)
  const [mode, setMode] = useState("Online")
  const [platform, setPlatform] = useState("Zoom")
  const [meetingLink, setMeetingLink] = useState("")
  const [generatingGmeet, setGeneratingGmeet] = useState(false)
  const [audienceId, setAudienceId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [subcategoryId, setSubcategoryId] = useState("")
  const [recordingUrl, setRecordingUrl] = useState("")
  const [transcriptUrl, setTranscriptUrl] = useState("")
  const [chatUrl, setChatUrl] = useState("")

  const generalAudiences = audiences.filter(a => a.audience_type === "general")
  const campusAudiences = audiences.filter(a => a.audience_type === "campus")
  const courseAudiences = audiences.filter(a => a.audience_type === "course")
  const batchAudiences = audiences.filter(a => a.audience_type === "batch")
  
  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId)
    setSubcategoryId("") // Reset subcategory when category changes
  }

  const handleGenerateGmeet = async () => {
    if (!topic.trim()) {
      toast.error("Topic is required to generate a Google Meet link")
      return
    }
    if (!date) {
      toast.error("Date is required to generate a Google Meet link")
      return
    }
    setGeneratingGmeet(true)
    try {
      const parsedDuration = typeof durationMinutes === "number" ? durationMinutes : (parseInt(durationMinutes as string, 10) || 60)
      const res = await generateGoogleMeetLinkAction(topic, date, startTime, parsedDuration)
      if (res.success && res.meetLink) {
        setMeetingLink(res.meetLink)
        toast.success("Google Meet link generated successfully!")
      } else {
        toast.error(res.error || "Failed to generate Google Meet link")
      }
    } finally {
      setGeneratingGmeet(false)
    }
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

    setLoading(true)
    try {
      const parsedDuration = typeof durationMinutes === "number" ? durationMinutes : (parseInt(durationMinutes as string, 10) || 60)
      const res = await createSessionAction({
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
        recording_url: recordingUrl || null,
        transcript_url: transcriptUrl || null,
        chat_url: chatUrl || null,
      })

      if (!res.success) {
        toast.error(res.error || "Failed to schedule session")
        return
      }

      toast.success("Session scheduled successfully!")
      router.push("/learning-center/sessions")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Session</h1>
          <p className="text-muted-foreground">Schedule a new mentorship session and optionally generate a Zoom link.</p>
        </div>
        <HelpModal helpId="learning_center.create_session" />
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <CardDescription>Basic information for the session tracking.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Topic *</label>
                <Input 
                  placeholder="e.g. Introduction to React Native" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mentor</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={mentorId}
                  onChange={(e) => setMentorId(e.target.value)}
                >
                  <option value="">Select a mentor</option>
                  {mentors.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role || 'No Role'})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date *</label>
                <Input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time (IST) <span className="text-muted-foreground font-normal">(Optional)</span></label>
                <Input 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (mins) *</label>
                <Input 
                  type="number" 
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value ? parseInt(e.target.value, 10) : "")}
                  required 
                  min={1}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mode</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                >
                  <option value="Zoom">Zoom (Auto-create)</option>
                  <option value="Google Meet">Google Meet</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Audience</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={audienceId}
                  onChange={(e) => setAudienceId(e.target.value)}
                >
                  <option value="">Global (All Alumni)</option>
                  {generalAudiences.length > 0 && (
                    <optgroup label="General">
                      {generalAudiences.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </optgroup>
                  )}
                  {campusAudiences.length > 0 && (
                    <optgroup label="By Campus">
                      {campusAudiences.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </optgroup>
                  )}
                  {courseAudiences.length > 0 && (
                    <optgroup label="By Course">
                      {courseAudiences.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </optgroup>
                  )}
                  {batchAudiences.length > 0 && (
                    <optgroup label="By Batch">
                      {batchAudiences.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <FolderTree className="w-4 h-4 text-muted-foreground" /> Category
                </label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="">Uncategorized (No Category)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <FolderTree className="w-4 h-4 text-muted-foreground" /> Subcategory
                </label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  disabled={!categoryId}
                >
                  <option value="">
                    {!categoryId ? "Select a category first" : "No Subcategory"}
                  </option>
                  {categoryId && (categories.find(c => c.id === categoryId)?.subcategories || []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 col-span-full">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-muted-foreground" /> Meeting Join Link
                  </label>
                  {platform === "Google Meet" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateGmeet}
                      disabled={generatingGmeet}
                      className="h-7 text-xs px-2.5 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                    >
                      {generatingGmeet ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Video className="w-3.5 h-3.5 mr-1" />}
                      Generate Meet Link
                    </Button>
                  )}
                </div>
                <Input
                  placeholder={platform === "Google Meet" ? "e.g. https://meet.google.com/abc-defg-hij" : "e.g. https://zoom.us/j/123456789"}
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                />
              </div>
            </div>
            
            {platform === "Zoom" && (
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-md p-4 mt-2">
                <div className="flex gap-2 text-blue-700 dark:text-blue-400">
                  <Info className="w-5 h-5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold">Zoom Auto-creation enabled</p>
                    <p className="opacity-90 mt-1">This will automatically schedule a meeting on the NGConnect Zoom Enterprise account and generate join links for the mentor and participants.</p>
                  </div>
                </div>
              </div>
            )}

            {platform === "Google Meet" && (
              <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-md p-4 mt-2">
                <div className="flex gap-2 text-emerald-700 dark:text-emerald-400">
                  <Video className="w-5 h-5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold">Google Meet Integration</p>
                    <p className="opacity-90 mt-1">Click &apos;Generate Meet Link&apos; above to schedule a Google Meet event directly in your connected Google Workspace Calendar.</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800">
          <CardHeader className="cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors rounded-t-xl" onClick={() => setShowAdvanced(!showAdvanced)}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Advanced: Communication Overrides</CardTitle>
                <CardDescription>Override default notification timings and channels for this specific session.</CardDescription>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
          
          {showAdvanced && (
            <CardContent className="pt-4 border-t space-y-4">
              <p className="text-sm text-muted-foreground mb-4">By default, sessions use the master communication settings. Toggle options below to customize for this session.</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <h5 className="font-medium text-sm">Announcement</h5>
                    <p className="text-xs text-muted-foreground">T-2 days via Email</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300" />
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <h5 className="font-medium text-sm">T-1 Day Reminder</h5>
                    <p className="text-xs text-muted-foreground">Sent 1 day before via selected channels</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300" />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <h5 className="font-medium text-sm">Morning-of Reminder (9 AM)</h5>
                    <p className="text-xs text-muted-foreground">Sent at 9 AM on the day of the session</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300" />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <h5 className="font-medium text-sm">Feedback Collection</h5>
                    <p className="text-xs text-muted-foreground">Send feedback form post-session</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300" />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Media Links Card */}
        <Card className="bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800">
          <CardHeader
            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors rounded-t-xl"
            onClick={() => setShowMediaLinks(!showMediaLinks)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-indigo-500" />
                  Recording & Media Links
                  <span className="text-xs font-normal text-muted-foreground">(Optional — add after the session)</span>
                </CardTitle>
                <CardDescription>Add Google Drive links for the recording, transcript, and chat log.</CardDescription>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${showMediaLinks ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>

          {showMediaLinks && (
            <CardContent className="pt-4 border-t space-y-4">
              <div className="flex items-start gap-2 rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/10 p-3 text-sm text-blue-700 dark:text-blue-300">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-xs">
                  Upload files to Google Drive, right-click → <strong>Share → Anyone with the link</strong>, then paste the links below. Drive video links are auto-converted to embed format.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Video className="w-4 h-4 text-indigo-500" /> Recording
                </label>
                <Input 
                  placeholder="https://drive.google.com/file/d/... or direct .mp4 URL" 
                  className="text-xs" 
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" /> Transcript (.vtt)
                </label>
                <Input 
                  placeholder="https://drive.google.com/file/d/... or direct .vtt URL" 
                  className="text-xs" 
                  value={transcriptUrl}
                  onChange={(e) => setTranscriptUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-500" /> Chat Log (.txt)
                </label>
                <Input 
                  placeholder="https://drive.google.com/file/d/... or direct .txt URL" 
                  className="text-xs" 
                  value={chatUrl}
                  onChange={(e) => setChatUrl(e.target.value)}
                />
              </div>
            </CardContent>
          )}
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Schedule Session
          </Button>
        </div>
      </form>
    </div>
  )
}
