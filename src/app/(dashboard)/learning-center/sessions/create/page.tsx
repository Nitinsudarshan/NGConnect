import { CreateSessionClient } from "./create-client"
import { getMentors, getAudiences, getSessionTypes, getCategories } from "@/lib/learning-center/queries"
import { denyUnlessAccess } from '@/lib/guard';

export const metadata = {
  title: "Create Session | Learning Center",
}

export default async function CreateSessionPage() {
  const denied = await denyUnlessAccess('learning_center.sessions', 'edit');
  if (denied) return denied;

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
