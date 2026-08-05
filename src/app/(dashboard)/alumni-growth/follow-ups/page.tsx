import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarClock, CheckCircle, Clock } from "lucide-react"
import { PageBanner } from "@/components/shared/page-banner"

export default function FollowUpsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      {/* Banner */}
      <PageBanner
        title="Follow-ups"
        description={<p>Track scheduled callbacks, pending tasks, and upcoming meetings with alumni.</p>}
        icon={<CalendarClock className="h-8 w-8 text-orange-500" />}
      />

      <div className="grid gap-4 md:grid-cols-3 mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Needs action today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
            <CalendarClock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>Your scheduled follow-ups and interactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start justify-between rounded-md border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Follow up call with Jane Smith</p>
                    <p className="text-sm text-muted-foreground">Discuss ongoing project feedback and gather suggestions.</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 font-medium">
                    <Clock className="size-4" />
                    Today, {i + 1}:00 PM
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
