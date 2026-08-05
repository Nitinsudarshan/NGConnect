"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Video, Save, Loader2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"

export default function CreateSessionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      toast.success("Session scheduled successfully!")
      router.push("/learning-center/sessions")
    }, 1500)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Session</h1>
          <p className="text-muted-foreground">Schedule a new mentorship session and optionally generate a Zoom link.</p>
        </div>
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
                <label className="text-sm font-medium">Topic</label>
                <Input placeholder="e.g. Introduction to React Native" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mentor</label>
                <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required>
                  <option value="">Select a mentor</option>
                  <option value="1">John Doe (Frontend)</option>
                  <option value="2">Jane Smith (UI/UX)</option>
                  <option value="3">Alex Johnson (Backend)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time (IST)</label>
                <Input type="time" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (mins)</label>
                <Input type="number" defaultValue="60" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mode</label>
                <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform</label>
                <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <option value="Zoom">Zoom (Auto-create)</option>
                  <option value="Google Meet">Google Meet</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Audience</label>
                <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <option value="Both">Both (Internal & External)</option>
                  <option value="Internal Alumni">Internal Alumni Only</option>
                  <option value="External Alumni">External Alumni Only</option>
                  <option value="NG Team">NG Team / Internal</option>
                </select>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-md p-4 mt-2">
              <div className="flex gap-2 text-blue-700 dark:text-blue-400">
                <Info className="w-5 h-5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">Zoom Auto-creation enabled</p>
                  <p className="opacity-90 mt-1">This will automatically schedule a meeting on the NGConnect Zoom Enterprise account and generate join links for the mentor and participants.</p>
                </div>
              </div>
            </div>
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
