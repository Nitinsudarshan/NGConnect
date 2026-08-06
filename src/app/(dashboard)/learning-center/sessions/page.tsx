import { SessionsClient } from "./sessions-client"
import { getSessions, getMentors, getAudiences, getCategories } from "@/lib/learning-center/queries"

export const metadata = {
  title: "Sessions | Learning Center",
}

export default async function SessionsPage() {
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
