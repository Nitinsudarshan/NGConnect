"use client"

import React, { useState, useMemo } from "react"
import { Clock, Video, ChevronLeft, ChevronRight, ArrowUpDown, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageBanner } from "@/components/shared/page-banner"
import { SessionPlaybackModal } from "@/components/shared/session-playback-modal"
import { PastSessionCard } from "@/components/learning-center/past-session-card"
import { LearningSession } from "@/lib/learning-center/queries"

export function RecordingsClient({ sessions, progressMap = new Map() }: { sessions: LearningSession[], progressMap?: Map<string, number> }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all")
  const [selectedMentor, setSelectedMentor] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")
  
  const [selectedSession, setSelectedSession] = useState<LearningSession | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const ITEMS_PER_PAGE = 9

  // Extract unique categories present in session data
  const categoriesList = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of sessions) {
      if (s.learning_categories?.name) {
        map.set(s.category_id || s.learning_categories.name, s.learning_categories.name)
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [sessions])

  // Extract unique subcategories (filtered by selected category if applicable)
  const subcategoriesList = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of sessions) {
      if (selectedCategory !== "all") {
        if (s.category_id !== selectedCategory && s.learning_categories?.name !== selectedCategory) {
          continue
        }
      }
      if (s.learning_subcategories?.name) {
        map.set(s.subcategory_id || s.learning_subcategories.name, s.learning_subcategories.name)
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [sessions, selectedCategory])

  // Extract unique mentors present in session data
  const mentorsList = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of sessions) {
      if (s.mentors?.name) {
        map.set(s.mentor_id || s.mentors.name, s.mentors.name)
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [sessions])

  // Filter and sort recordings
  const filteredRecordings = useMemo(() => {
    return sessions
      .filter(s => {
        const catMatch = selectedCategory === "all" ||
          s.category_id === selectedCategory ||
          s.learning_categories?.name === selectedCategory

        const subMatch = selectedSubcategory === "all" ||
          s.subcategory_id === selectedSubcategory ||
          s.learning_subcategories?.name === selectedSubcategory

        const mentorMatch = selectedMentor === "all" ||
          s.mentor_id === selectedMentor ||
          s.mentors?.name === selectedMentor

        return catMatch && subMatch && mentorMatch
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime()
        const timeB = new Date(b.date).getTime()
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA
      })
  }, [sessions, selectedCategory, selectedSubcategory, selectedMentor, sortOrder])

  const totalPages = Math.max(1, Math.ceil(filteredRecordings.length / ITEMS_PER_PAGE))
  const paginatedRecordings = filteredRecordings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val)
    setSelectedSubcategory("all")
    setCurrentPage(1)
  }

  const handleSubcategoryChange = (val: string) => {
    setSelectedSubcategory(val)
    setCurrentPage(1)
  }

  const handleMentorChange = (val: string) => {
    setSelectedMentor(val)
    setCurrentPage(1)
  }

  const handleSortChange = (val: string) => {
    setSortOrder(val as "desc" | "asc")
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setSelectedCategory("all")
    setSelectedSubcategory("all")
    setSelectedMentor("all")
    setSortOrder("desc")
    setCurrentPage(1)
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
      <PageBanner
        title="Past Sessions"
        description="Watch past recorded sessions and access transcripts & chat logs."
        icon={<Clock className="w-6 h-6 text-indigo-500" />}
      />

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card/60 backdrop-blur-md p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Category Filter */}
          <select
            className="h-9 px-3 text-xs rounded-md border border-input bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categoriesList.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {/* Subcategory Filter */}
          <select
            className="h-9 px-3 text-xs rounded-md border border-input bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer disabled:opacity-50"
            value={selectedSubcategory}
            onChange={(e) => handleSubcategoryChange(e.target.value)}
            disabled={subcategoriesList.length === 0}
          >
            <option value="all">All Subcategories</option>
            {subcategoriesList.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>

          {/* Mentor Filter */}
          <select
            className="h-9 px-3 text-xs rounded-md border border-input bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            value={selectedMentor}
            onChange={(e) => handleMentorChange(e.target.value)}
          >
            <option value="all">All Mentors</option>
            {mentorsList.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          {/* Reset Filters button */}
          {(selectedCategory !== "all" || selectedSubcategory !== "all" || selectedMentor !== "all" || sortOrder !== "desc") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1 px-2.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-500" /> Reset
            </Button>
          )}
        </div>

        {/* Date Sort Dropdown */}
        <div className="flex items-center gap-2 self-end lg:self-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200/50 dark:border-zinc-800">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" /> Sort by Date:
          </span>
          <select
            className="h-9 px-3 text-xs font-medium rounded-md border border-input bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            value={sortOrder}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            <option value="desc">Newest First (Desc)</option>
            <option value="asc">Oldest First (Asc)</option>
          </select>
        </div>
      </div>

      {/* Grid Layout: Exactly 3 cards in a row on medium and large screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedRecordings.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground border-2 border-dashed rounded-xl space-y-2">
            <Video className="w-10 h-10 mx-auto text-muted-foreground/50" />
            <p className="font-medium text-base text-foreground">No past session recordings found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Sessions that have passed and have a recording added will automatically appear here.
            </p>
          </div>
        ) : (
          paginatedRecordings.map((rec) => (
            <PastSessionCard
              key={rec.id}
              session={rec}
              onPlay={setSelectedSession}
              percentWatched={progressMap.get(rec.id)}
            />
          ))
        )}
      </div>

      {/* Pagination Controls styled to match indigo/purple theme */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200/80 dark:border-zinc-800/80">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
            <span className="font-medium text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredRecordings.length)}</span> of{" "}
            <span className="font-medium text-foreground">{filteredRecordings.length}</span> recordings
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="h-8 text-xs gap-1 border-slate-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </Button>
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "ghost"}
                  size="sm"
                  className={`h-8 w-8 text-xs p-0 rounded-lg transition-all ${
                    currentPage === page
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-sm hover:from-indigo-500 hover:to-purple-500"
                      : "hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 text-muted-foreground"
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="h-8 text-xs gap-1 border-slate-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Playback Modal */}
      <SessionPlaybackModal
        session={selectedSession}
        open={!!selectedSession}
        onOpenChange={(open) => !open && setSelectedSession(null)}
      />
    </div>
  )
}
