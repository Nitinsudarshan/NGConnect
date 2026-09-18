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
import { getUserPermissions } from "@/lib/permissions"
import { auth } from "@/lib/auth"
import { denyUnlessAnyAccess } from '@/lib/guard'
import { getResourceIdsByPrefix } from '@/lib/resource-tree'

export const metadata = {
  title: "Settings | Learning Center",
}

export default async function SettingsPage() {
  const denied = await denyUnlessAnyAccess(getResourceIdsByPrefix('learning_center.settings.'), 'view', {
    backHref: '/learning-center',
    backLabel: 'Back to Learning Center',
    description: 'Your role does not include access to any Learning Center settings panel. Ask an administrator to grant it from the RBAC matrix.',
  })
  if (denied) return denied

  const [mentors, audiences, sessionTypes, categories, auditLogs, courseraConfig, gmeetStatus] = await Promise.all([
    getMentors(),
    getAudiences(),
    getSessionTypes(),
    getCategories(),
    getLearningCenterAuditLogs(),
    getCourseraConfig(),
    getGoogleMeetIntegrationStatus(),
  ])

  const { userId } = await auth()
  const permissions = await getUserPermissions(userId, 'learning_center')

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
      permissions={permissions}
    />
  )
}
