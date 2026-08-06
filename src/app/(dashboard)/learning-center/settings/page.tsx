import { SettingsClient } from "./settings-client"
import { 
  getMentors, 
  getAudiences, 
  getSessionTypes, 
  getCategories, 
  getLearningCenterAuditLogs, 
  getCourseraConfig,
  getGoogleMeetIntegrationStatus
} from "@/lib/learning-center/queries"

export const metadata = {
  title: "Settings | Learning Center",
}

export default async function SettingsPage() {
  const [mentors, audiences, sessionTypes, categories, auditLogs, courseraConfig, gmeetStatus] = await Promise.all([
    getMentors(),
    getAudiences(),
    getSessionTypes(),
    getCategories(),
    getLearningCenterAuditLogs(),
    getCourseraConfig(),
    getGoogleMeetIntegrationStatus(),
  ])

  return (
    <SettingsClient 
      initialMentors={mentors} 
      initialAudiences={audiences} 
      initialSessionTypes={sessionTypes}
      initialCategories={categories}
      initialAuditLogs={auditLogs}
      initialCourseraConfig={courseraConfig}
      initialGmeetConnected={gmeetStatus.connected}
      initialGmeetEmail={gmeetStatus.accountEmail}
    />
  )
}
