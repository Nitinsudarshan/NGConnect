import { DashboardGreeting } from "@/components/dashboard-greeting"

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <DashboardGreeting />
    </div>
  )
}
