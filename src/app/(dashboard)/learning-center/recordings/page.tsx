import { getPastSessions, getContinueWatchingSessions, ContinueWatchingItem } from "@/lib/learning-center/queries"
import { createClient } from "@/lib/supabase/server"
import { RecordingsClient } from "./recordings-client"

export const metadata = {
  title: "Past Sessions | Learning Center",
}

export default async function RecordingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [sessions, watchProgress] = await Promise.all([
    getPastSessions(),
    user?.id ? getContinueWatchingSessions(user.id) : Promise.resolve([] as ContinueWatchingItem[])
  ])

  // Build a map of session_id → percent_watched for quick lookup
  const progressMap = new Map<string, number>()
  for (const item of watchProgress) {
    if (item.session?.id && item.percent_watched > 0) {
      progressMap.set(item.session.id, item.percent_watched)
    }
  }

  return <RecordingsClient sessions={sessions} progressMap={progressMap} />
}
