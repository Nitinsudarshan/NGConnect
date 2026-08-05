"use client"

import React, { useState, use } from "react"
import { useRouter } from "next/navigation"
import { Save, Loader2, Star, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function FeedbackFormPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const router = useRouter()
  const { sessionId } = use(params)
  
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [overallRating, setOverallRating] = useState(0)
  const [mentorRating, setMentorRating] = useState(0)
  const [relevanceRating, setRelevanceRating] = useState(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      toast.success("Feedback submitted successfully!")
    }, 1500)
  }

  const renderStars = (rating: number, setRating: (val: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`p-1 transition-colors ${star <= rating ? "text-yellow-500" : "text-slate-300 dark:text-slate-600"}`}
          >
            <Star className={`w-6 h-6 ${star <= rating ? "fill-yellow-500" : ""}`} />
          </button>
        ))}
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto p-6 mt-10">
        <Card className="text-center py-10 bg-card/60 backdrop-blur-md border-emerald-200 dark:border-emerald-900/30">
          <CardContent className="space-y-4 flex flex-col items-center">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold">Thank You!</h2>
            <p className="text-muted-foreground max-w-sm">
              Your feedback has been submitted successfully. We appreciate your input to help us improve future sessions.
            </p>
            <Button className="mt-4" onClick={() => router.push("/learning-center/sessions")}>
              Return to Sessions
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Session Feedback</h1>
        <p className="text-muted-foreground">Please share your thoughts on the session to help us improve.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800">
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Email <span className="text-red-500">*</span></label>
                <Input type="email" placeholder="name@example.com" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Role <span className="text-red-500">*</span></label>
                <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required>
                  <option value="">Select your role</option>
                  <option value="NG Team">NG Team</option>
                  <option value="Internal Alumni">Internal Alumni</option>
                  <option value="External Alumni">External Alumni</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Session Attended <span className="text-red-500">*</span></label>
              <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" defaultValue={sessionId} required>
                <option value="S-105">Advanced React Patterns (John Doe)</option>
                <option value="S-104">Intro to UI Design (Jane Smith)</option>
                <option value="S-103">System Design Prep (Alex Johnson)</option>
              </select>
            </div>

            <div className="border-t pt-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium block">Overall Rating <span className="text-red-500">*</span></label>
                {renderStars(overallRating, setOverallRating)}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium block">Mentor Delivery Rating <span className="text-red-500">*</span></label>
                {renderStars(mentorRating, setMentorRating)}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium block">Relevance to you <span className="text-red-500">*</span></label>
                {renderStars(relevanceRating, setRelevanceRating)}
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">What did you like most about the session?</label>
                <Textarea placeholder="Share your thoughts..." className="min-h-[100px]" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Suggestions for next sessions?</label>
                <Textarea placeholder="Any topics or improvements..." className="min-h-[100px]" />
              </div>
            </div>

          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading || overallRating === 0 || mentorRating === 0 || relevanceRating === 0}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Submit Feedback
          </Button>
        </div>
      </form>
    </div>
  )
}
