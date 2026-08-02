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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"

interface DashboardChartsProps {
  data: any[]
}

const chartConfig = {
  alumni: { label: "Alumni" },
  color1: { color: "#0088FE" },
  color2: { color: "#00C49F" },
  color3: { color: "#FFBB28" },
  color4: { color: "#FF8042" },
  color5: { color: "#8884d8" },
  color6: { color: "#82ca9d" },
  color7: { color: "#ffc658" },
  color8: { color: "#d0ed57" },
}

const getColorVar = (index: number) => `var(--color-color${(index % 8) + 1})`

export function DashboardCharts({ data }: DashboardChartsProps) {
  // Aggregate data for Status
  const statusData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const status = curr.status || 'Unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    })).sort((a, b) => b.value - a.value)
  }, [data])

  // Aggregate data for Campus
  const campusData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const campus = curr.campus || 'Unknown'
      acc[campus] = (acc[campus] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    })).sort((a, b) => b.value - a.value).slice(0, 7) // Top 7 campuses
  }, [data])

  // Aggregate data for Course
  const courseData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const course = curr.course || 'Unknown'
      acc[course] = (acc[course] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    })).sort((a, b) => b.value - a.value)
  }, [data])

  // Aggregate data for Gender
  const genderData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const gender = curr.gender || 'Unknown'
      acc[gender] = (acc[gender] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    })).sort((a, b) => b.value - a.value)
  }, [data])

  if (!data || data.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Status Chart */}
      <Card className="bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800 hover:shadow-md transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg">Alumni Status Distribution</CardTitle>
          <CardDescription>Current status across all imported alumni</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorVar(index)} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Campus Chart */}
      <Card className="bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800 hover:shadow-md transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg">Top Campuses</CardTitle>
          <CardDescription>Alumni distribution by primary campus</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart data={campusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <ChartTooltip cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }} content={<ChartTooltipContent />} />
              <Bar dataKey="value" name="Alumni" radius={[4, 4, 0, 0]}>
                {campusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorVar(index + 1)} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Course Chart */}
      <Card className="bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800 hover:shadow-md transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg">School Distribution</CardTitle>
          <CardDescription>Alumni across different courses/schools</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart data={courseData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
              <ChartTooltip cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }} content={<ChartTooltipContent />} />
              <Bar dataKey="value" name="Alumni" radius={[0, 4, 4, 0]}>
                {courseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorVar(index + 2)} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Gender Distribution */}
      <Card className="bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800 hover:shadow-md transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg">Gender Distribution</CardTitle>
          <CardDescription>Overall gender ratio among alumni</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorVar(index + 3)} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
