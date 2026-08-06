import { SettingsClient } from "./settings-client"
import { getMentors, getAudiences, getSessionTypes, getCategories, getLearningCenterAuditLogs, getCourseraConfig } from "@/lib/learning-center/queries"

export const metadata = {
  title: "Settings | Learning Center",
}

export default async function SettingsPage() {
  const [mentors, audiences, sessionTypes, categories, auditLogs, courseraConfig] = await Promise.all([
    getMentors(),
    getAudiences(),
    getSessionTypes(),
    getCategories(),
    getLearningCenterAuditLogs(),
    getCourseraConfig(),
  ])

  return (
    <SettingsClient 
      initialMentors={mentors} 
      initialAudiences={audiences} 
      initialSessionTypes={sessionTypes}
      initialCategories={categories}
      initialAuditLogs={auditLogs}
      initialCourseraConfig={courseraConfig}
    />
  )
}
