"use client"

import React, { useState } from "react"
import { Search, PlayCircle, BookOpen, GraduationCap, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageBanner } from "@/components/shared/page-banner"

export default function LearningHubMember() {
  const [search, setSearch] = useState("")

  // Mock available courses
  const courses = [
    { id: "c1", title: "Frontend Engineering 101", description: "Master HTML, CSS, and modern React development from scratch.", items: 12, thumbnail: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?auto=format&fit=crop&q=80&w=600", progress: 60, totalTime: "4h 30m" },
    { id: "c3", title: "Soft Skills & Communication", description: "Effective communication for software engineers and engineering managers.", items: 5, thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=600", progress: 0, totalTime: "1h 45m" },
    { id: "c4", title: "Git & GitHub Masterclass", description: "Learn version control inside out.", items: 8, thumbnail: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=600", progress: 100, totalTime: "2h 15m" },
  ]

  const filteredCourses = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto w-full">
      <PageBanner
        title="Learning Hub"
        description="Explore self-paced courses and expand your skills."
        icon={<GraduationCap className="w-6 h-6" />}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                className="pl-8 bg-card"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCourses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
            No courses found matching your search.
          </div>
        ) : (
          filteredCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden hover:shadow-md transition-all group cursor-pointer flex flex-col bg-card/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800">
              <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={course.thumbnail} alt={course.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-[10px] font-medium rounded backdrop-blur-sm flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {course.totalTime}
                </div>

                {course.progress > 0 && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded backdrop-blur-sm">
                    {course.progress === 100 ? "Completed" : `${course.progress}%`}
                  </div>
                )}
                
                {course.progress > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30">
                    <div className={course.progress === 100 ? "h-full bg-emerald-500" : "h-full bg-blue-500"} style={{ width: `${course.progress}%` }} />
                  </div>
                )}
              </div>
              <CardContent className="p-4 flex flex-col flex-1">
                <div className="space-y-2.5 flex-1">
                  <h3 className="font-bold text-lg leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-4 mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{course.items} lessons</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Self-paced</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
