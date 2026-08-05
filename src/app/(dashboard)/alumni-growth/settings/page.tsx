import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Bell, Shield, Paintbrush } from "lucide-react"
import { PageBanner } from "@/components/shared/page-banner"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      {/* Banner */}
      <PageBanner
        title="Settings"
        description={<p>Configure your alumni growth module preferences and workspace defaults.</p>}
        icon={<Settings className="h-8 w-8 text-slate-500" />}
      />

      <div className="mt-4 grid gap-6 md:grid-cols-12">
        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <nav className="flex space-x-2 md:flex-col md:space-x-0 md:space-y-1">
            <button className="flex w-full items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm font-medium">
              <Settings className="size-4" />
              General
            </button>
            <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/50 text-muted-foreground">
              <Bell className="size-4" />
              Notifications
            </button>
            <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/50 text-muted-foreground">
              <Shield className="size-4" />
              Permissions
            </button>
            <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/50 text-muted-foreground">
              <Paintbrush className="size-4" />
              Appearance
            </button>
          </nav>
        </div>
        
        <div className="col-span-12 md:col-span-8 lg:col-span-9">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Update your workspace preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Workspace Name
                </label>
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue="Main Alumni Network"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Default View
                </label>
                <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option>Table View</option>
                  <option>Card View</option>
                  <option>List View</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  Save Changes
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
