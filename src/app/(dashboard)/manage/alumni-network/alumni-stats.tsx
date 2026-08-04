"use client";

import React, { useState, useMemo } from "react";
import { Users, CheckCircle2, Activity, Calendar, TrendingUp, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

interface AlumniNetworkStatsProps {
  users: any[];
}

export function AlumniNetworkStatsCards({ users }: AlumniNetworkStatsProps) {
  // Format users with date objects
  const mappedUsers = useMemo(() => {
    return users.map(u => ({
      ...u,
      lastSignInDate: u.last_sign_in_at ? new Date(u.last_sign_in_at) : null
    }));
  }, [users]);

  // Stat calculations
  const stats = useMemo(() => {
    const total = mappedUsers.length;
    const activated = mappedUsers.filter(u => u.lastSignInDate !== null).length;
    
    // Active in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeRecently = mappedUsers.filter(u => u.lastSignInDate && u.lastSignInDate >= sevenDaysAgo).length;

    const activationPercentage = total > 0 ? Math.round((activated / total) * 100) : 0;
    const activePercentage = total > 0 ? Math.round((activeRecently / total) * 100) : 0;

    return {
      total,
      activated,
      activationPercentage,
      activeRecently,
      activePercentage
    };
  }, [mappedUsers]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
      {/* Total Alumni */}
      <Card className="hover:shadow-md hover:scale-[1.01] transition-all duration-300 bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Total Alumni
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500 border border-indigo-100 dark:border-indigo-900/30">
            <Users className="h-4.5 w-4.5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black tracking-tight">{stats.total}</div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Registered alumni members
          </p>
        </CardContent>
      </Card>

      {/* Activation Rate */}
      <Card className="hover:shadow-md hover:scale-[1.01] transition-all duration-300 bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Activation Rate
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle2 className="h-4.5 w-4.5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black tracking-tight">
            {stats.activated} <span className="text-sm font-bold text-muted-foreground">/ {stats.total}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium flex items-center gap-1">
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold border-none text-[9px] h-4.5 py-0">
              {stats.activationPercentage}%
            </Badge> logged in at least once
          </p>
        </CardContent>
      </Card>

      {/* Active Recently */}
      <Card className="hover:shadow-md hover:scale-[1.01] transition-all duration-300 bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Active Recently
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 border border-amber-100 dark:border-amber-900/30">
            <Activity className="h-4.5 w-4.5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black tracking-tight">{stats.activeRecently}</div>
          <p className="text-xs text-muted-foreground mt-1 font-medium flex items-center gap-1">
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 font-bold border-none text-[9px] h-4.5 py-0">
              {stats.activePercentage}%
            </Badge> active in last 7 days
          </p>
        </CardContent>
      </Card>

      {/* Growth Engagement */}
      <Card className="hover:shadow-md hover:scale-[1.01] transition-all duration-300 bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Engagement Index
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center text-cyan-500 border border-cyan-100 dark:border-cyan-900/30">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black tracking-tight">
            {stats.total > 0 ? Math.round((stats.activeRecently / stats.total) * 100) : 0}%
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Ratio of weekly active members
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function AlumniNetworkStatsCharts({ users }: AlumniNetworkStatsProps) {
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d" | "all">("30d");

  // Format users with date objects
  const mappedUsers = useMemo(() => {
    return users.map(u => ({
      ...u,
      lastSignInDate: u.last_sign_in_at ? new Date(u.last_sign_in_at) : null
    }));
  }, [users]);

  // Stat calculations for trend card logic
  const stats = useMemo(() => {
    const total = mappedUsers.length;
    const activated = mappedUsers.filter(u => u.lastSignInDate !== null).length;
    return { total, activated };
  }, [mappedUsers]);

  // Activation Trend Data calculation
  const activationTrendData = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    
    const activeUsers = mappedUsers.filter(u => u.lastSignInDate !== null);

    if (timeframe === "7d") {
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === "30d") {
      startDate.setDate(now.getDate() - 30);
    } else if (timeframe === "90d") {
      startDate.setDate(now.getDate() - 90);
    } else {
      if (activeUsers.length > 0) {
        const oldestLogin = activeUsers.reduce((oldest, user) => {
          return user.lastSignInDate! < oldest ? user.lastSignInDate! : oldest;
        }, now);
        startDate = new Date(oldestLogin.getTime());
      } else {
        startDate.setDate(now.getDate() - 365);
      }
      startDate.setDate(startDate.getDate() - 1);
    }
    
    startDate.setHours(0, 0, 0, 0);

    const initialCount = activeUsers.filter(u => u.lastSignInDate! < startDate).length;

    const dateMap: Record<string, number> = {};
    const tempDate = new Date(startDate);
    
    while (tempDate <= now) {
      const dateString = tempDate.toISOString().split("T")[0];
      dateMap[dateString] = 0;
      tempDate.setDate(tempDate.getDate() + 1);
    }

    activeUsers.forEach(u => {
      const dateString = u.lastSignInDate!.toISOString().split("T")[0];
      if (dateString in dateMap) {
        dateMap[dateString]++;
      }
    });

    let cumulative = initialCount;
    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, count]) => {
        cumulative += count;
        const d = new Date(dateStr);
        const displayDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return {
          date: displayDate,
          fullDate: dateStr,
          logins: count,
          cumulative: cumulative,
        };
      });
  }, [mappedUsers, timeframe]);

  const trendChartConfig = {
    cumulative: {
      label: "Activated Alumni",
      color: "var(--color-chart-primary)",
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between overflow-hidden mt-4">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-bold tracking-tight">Alumni Activation Trend</CardTitle>
          <CardDescription className="text-xs font-medium">
            Cumulative alumni network members who have logged in
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={(val: any) => setTimeframe(val)}>
            <SelectTrigger className="h-8 w-[140px] rounded-lg text-xs bg-background/50 border-input">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <SelectValue placeholder="Timeframe" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="7d" className="rounded-md text-xs">Last 7 Days</SelectItem>
              <SelectItem value="30d" className="rounded-md text-xs">Last 30 Days</SelectItem>
              <SelectItem value="90d" className="rounded-md text-xs">Last 90 Days</SelectItem>
              <SelectItem value="all" className="rounded-md text-xs">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-6 pb-2 pl-0 flex-1 min-h-[300px]">
        {stats.activated > 0 ? (
          <ChartContainer config={trendChartConfig} className="h-[280px] w-full">
            <AreaChart
              data={activationTrendData}
              margin={{ left: 10, right: 10, top: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorAlumniCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-primary)" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="var(--color-chart-primary)" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickLine={false}
                axisLine={false}
                dy={10}
                tickMargin={8}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={{ stroke: "var(--color-chart-primary)", strokeWidth: 1, strokeDasharray: "4 4" }}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="var(--color-chart-primary)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorAlumniCumulative)"
                name="Activated Alumni"
                dot={{ r: 2, strokeWidth: 1, fill: "var(--color-chart-primary)" }}
                activeDot={{ r: 5, strokeWidth: 1 }}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground text-sm font-medium gap-2">
            <Info className="h-8 w-8 text-muted-foreground/60" />
            <span>No alumni have logged in yet to plot activation trends.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
