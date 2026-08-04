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
  Label,
  LabelList,
  RadialBarChart,
  RadialBar,
  PolarRadiusAxis,
  PolarAngleAxis,
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

  // Aggregate data for Campus (Radial Chart Label format)
  const campusStats = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const campus = curr.campus || 'Unknown'
      acc[campus] = (acc[campus] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const sortedEntries = Object.entries(counts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5) // Top 5 campuses

    const chartData: any[] = []
    const config: Record<string, any> = {
      count: { label: "Alumni" }
    }

    sortedEntries.forEach(([key, val], index) => {
      const safeKey = key.replace(/[^a-zA-Z0-9]/g, '') || `campus_${index}`
      
      chartData.push({
        campus: safeKey,
        label: key,
        count: val,
        fill: `var(--color-${safeKey})`
      })
      
      config[safeKey] = {
        label: key,
        color: `var(--chart-${(index % 5) + 1})`,
      }
    })

    return { chartData, config }
  }, [data])

  // Aggregate data for Course (Radial Chart Label format)
  const courseStats = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const course = curr.course || 'Unknown'
      acc[course] = (acc[course] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const sortedEntries = Object.entries(counts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5) // Top 5 courses

    const chartData: any[] = []
    const config: Record<string, any> = {
      count: { label: "Alumni" }
    }

    sortedEntries.forEach(([key, val], index) => {
      const safeKey = key.replace(/[^a-zA-Z0-9]/g, '') || `course_${index}`
      
      chartData.push({
        course: safeKey,
        label: key,
        count: val,
        fill: `var(--color-${safeKey})`
      })
      
      config[safeKey] = {
        label: key,
        color: `var(--chart-${(index % 5) + 1})`,
      }
    })

    return { chartData, config }
  }, [data])

  // Aggregate data for Gender (Single object for stacked radial chart)
  const genderStats = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const gender = curr.gender || 'Unknown'
      acc[gender] = (acc[gender] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const sortedEntries = Object.entries(counts).sort((a, b) => (b[1] as number) - (a[1] as number))
    
    const singleDataPoint: any = { category: "gender" }
    const config: any = {}
    const bars: { key: string, label: string }[] = []

    sortedEntries.forEach(([key, val], index) => {
      // Create safe keys for CSS variables (e.g., 'Non Binary' -> 'NonBinary')
      const safeKey = key.replace(/\s+/g, '') || `gender_${index}`
      singleDataPoint[safeKey] = val
      config[safeKey] = {
        label: key,
        color: `var(--chart-${(index % 5) + 1})`,
      }
      bars.push({
        key: safeKey,
        label: key
      })
    })

    return { chartData: [singleDataPoint], config, bars, total: data.length }
  }, [data])

  if (!data || data.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {/* Status Chart */}
      <Card className="bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800 hover:shadow-md transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg">Alumni Status Distribution</CardTitle>
          <CardDescription>Current status across all imported alumni</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel indicator="dot" />} />
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                strokeWidth={5}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorVar(index)} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 8}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {statusData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 16}
                            className="fill-muted-foreground"
                          >
                            Alumni
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Campus Chart */}
      <Card className="bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800 hover:shadow-md transition-all duration-300 flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle className="text-lg">Top Campuses</CardTitle>
          <CardDescription>Alumni distribution by primary campus</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer config={campusStats.config} className="mx-auto aspect-square max-h-[250px]">
            <RadialBarChart
              data={campusStats.chartData}
              startAngle={-90}
              endAngle={380}
              innerRadius={30}
              outerRadius={110}
            >
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="campus" />} />
              <RadialBar dataKey="count" background>
                <LabelList
                  position="insideStart"
                  dataKey="label"
                  className="fill-white capitalize mix-blend-luminosity"
                  fontSize={11}
                />
              </RadialBar>
            </RadialBarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Course Chart */}
      <Card className="bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800 hover:shadow-md transition-all duration-300 flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle className="text-lg">School Distribution</CardTitle>
          <CardDescription>Alumni across different courses/schools</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer config={courseStats.config} className="mx-auto aspect-square max-h-[250px]">
            <RadialBarChart
              data={courseStats.chartData}
              startAngle={-90}
              endAngle={380}
              innerRadius={30}
              outerRadius={110}
            >
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="course" />} />
              <RadialBar dataKey="count" background>
                <LabelList
                  position="insideStart"
                  dataKey="label"
                  className="fill-white capitalize mix-blend-luminosity"
                  fontSize={11}
                />
              </RadialBar>
            </RadialBarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Gender Distribution */}
      <Card className="bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800 hover:shadow-md transition-all duration-300 flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle className="text-lg">Gender Distribution</CardTitle>
          <CardDescription>Overall gender ratio among alumni</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center pb-0">
          <ChartContainer config={genderStats.config} className="mx-auto aspect-square w-full max-w-[250px]">
            <RadialBarChart
              data={genderStats.chartData}
              startAngle={180}
              endAngle={0}
              innerRadius={80}
              outerRadius={110}
            >
              <PolarAngleAxis type="number" domain={[0, genderStats.total]} tick={false} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel indicator="dot" />}
              />
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 16}
                            className="fill-foreground text-2xl font-bold"
                          >
                            {genderStats.total.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 4}
                            className="fill-muted-foreground"
                          >
                            Alumni
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </PolarRadiusAxis>
              {genderStats.bars.map((bar) => (
                <RadialBar
                  key={bar.key}
                  dataKey={bar.key}
                  stackId="a"
                  cornerRadius={5}
                  fill={`var(--color-${bar.key})`}
                  className="stroke-transparent stroke-2"
                />
              ))}
            </RadialBarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
