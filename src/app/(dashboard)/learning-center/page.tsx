"use client"

import React, { useMemo } from "react"
import {
  Users,
  Video,
  Star,
  Activity,
  Calendar,
  Clock,
  ExternalLink,
  Bell,
  MessageSquare,
  Upload
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"

const chartConfig = {
  sessions: { label: "Sessions", color: "var(--color-chart-primary)" },
}

export default function LearningCenterDashboard() {
  // Mock Data
  const stats = {
    totalSessions: 142,
    upcoming: 8,
    activeMentors: 34,
    avgAttendance: 76,
    avgRating: 4.8
  }

  const upcomingSessions = [
    { id: "1", mentor: "John Doe", topic: "Advanced React Patterns", date: "Oct 12", time: "18:00", audience: "Both", platform: "Zoom" },
    { id: "2", mentor: "Jane Smith", topic: "Intro to UI Design", date: "Oct 15", time: "10:00", audience: "Internal Alumni", platform: "Zoom" },
    { id: "3", mentor: "Alex Johnson", topic: "System Design Prep", date: "Oct 18", time: "15:30", audience: "External Alumni", platform: "Google Meet" },
    { id: "4", mentor: "Sam Lee", topic: "Startup Funding 101", date: "Oct 20", time: "19:00", audience: "NG Team", platform: "Zoom" },
    { id: "5", mentor: "Michael Chen", topic: "Go Concurrency", date: "Oct 22", time: "11:00", audience: "Both", platform: "Zoom" },
  ]

  const recentActivity = [
    { id: "1", type: "created", text: "Session 'Advanced React Patterns' was created", time: "2h ago", icon: Calendar, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { id: "2", type: "reminder", text: "Reminder sent for 'Intro to UI Design'", time: "4h ago", icon: Bell, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { id: "3", type: "feedback", text: "Received 15 new feedback responses", time: "1d ago", icon: MessageSquare, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { id: "4", type: "recording", text: "Recording uploaded for 'Database Indexing'", time: "2d ago", icon: Upload, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  ]

  const sessionsPerMonth = [
    { month: "Jan", sessions: 4 },
    { month: "Feb", sessions: 6 },
    { month: "Mar", sessions: 5 },
    { month: "Apr", sessions: 8 },
    { month: "May", sessions: 7 },
    { month: "Jun", sessions: 10 },
    { month: "Jul", sessions: 12 },
    { month: "Aug", sessions: 9 },
    { month: "Sep", sessions: 14 },
    { month: "Oct", sessions: 8 }, // current month
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Learning Center</h1>
          <p className="text-muted-foreground">Overview of mentorship sessions and engagement.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Sessions</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalSessions}</p>
            </div>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <Video className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Upcoming (30d)</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.upcoming}</p>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Mentors</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeMentors}</p>
            </div>
            <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
              <Users className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg. Attendance</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgAttendance}%</p>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg. Rating</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgRating}</p>
            </div>
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Star className="w-5 h-5 text-yellow-500 dark:text-yellow-400 fill-yellow-500/20" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Sessions per Month</CardTitle>
            <CardDescription>Number of mentorship sessions conducted</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart data={sessionsPerMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickMargin={10} />
                <ChartTooltip cursor={{ fill: 'var(--color-muted)' }} content={<ChartTooltipContent />} />
                <Bar dataKey="sessions" fill="var(--color-chart-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className={`mt-0.5 p-1.5 rounded-full ${activity.bg} shrink-0`}>
                    <activity.icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions List */}
      <Card className="bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
          <CardDescription>Next 5 scheduled sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 dark:border-zinc-800 rounded-lg gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{session.topic}</h4>
                    <Badge variant="outline" className="font-normal text-xs">{session.audience}</Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground gap-4">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {session.mentor}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {session.date} • {session.time}</span>
                    <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5" /> {session.platform}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="hidden sm:flex">
                    <Bell className="w-3.5 h-3.5 mr-1" /> Reminder
                  </Button>
                  <Button size="sm">
                    Details <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
