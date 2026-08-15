"use client"

import React, { useState, use } from "react"
import Link from "next/link"
import { ChevronLeft, PlayCircle, FileText, FileDown, HelpCircle, CheckCircle2 } from "lucide-react"
import DOMPurify from 'isomorphic-dompurify'
import { Button } from "@/components/ui/button"
import { VideoPlayer } from "@/components/shared/video-player"
import { HelpModal } from "@/components/shared/HelpModal"
import { toast } from "sonner"

export default function CourseViewerPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params)
  const [activeItemIdx, setActiveItemIdx] = useState(0)

  // Mock course data
  const course = {
    id: courseId,
    title: "Frontend Engineering 101",
    items: [
      { id: "i1", title: "Introduction to HTML/CSS", type: "video", url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", completed: true },
      { id: "i2", title: "Semantic HTML Best Practices", type: "article", content: "<p>Semantic HTML is the foundation of web accessibility...</p>", completed: true },
      { id: "i3", title: "CSS Flexbox Cheatsheet", type: "pdf", url: "/mock-pdf.pdf", completed: false },
      { id: "i4", title: "Module 1 Quiz", type: "quiz", questions: 3, completed: false }
    ]
  }

  const activeItem = course.items[activeItemIdx]

  const markCompleted = () => {
    toast.success(`${activeItem.title} marked as completed.`)
    // In real app, write to course_progress
    if (activeItemIdx < course.items.length - 1) {
      setActiveItemIdx(activeItemIdx + 1)
    }
  }

  const renderIcon = (type: string, completed: boolean) => {
    if (completed) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    if (type === 'video') return <PlayCircle className="w-4 h-4" />
    if (type === 'article') return <FileText className="w-4 h-4" />
    if (type === 'pdf') return <FileDown className="w-4 h-4" />
    if (type === 'quiz') return <HelpCircle className="w-4 h-4" />
    return null
  }

  const renderContent = () => {
    switch (activeItem.type) {
      case 'video':
        return (
          <div className="space-y-6">
            <VideoPlayer 
              src={activeItem.url!} 
              sourceId={activeItem.id} 
              sourceType="course_item"
              onCompleted={markCompleted}
            />
            <div>
              <h2 className="text-2xl font-bold">{activeItem.title}</h2>
              <p className="text-muted-foreground mt-2">Watch the video to completion to automatically advance to the next lesson.</p>
            </div>
          </div>
        )
      case 'article':
        return (
          <div className="space-y-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2 className="text-2xl font-bold">{activeItem.title}</h2>
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activeItem.content!) }} />
            </div>
            <Button onClick={markCompleted}>Mark as Read & Continue</Button>
          </div>
        )
      case 'pdf':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{activeItem.title}</h2>
            <div className="p-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center gap-4 bg-muted/20">
              <FileDown className="w-12 h-12 text-muted-foreground" />
              <div>
                <h3 className="font-medium">Download required material</h3>
                <p className="text-sm text-muted-foreground">Please review this document before proceeding.</p>
              </div>
              <Button asChild>
                <a href={activeItem.url} download>Download PDF</a>
              </Button>
            </div>
            <Button onClick={markCompleted} variant="outline">I have reviewed this document</Button>
          </div>
        )
      case 'quiz':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{activeItem.title}</h2>
            <div className="bg-card border rounded-xl p-6 space-y-6 shadow-sm">
              <div className="space-y-4">
                <p className="font-medium text-lg">Question 1 of {activeItem.questions}</p>
                <p className="text-slate-700 dark:text-slate-300">Which HTML element is used to define the main content of a document?</p>
                <div className="space-y-2">
                  {['<main>', '<body>', '<content>', '<section>'].map((opt, i) => (
                    <label key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
                      <input type="radio" name="q1" className="w-4 h-4" />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pass threshold: 80%</span>
                <Button onClick={markCompleted}>Submit Quiz</Button>
              </div>
            </div>
          </div>
        )
      default:
        return <div>Unsupported content type.</div>
    }
  }

  return (
    <div className="flex h-[calc(100svh-var(--header-height))] bg-background">
      {/* Sidebar Navigation */}
      <div className="w-80 flex-shrink-0 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
              <Link href="/learning-center/content-hub">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Library
              </Link>
            </Button>
            <HelpModal helpId="learning_center.course_detail" />
          </div>
          <h2 className="font-bold line-clamp-2">{course.title}</h2>
          <div className="mt-2 text-xs font-medium text-muted-foreground">
            {course.items.filter(i => i.completed).length} of {course.items.length} completed
          </div>
          <div className="w-full bg-secondary h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-full" 
              style={{ width: `${(course.items.filter(i => i.completed).length / course.items.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {course.items.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setActiveItemIdx(idx)}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${activeItemIdx === idx ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100' : 'hover:bg-muted'}`}
            >
              <div className={`mt-0.5 flex-shrink-0 ${item.completed ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {renderIcon(item.type, item.completed)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium line-clamp-2 ${activeItemIdx === idx ? '' : 'text-slate-700 dark:text-slate-300'}`}>
                  {idx + 1}. {item.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{item.type}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 md:p-10">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
