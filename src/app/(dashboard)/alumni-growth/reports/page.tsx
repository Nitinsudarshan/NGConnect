import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, TrendingUp, Download } from "lucide-react"
import { PageBanner } from "@/components/shared/page-banner"

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      {/* Banner */}
      <PageBanner
        title="Growth Reports"
        description={<p>Analytics, metrics, and detailed trends for alumni engagement and network growth.</p>}
        icon={<BarChart className="h-8 w-8 text-purple-500" />}
        actions={
          <button className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
            <Download className="size-4" />
            Export
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Engagement Over Time</CardTitle>
            <CardDescription>Monthly interaction metrics</CardDescription>
          </CardHeader>
          <CardContent className="flex aspect-video items-center justify-center rounded-md border border-dashed bg-muted/20">
            <div className="flex flex-col items-center text-muted-foreground">
              <TrendingUp className="mb-2 size-8 text-purple-500/50" />
              <p>Chart Placeholder</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Demographics Breakdown</CardTitle>
            <CardDescription>By campus and graduation year</CardDescription>
          </CardHeader>
          <CardContent className="flex aspect-video items-center justify-center rounded-md border border-dashed bg-muted/20">
            <div className="flex flex-col items-center text-muted-foreground">
              <BarChart className="mb-2 size-8 text-pink-500/50" />
              <p>Chart Placeholder</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
          <CardDescription>Summary of growth metrics for the current quarter.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Email Open Rate</p>
              <div className="text-2xl font-bold">42.5%</div>
              <p className="text-xs text-green-500">+4.1% vs last quarter</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Event Attendance</p>
              <div className="text-2xl font-bold">1,240</div>
              <p className="text-xs text-green-500">+12% vs last quarter</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Mentorship Matches</p>
              <div className="text-2xl font-bold">85</div>
              <p className="text-xs text-red-500">-2% vs last quarter</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
