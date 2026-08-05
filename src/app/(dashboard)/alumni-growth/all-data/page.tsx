import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Filter, Search } from "lucide-react"
import { PageBanner } from "@/components/shared/page-banner"

export default function AllDataPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      {/* Banner */}
      <PageBanner
        title="All Alumni Data"
        description={<p>Comprehensive view of the entire alumni network with advanced filtering and search.</p>}
        icon={<Database className="h-8 w-8 text-emerald-500" />}
      />

      <div className="mt-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Data Overview</CardTitle>
                <CardDescription>Browse all 5,000+ alumni records.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted">
                  <Filter className="size-4" />
                  Filter
                </button>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search alumni..."
                    className="h-8 rounded-md border bg-transparent pl-8 pr-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-5 border-b p-4 text-sm font-medium text-muted-foreground bg-muted/50">
                <div>Name</div>
                <div>Campus</div>
                <div>Course</div>
                <div>Graduation Year</div>
                <div>Status</div>
              </div>
              <div className="divide-y">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="grid grid-cols-5 p-4 text-sm items-center">
                    <div className="font-medium">Alumni {i}</div>
                    <div>Campus {i % 2 === 0 ? 'A' : 'B'}</div>
                    <div>B.Tech</div>
                    <div>202{i}</div>
                    <div>
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
