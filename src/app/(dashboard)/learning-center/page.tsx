import React from "react"
import { createClient } from "@/lib/supabase/server"
import { 
  getMentors, 
  getUpcomingSessions, 
  getUserWatchStats,
  getAllUsersWatchStats,
  getContinueWatchingSessions,
  getSessions,
  getLearningCenterAuditLogs,
  getUserCourseraData,
  getCourseraConfig
} from "@/lib/learning-center/queries"
import { getUserRole } from "@/lib/roles"
import { LearningCenterDashboardClient } from "./dashboard-client"

export const metadata = {
  title: "Learning Center Dashboard",
}

export default async function LearningCenterDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id || ""
  const userEmail = user?.email || ""
  const role = await getUserRole()
  const isMember = role.toLowerCase() === "member"

  const [mentors, upcomingSessionsData, watchStats, continueWatching, allSessions, auditLogs, courseraData, courseraConfig] = await Promise.all([
    getMentors(),
    getUpcomingSessions(),
    isMember
      ? (userId ? getUserWatchStats(userId) : Promise.resolve({ total_watched_seconds: 0, total_hours_formatted: "0 mins", completed_sessions_count: 0 }))
      : getAllUsersWatchStats(),
    userId ? getContinueWatchingSessions(userId) : Promise.resolve([]),
    getSessions(),
    getLearningCenterAuditLogs(),
    getUserCourseraData(userEmail),
    getCourseraConfig()
  ])

  return (
    <LearningCenterDashboardClient 
      mentors={mentors} 
      upcomingSessionsData={upcomingSessionsData} 
      watchStats={watchStats}
      continueWatching={continueWatching}
      allSessions={allSessions}
      auditLogs={auditLogs}
      isMember={isMember}
      courseraData={courseraData}
      courseraShowCallouts={courseraConfig.show_callouts}
      courseraContactEmail={courseraConfig.contact_email}
    />
  )
}
