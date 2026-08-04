"use client"

import React, { useMemo } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"

interface CourseraMonthlyMetric {
  month_label: string
  total_learning_hours: number
  course_completions: number
  active_users: number
}

interface CourseraChartsProps {
  metrics: CourseraMonthlyMetric[]
}

const chartConfig = {
  total_learning_hours: {
    label: "Learning Hours",
    color: "#3b82f6",
  },
  course_completions: {
    label: "Course Completions",
    color: "#8b5cf6",
  },
  active_users: {
    label: "Active Learners",
    color: "#10b981",
  },
}

export function CourseraCharts({ metrics }: CourseraChartsProps) {
  // Ensure metrics are sorted chronologically if month_label is like "2023-01" or similar
  // Assuming they are already sorted from the DB or backend.
  const data = useMemo(() => {
    return metrics || []
  }, [metrics])

  if (!data || data.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Learning Hours Trend */}
      <Card className="bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800 hover:shadow-md transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg">Learning Hours Trend</CardTitle>
          <CardDescription>Total learning hours per month</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month_label" tick={{ fontSize: 12 }} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line 
                type="monotone" 
                dataKey="total_learning_hours" 
                name="Learning Hours" 
                stroke="var(--color-total_learning_hours)" 
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--color-total_learning_hours)" }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Course Completions & Active Users */}
      <Card className="bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800 hover:shadow-md transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg">Completions & Activity</CardTitle>
          <CardDescription>Monthly course completions and active learners</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month_label" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" orientation="left" stroke="var(--color-course_completions)" />
              <YAxis yAxisId="right" orientation="right" stroke="var(--color-active_users)" />
              <ChartTooltip cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }} content={<ChartTooltipContent indicator="dot" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar yAxisId="left" dataKey="course_completions" name="Course Completions" fill="var(--color-course_completions)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar yAxisId="right" dataKey="active_users" name="Active Learners" fill="var(--color-active_users)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
