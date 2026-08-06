import { CreateSessionClient } from "./create-client"
import { getMentors, getAudiences, getSessionTypes, getCategories } from "@/lib/learning-center/queries"

export const metadata = {
  title: "Create Session | Learning Center",
}

export default async function CreateSessionPage() {
  const [mentors, audiences, sessionTypes, categories] = await Promise.all([
    getMentors(),
    getAudiences(),
    getSessionTypes(),
    getCategories(),
  ])

  return (
    <CreateSessionClient 
      mentors={mentors} 
      audiences={audiences} 
      sessionTypes={sessionTypes} 
      categories={categories}
    />
  )
}
