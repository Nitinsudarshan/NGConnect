import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, Users, PhoneCall, Mail } from "lucide-react"
import { PageBanner } from "@/components/shared/page-banner"

export default function WorkspacePage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      {/* Banner */}
      <PageBanner
        title="Alumni Workspace"
        description={<p>Overview of active engagement, communication, and campaigns with the alumni network.</p>}
        icon={<Briefcase className="h-8 w-8 text-indigo-500" />}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Briefcase className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,248</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls Logged</CardTitle>
            <PhoneCall className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">423</div>
            <p className="text-xs text-muted-foreground">+7% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,521</div>
            <p className="text-xs text-muted-foreground">+22% from last week</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and engagement actions from your team.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 rounded-md border p-4">
                <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                  <PhoneCall className="size-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Call with John Doe</p>
                  <p className="text-sm text-muted-foreground">Discussed potential mentorship opportunities.</p>
                </div>
                <div className="text-sm text-muted-foreground">2 hours ago</div>
              </div>
              <div className="flex items-center gap-4 rounded-md border p-4">
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
                  <Mail className="size-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Email Campaign Sent</p>
                  <p className="text-sm text-muted-foreground">Class of 2020 Reunion Newsletter</p>
                </div>
                <div className="text-sm text-muted-foreground">5 hours ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
