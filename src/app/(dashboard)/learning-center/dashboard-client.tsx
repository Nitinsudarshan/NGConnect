"use client"

import React, { useState, useMemo } from "react"
import {
  Users,
  Video,
  Activity,
  Calendar,
  Clock,
  Bell,
  MessageSquare,
  Upload,
  GraduationCap,
  CheckCircle2,
  Tv,
  ChevronLeft,
  ChevronRight,
  FileText,
  BookOpen,
  TrendingUp,
  Award,
  Mail,
  PlayCircle
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageBanner } from "@/components/shared/page-banner"
import { SessionPlaybackModal } from "@/components/shared/session-playback-modal"
import { ContinueWatchingCard } from "@/components/learning-center/continue-watching-card"
import { CustContainer } from "@/components/learning-center/cust-container"
import { LearningSession, UserWatchStats, ContinueWatchingItem, LearningCenterAuditLog, UserCourseraData } from "@/lib/learning-center/queries"

export function LearningCenterDashboardClient({ 
  mentors, 
  upcomingSessionsData,
  watchStats,
  continueWatching = [],
  allSessions = [],
  auditLogs = [],
  isMember = false,
  courseraData,
  courseraShowCallouts = true,
  courseraContactEmail = "learn@navgurukul.org"
}: { 
  mentors: any[], 
  upcomingSessionsData: any[],
  watchStats?: UserWatchStats,
  continueWatching?: ContinueWatchingItem[],
  allSessions?: LearningSession[],
  auditLogs?: LearningCenterAuditLog[],
  isMember?: boolean,
  courseraData?: UserCourseraData,
  courseraShowCallouts?: boolean,
  courseraContactEmail?: string
}) {
  const [activeResumeSession, setActiveResumeSession] = useState<LearningSession | null>(null)
  const [watchPage, setWatchPage] = useState(0)

  const metrics = {
    totalSessions: allSessions.length || upcomingSessionsData.length,
    upcoming: upcomingSessionsData.length,
    activeMentors: mentors.filter(m => m.status === 'Active').length,
    totalWatchHours: watchStats?.total_hours_formatted || "0 mins",
    completedCount: watchStats?.completed_sessions_count || 0,
    inProgressCount: continueWatching ? continueWatching.filter(i => (i.percent_watched ?? 0) < 95).length : 0,
    availableRecordings: allSessions.filter(s => !!s.recording_url).length,
  }

  // Dynamically compute Recent Activity from real session recordings, media uploads, and audit logs
  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string
      text: string
      time: string
      icon: any
      color: string
      bg: string
      timestamp: number
    }> = []

    // 1. Generate items from sessions with recording_url, transcript_url, or chat_url
    for (const session of allSessions) {
      const sessionTime = new Date(session.updated_at || session.created_at || session.date).getTime()
      const formattedDate = new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })

      if (session.recording_url) {
        list.push({
          id: `rec-${session.id}`,
          text: `Recording added for '${session.topic}'`,
          time: formattedDate,
          icon: Video,
          color: "text-purple-500",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          timestamp: sessionTime
        })
      }

      if (session.transcript_url) {
        list.push({
          id: `trans-${session.id}`,
          text: `Transcript uploaded for '${session.topic}'`,
          time: formattedDate,
          icon: FileText,
          color: "text-emerald-500",
          bg: "bg-emerald-50 dark:bg-emerald-900/20",
          timestamp: sessionTime
        })
      }

      if (session.chat_url) {
        list.push({
          id: `chat-${session.id}`,
          text: `Chat log added for '${session.topic}'`,
          time: formattedDate,
          icon: MessageSquare,
          color: "text-indigo-500",
          bg: "bg-indigo-50 dark:bg-indigo-900/20",
          timestamp: sessionTime
        })
      }
    }

    // 2. Include audit logs from database
    for (const log of auditLogs) {
      const logTime = new Date(log.created_at).getTime()
      const formattedDate = new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      list.push({
        id: log.id,
        text: log.details,
        time: formattedDate,
        icon: Bell,
        color: "text-blue-500",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        timestamp: logTime
      })
    }

    // Sort by timestamp descending (newest activity first) and pick top 3
    return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3)
  }, [allSessions, auditLogs])

  return (
    <div className="p-6 space-y-6">
      <PageBanner
        title="Learning Center"
        description="Overview of mentorship sessions, member viewing hours, and learning progress."
        icon={<GraduationCap className="w-6 h-6 text-indigo-500" />}
      />

      {/* Stat Cards: Tailored for Member vs Admin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isMember ? (
          <>
            {/* Member Card 1: My Watch Time */}
            <div className="bg-card/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">My Watch Time</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{metrics.totalWatchHours}</p>
                </div>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </div>

            {/* Member Card 2: In Progress */}
            <div className="bg-card/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sessions In Progress</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{metrics.inProgressCount}</p>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <PlayCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>

            {/* Member Card 3: Completed Sessions */}
            <div className="bg-card/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed Sessions</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.completedCount}</p>
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Member Card 4: Available Recordings */}
            <div className="bg-card/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Available Recordings</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{metrics.availableRecordings}</p>
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Video className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Admin Card 1: Total Watch Time */}
            <div className="bg-card/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Watch Time</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{metrics.totalWatchHours}</p>
                </div>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </div>

            {/* Admin Card 2: Available Recordings */}
            <div className="bg-card/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Available Recordings</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{metrics.availableRecordings}</p>
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Video className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            {/* Admin Card 3: Upcoming (30d) */}
            <div className="bg-card/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Upcoming (30d)</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.upcoming}</p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            {/* Admin Card 4: Active Mentors */}
            <div className="bg-card/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Mentors</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.activeMentors}</p>
                </div>
                <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                  <Users className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Continue Watching Row */}
      {continueWatching && continueWatching.length > 0 && (() => {
        const itemsPerPage = 3
        const totalPages = Math.ceil(continueWatching.length / itemsPerPage)
        const visibleItems = continueWatching.slice(watchPage * itemsPerPage, (watchPage + 1) * itemsPerPage)

        return (
          <CustContainer
            title="Continue Watching"
            description="Pick up right where you left off"
            icon={<Tv className="w-4 h-4" />}
            headerActions={
              totalPages > 1 ? (
                <div className="flex items-center gap-1 bg-muted/30 p-0.5 rounded-lg border border-slate-200/40 dark:border-zinc-800">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded"
                    disabled={watchPage === 0}
                    onClick={() => setWatchPage(p => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="sr-only">Previous page</span>
                  </Button>
                  <span className="text-[10px] font-mono font-medium px-1.5 text-muted-foreground">
                    {watchPage + 1}/{totalPages}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded"
                    disabled={watchPage >= totalPages - 1}
                    onClick={() => setWatchPage(p => Math.min(totalPages - 1, p + 1))}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="sr-only">Next page</span>
                  </Button>
                </div>
              ) : null
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {visibleItems.map((item) => (
                <ContinueWatchingCard
                  key={item.id}
                  item={item}
                  onResume={setActiveResumeSession}
                />
              ))}
            </div>
          </CustContainer>
        )
      })()}

      {/* 1. Coursera Learning Progress Card (Rendered when user email matches Coursera DB records) */}
      {courseraData && courseraData.found_in_db && (
        <CustContainer
          title="Coursera Learning Progress"
          description="Organization Enterprise Subscription Stats"
          icon={<BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          badge={
            <Badge className="bg-blue-600/90 text-white font-medium text-[10px] px-2.5 py-0.5 rounded-lg border border-blue-400/30">
              Active Org Subscription
            </Badge>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <div className="bg-card/50 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 flex items-center gap-3.5 hover:border-blue-300 dark:hover:border-blue-700/60 transition-colors">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Learning Hours</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{courseraData.total_hours_formatted}</p>
              </div>
            </div>

            <div className="bg-card/50 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 flex items-center gap-3.5 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-colors">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hours Last Month</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{courseraData.hours_last_month_formatted}</p>
              </div>
            </div>

            <div className="bg-card/50 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 flex items-center gap-3.5 hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-colors">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Completed Courses</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{courseraData.completed_courses_count} Courses</p>
              </div>
            </div>
          </div>
        </CustContainer>
      )}

      {/* 2. Coursera Access Banner (Rendered when user is NOT found in DB & NOT active on Coursera, and callouts are enabled) */}
      {courseraShowCallouts && courseraData && courseraData.show_contact_banner && (
        <CustContainer
          title="Get Free Access to Coursera Enterprise"
          description="Learn 7,000+ courses & earn professional certificates"
          icon={<BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          badge={
            <Badge variant="outline" className="text-[10px] border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400">
              Sponsored by NavGurukul
            </Badge>
          }
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
            <div className="space-y-1 max-w-2xl">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                You currently do not have an active Coursera Enterprise license assigned to your email address. Contact the <strong>CEO&apos;s Office</strong> or your <strong>Program Manager</strong> to get your free sponsored access.
              </p>
            </div>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs gap-1.5 shrink-0 rounded-lg shadow-sm"
              onClick={() => window.open(`mailto:${courseraContactEmail}?subject=Request%20Coursera%20Enterprise%20Access`, "_blank")}
            >
              <Mail className="w-3.5 h-3.5" /> Contact Us to Get Access
            </Button>
          </div>
        </CustContainer>
      )}

      {/* Half & Half Layout: Upcoming Sessions (Left) & Recent Activity (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Upcoming Sessions (3 items max) */}
        <CustContainer
          title="Upcoming Sessions"
          description="Scheduled sessions in the next 30 days"
          icon={<Calendar className="w-4 h-4 text-blue-500" />}
        >
          {upcomingSessionsData.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs border border-dashed rounded-lg">
              No upcoming sessions scheduled.
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingSessionsData.slice(0, 3).map((session) => (
                <div key={session.id} className="flex items-start justify-between p-3 border rounded-lg bg-card/50 hover:bg-card border-slate-200/60 dark:border-zinc-800 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-xs sm:text-sm line-clamp-1">{session.topic}</h4>
                      <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">{session.mode}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center text-[11px] text-muted-foreground gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3 text-indigo-500" /> {session.mentors?.name || 'Unknown'}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-blue-500" /> {new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} • {session.start_time ? session.start_time.replace(/(:\d{2}):\d{2}$/, "$1") : 'TBD'}</span>
                      {session.platform && <span className="flex items-center gap-1"><Video className="w-3 h-3 text-purple-500" /> {session.platform}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CustContainer>

        {/* Right Column: Dynamic Recent Activity (3 items max) */}
        <CustContainer
          title="Recent Activity"
          description="Dynamic updates on new recordings, media uploads, and session updates"
          icon={<Activity className="w-4 h-4 text-indigo-500" />}
        >
          {recentActivities.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs border border-dashed rounded-lg">
              No recent activity logged yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentActivities.slice(0, 3).map((act) => {
                const Icon = act.icon
                return (
                  <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200/60 dark:border-zinc-800 bg-card/50 hover:bg-card transition-colors">
                    <div className={`p-1.5 rounded-lg ${act.bg} shrink-0 mt-0.5`}>
                      <Icon className={`w-3.5 h-3.5 ${act.color}`} />
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-slate-800 dark:text-slate-200 font-medium text-xs line-clamp-2">{act.text}</p>
                      <p className="text-[10px] text-muted-foreground">{act.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CustContainer>
      </div>

      {/* Playback Modal for Resuming Session */}
      <SessionPlaybackModal 
        session={activeResumeSession} 
        open={!!activeResumeSession} 
        onOpenChange={(open) => !open && setActiveResumeSession(null)} 
      />
    </div>
  )
}
