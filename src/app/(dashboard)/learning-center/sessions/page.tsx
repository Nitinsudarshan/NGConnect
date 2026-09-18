import { SessionsClient } from "./sessions-client"
import { getSessions, getMentors, getAudiences, getCategories } from "@/lib/learning-center/queries"
import { denyUnlessAccess } from '@/lib/guard';

export const metadata = {
  title: "Sessions | Learning Center",
}

export default async function SessionsPage() {
  const denied = await denyUnlessAccess('learning_center.sessions');
  if (denied) return denied;

  const [sessions, mentors, audiences, categories] = await Promise.all([
    getSessions(),
    getMentors(),
    getAudiences(),
    getCategories(),
  ])

  return (
    <SessionsClient
      initialSessions={sessions}
      mentors={mentors}
      audiences={audiences}
      categories={categories}
    />
  )
}
