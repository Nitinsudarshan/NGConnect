import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserCourseraData, getCourseraConfig } from "@/lib/learning-center/queries"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [courseraConfig] = await Promise.all([getCourseraConfig()])

  if (!user?.email) {
    return NextResponse.json({
      show_contact_banner: false,
      found_in_db: false,
      show_callouts: courseraConfig.show_callouts,
      contact_email: courseraConfig.contact_email,
    })
  }

  const data = await getUserCourseraData(user.email)
  return NextResponse.json({
    found_in_db: data.found_in_db,
    show_contact_banner: data.show_contact_banner,
    has_active_subscription: data.has_active_subscription,
    show_callouts: courseraConfig.show_callouts,
    contact_email: courseraConfig.contact_email,
  })
}
