import React from "react"
import { createClient } from "@/lib/supabase/server"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  GraduationCap,
  UserCheck,
  UserX,
  UserMinus,
  CalendarClock,
  PhoneCall,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import CallListTable from "./_components/CallListTable"

const metrics = [
  {
    title: "Eligible Alumni",
    value: "1,245",
    icon: GraduationCap,
    description: "Total pool for outreach",
    color: "indigo",
  },
  {
    title: "Connected",
    value: "342",
    icon: UserCheck,
    description: "Successfully reached",
    color: "emerald",
  },
  {
    title: "Non Responsive",
    value: "156",
    icon: UserX,
    description: "Did not answer",
    color: "rose",
  },
  {
    title: "Yet to Connect",
    value: "747",
    icon: UserMinus,
    description: "Pending initial outreach",
    color: "amber",
  },
  {
    title: "Rescheduled",
    value: "45",
    icon: CalendarClock,
    description: "Meetings moved",
    color: "purple",
  },
  {
    title: "Followups",
    value: "89",
    icon: PhoneCall,
    description: "Action required",
    color: "cyan",
  },
]

const colorClasses: Record<string, string> = {
  indigo: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 border-indigo-100 dark:border-indigo-900/30",
  emerald: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 border-emerald-100 dark:border-emerald-900/30",
  rose: "bg-rose-50 dark:bg-rose-950/40 text-rose-500 border-rose-100 dark:border-rose-900/30",
  amber: "bg-amber-50 dark:bg-amber-950/40 text-amber-500 border-amber-100 dark:border-amber-900/30",
  purple: "bg-purple-50 dark:bg-purple-950/40 text-purple-500 border-purple-100 dark:border-purple-900/30",
  cyan: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-500 border-cyan-100 dark:border-cyan-900/30",
};

const DUMMY_ALUMNI = [
  { email: "rahul@example.com", name: "Rahul Sharma", campus: "Nirma University", entry_year: 2021, phone_number: "+91 98765 43210", status: "Yet to Connect" },
  { email: "priya@example.com", name: "Priya Singh", campus: "PES University", entry_year: 2022, phone_number: "+91 87654 32109", status: "Rescheduled" },
  { email: "amit@example.com", name: "Amit Kumar", campus: "Nirma University", entry_year: 2020, phone_number: "+91 76543 21098", status: "Followup" },
  { email: "sneha@example.com", name: "Sneha Gupta", campus: "PES University", entry_year: 2023, phone_number: "+91 65432 10987", status: "Yet to Connect" },
  { email: "vikram@example.com", name: "Vikram Reddy", campus: "Nirma University", entry_year: 2021, phone_number: "+91 54321 09876", status: "Non Responsive" },
]

export default async function WorkspacePage() {
  const supabase = await createClient()
  const { data } = await supabase.from('alumni_master').select('*').limit(20)
  
  const callList = data && data.length > 0 ? data : DUMMY_ALUMNI;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-300 dark:to-white bg-clip-text text-transparent">Workspace</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon
          const colorClass = colorClasses[metric.color] || colorClasses.indigo;
          
          return (
            <Card key={metric.title} className="hover:shadow-md hover:scale-[1.01] transition-all duration-300 bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${colorClass}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black tracking-tight">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Separator className="my-6" />

      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4">Call List</h2>
        <CallListTable alumniData={callList} />
      </div>
    </div>
  )
}
