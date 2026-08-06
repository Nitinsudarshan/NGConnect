"use client"

import React, { useState, use } from "react"
import { ChevronLeft, Save, Star, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { VideoPlayer } from "@/components/shared/video-player"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export default function SessionPlaybackPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Feedback Form State
  const [overallRating, setOverallRating] = useState(0)
  const [mentorRating, setMentorRating] = useState(0)
  const [relevanceRating, setRelevanceRating] = useState(0)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Mock fetching video details
  const sessionData = {
    id: sessionId,
    topic: "Database Indexing Strategies",
    mentor: "Alex Johnson",
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" // Placeholder video for testing playback
  }

  const handleVideoCompleted = () => {
    if (!hasSubmitted) {
      setFeedbackOpen(true)
    }
  }

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setHasSubmitted(true)
      setFeedbackOpen(false)
      toast.success("Feedback submitted! Thank you.")
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
            className={`p-1 transition-colors ${star <= rating ? "text-yellow-500" : "text-slate-300 dark:text-slate-700"}`}
          >
            <Star className={`w-6 h-6 ${star <= rating ? "fill-yellow-500" : ""}`} />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/learning-center/recordings">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{sessionData.topic}</h1>
          <p className="text-muted-foreground text-sm">Session {sessionData.id} • Mentor: {sessionData.mentor}</p>
        </div>
      </div>

      <div className="mt-6">
        <VideoPlayer 
          src={sessionData.videoUrl} 
          sourceId={sessionData.id} 
          sourceType="session_recording"
          onCompleted={handleVideoCompleted}
          completionThresholdPct={90}
        />
      </div>

      <div className="pt-4 flex justify-between items-center border-t">
        <p className="text-sm text-muted-foreground">
          Watch progress is automatically saved. Feedback will be requested upon completion.
        </p>
        {!hasSubmitted ? (
          <Button variant="outline" onClick={() => setFeedbackOpen(true)}>
            Provide Feedback Early
          </Button>
        ) : (
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            ✓ Feedback submitted
          </p>
        )}
      </div>

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Session Feedback</DialogTitle>
            <DialogDescription>
              You've completed the session! Please share your thoughts to help us improve.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFeedbackSubmit} className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Overall Rating</label>
                {renderStars(overallRating, setOverallRating)}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mentor Delivery</label>
                {renderStars(mentorRating, setMentorRating)}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Relevance to you</label>
                {renderStars(relevanceRating, setRelevanceRating)}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium">What did you like most?</label>
                <Textarea placeholder="Share your thoughts..." className="resize-none" rows={2} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Suggestions for next time?</label>
                <Textarea placeholder="Any improvements..." className="resize-none" rows={2} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setFeedbackOpen(false)}>Skip for now</Button>
              <Button type="submit" disabled={loading || overallRating === 0}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Submit Feedback
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
