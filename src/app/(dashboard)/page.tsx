import { DashboardGreeting } from "@/components/dashboard-greeting"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/roles"
import { createAdminClient } from "@/lib/supabase/admin"
import { DashboardStats } from "@/components/dashboard-stats"
import { DashboardCharts } from "@/components/dashboard-charts"
import { CourseraStats } from "@/components/coursera-stats"
import { CourseraCharts } from "@/components/coursera-charts"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const activeRole = await getUserRole(user)
  const isExcludedRole = activeRole === "Viewer" || activeRole === "Member"

  let users: any[] = []
  let alumniData: any[] = []
  let courseraMetrics: any = null
  let courseraMonthlyMetrics: any[] = []
  let errorMsg: string | null = null

  if (!isExcludedRole) {
    try {
      const adminSupabase = createAdminClient()
      const { data, error } = await adminSupabase.auth.admin.listUsers()
      if (error) {
        errorMsg = error.message
      } else {
        users = data?.users || []
      }

      const { data: alumni, error: alumniError } = await adminSupabase
        .from('alumni_master')
        .select('status, campus, course, gender')
        .limit(5000) // Just to be safe with large datasets

      if (!alumniError) {
        alumniData = alumni || []
      }

      // Fetch Coursera computed metrics
      const { data: computedMetrics } = await adminSupabase
        .from('coursera_computed_metrics')
        .select('*')
        .order('month', { ascending: true })

      if (computedMetrics && computedMetrics.length > 0) {
        // The most recent month's data will act as overall metrics
        const latest = computedMetrics[computedMetrics.length - 1].metrics
        courseraMetrics = {
          total_learning_hours: latest.total_lifetime_hours || 0,
          course_completions: latest.total_courses_completed || 0,
          active_users: latest.active_learners || 0,
          lifetime_users: latest.total_learners || 0,
          active_alumni: 0 // Not separately tracked in the json, or default to 0
        }

        // Map to monthly format, excluding March 2026 since it has no prior month delta
        courseraMonthlyMetrics = computedMetrics
          .filter((row: any) => !row.month.startsWith('2026-03'))
          .map((row: any) => {
            const date = new Date(row.month)
            return {
              month_label: `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`,
              total_learning_hours: row.metrics.monthly_hours || 0,
              course_completions: row.metrics.monthly_completions || 0,
              active_users: row.metrics.active_learners || 0
            }
          })
      }
    } catch (e: any) {
      errorMsg = e.message || "Failed to retrieve user statistics."
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      <DashboardGreeting />
      {!isExcludedRole && (
        <div className="flex flex-col gap-1">
          <DashboardStats initialUsers={users} error={errorMsg} />
          {alumniData.length > 0 && <DashboardCharts data={alumniData} />}

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
            <CourseraStats metrics={courseraMetrics} />
            {courseraMonthlyMetrics.length > 0 && <CourseraCharts metrics={courseraMonthlyMetrics} />}
          </div>
        </div>
      )}
    </div>
  )
}

