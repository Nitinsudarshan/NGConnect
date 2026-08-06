"use client"

import React, { useState } from "react"
import { Plus, Edit, Settings2, Eye, EyeOff, LayoutTemplate, MessageSquareMore, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { PageBanner } from "@/components/shared/page-banner"

export default function ContentHubAdmin() {
  // Mock courses for admin authoring view
  const courses = [
    { id: "c1", title: "Frontend Engineering 101", items: 12, audience: "Internal Alumni", status: "published", created: "Oct 10, 2026" },
    { id: "c2", title: "Advanced Node.js Architecture", items: 8, audience: "Both", status: "draft", created: "Oct 15, 2026" },
    { id: "c3", title: "Soft Skills & Communication", items: 5, audience: "External Alumni", status: "published", created: "Oct 20, 2026" },
  ]

  const handleCreateNew = () => {
    toast.success("Draft course created.")
    // Real implementation would router.push to an editor
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
      <PageBanner
        title="Content Hub (Admin)"
        description="Author and manage recorded courses, articles, and quizzes."
        icon={<LayoutTemplate className="w-6 h-6" />}
        actions={
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-400">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-950 dark:text-blue-100">14</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-400">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-950 dark:text-emerald-100">9</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-400">Total Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-950 dark:text-amber-100">342</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {courses.map(course => (
          <Card key={course.id} className="hover:border-slate-300 dark:hover:border-zinc-700 transition-colors">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg flex-shrink-0 ${course.status === 'published' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                    <LayoutTemplate className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{course.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>{course.items} items</span>
                      <span>•</span>
                      <span>{course.audience}</span>
                      <span>•</span>
                      <span>Created {course.created}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant={course.status === 'published' ? 'default' : 'secondary'} className={course.status === 'published' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                    {course.status === 'published' ? 'Published' : 'Draft'}
                  </Badge>
                  <Button variant="outline" size="sm" className="hidden sm:flex">
                    <Edit className="w-4 h-4 mr-2" /> Edit Content
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <LayoutTemplate className="w-4 h-4 mr-2" /> Manage Content
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings2 className="w-4 h-4 mr-2" /> Settings & Audience
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {course.status === 'published' ? (
                        <DropdownMenuItem className="text-amber-600">
                          <EyeOff className="w-4 h-4 mr-2" /> Unpublish
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="text-emerald-600">
                          <Eye className="w-4 h-4 mr-2" /> Publish
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
