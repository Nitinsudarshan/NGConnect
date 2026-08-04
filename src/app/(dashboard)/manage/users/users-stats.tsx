"use client";

import React, { useMemo } from "react";
import { Users, Shield, Layers, Activity } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

interface UsersStatsProps {
  users: any[];
}

export function UsersStatsCards({ users }: UsersStatsProps) {
  // Stat calculations
  const stats = useMemo(() => {
    const total = users.length;
    
    // Admins count (Super Admin + Admin)
    const admins = users.filter(u => {
      const email = u.email || "";
      const isSuper = ["nitin@navgurukul.org", "nitinsudarshan@gmail.com"].includes(email.toLowerCase());
      const role = isSuper ? "Super Admin" : (u.user_metadata?.role || "Viewer");
      return role === "Super Admin" || role === "Admin";
    }).length;

    // Team allocated count (metadata.team !== "None" and metadata.team exists)
    const teamAllocated = users.filter(u => {
      const team = u.user_metadata?.team || "None";
      return team !== "None";
    }).length;

    // Active in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeRecently = users.filter(u => {
      return u.last_sign_in_at && new Date(u.last_sign_in_at) >= sevenDaysAgo;
    }).length;

    const teamPercentage = total > 0 ? Math.round((teamAllocated / total) * 100) : 0;
    const activePercentage = total > 0 ? Math.round((activeRecently / total) * 100) : 0;

    return {
      total,
      admins,
      teamAllocated,
      teamPercentage,
      activeRecently,
      activePercentage
    };
  }, [users]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
      {/* Total Users */}
      <Card className="hover:shadow-md hover:scale-[1.01] transition-all duration-300 bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Total Team Users
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500 border border-indigo-100 dark:border-indigo-900/30">
            <Users className="h-4.5 w-4.5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black tracking-tight">{stats.total}</div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Registered team members
          </p>
        </CardContent>
      </Card>

      {/* Admins & Super Admins */}
      <Card className="hover:shadow-md hover:scale-[1.01] transition-all duration-300 bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Admins & Supers
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-500 border border-purple-100 dark:border-purple-900/30">
            <Shield className="h-4.5 w-4.5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black tracking-tight">{stats.admins}</div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Privileged administrators
          </p>
        </CardContent>
      </Card>

      {/* Team Allocated */}
      <Card className="hover:shadow-md hover:scale-[1.01] transition-all duration-300 bg-card/60 backdrop-blur-md border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Team Allocation
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-pink-50 dark:bg-pink-950/40 flex items-center justify-center text-pink-500 border border-pink-100 dark:border-pink-900/30">
            <Layers className="h-4.5 w-4.5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black tracking-tight">{stats.teamAllocated}</div>
          <p className="text-xs text-muted-foreground mt-1 font-medium flex items-center gap-1">
            <Badge className="bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-400 font-bold border-none text-[9px] h-4.5 py-0">
              {stats.teamPercentage}%
            </Badge> assigned to functional teams
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
            </Badge> logged in within last 7 days
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function UsersStatsCharts({ users }: UsersStatsProps) {
  // Role distribution summary
  const roleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(u => {
      const email = u.email || "";
      const isSuper = ["nitin@navgurukul.org", "nitinsudarshan@gmail.com"].includes(email.toLowerCase());
      const role = isSuper ? "Super Admin" : (u.user_metadata?.role || "Viewer");
      counts[role] = (counts[role] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([role, value]) => ({ role, value }))
      .sort((a, b) => b.value - a.value);
  }, [users]);

  // Team distribution summary
  const teamDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(u => {
      const team = u.user_metadata?.team || "None";
      counts[team] = (counts[team] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([team, value]) => ({ team, value }))
      .sort((a, b) => b.value - a.value);
  }, [users]);

  const roleChartConfig = {
    value: {
      label: "Users",
      color: "var(--color-chart-primary)",
    }
  };

  const teamChartConfig = {
    value: {
      label: "Members",
      color: "var(--color-chart-primary)",
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
      {/* Role Distribution Bar chart */}
      <Card className="bg-card/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold tracking-tight">Role Distribution</CardTitle>
          <CardDescription className="text-xs font-medium">
            Team members mapped by assigned application role
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-2 min-h-[250px]">
          {roleDistribution.length > 0 ? (
            <ChartContainer config={roleChartConfig} className="h-[220px] w-full">
              <BarChart
                data={roleDistribution}
                layout="vertical"
                margin={{ left: 10, right: 10, top: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} />
                <XAxis type="number" hide tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="role"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={90}
                  style={{ fontSize: "11px", fontWeight: "600" }}
                />
                <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                <Bar
                  dataKey="value"
                  fill="var(--color-chart-primary)"
                  radius={[0, 4, 4, 0]}
                  name="Users"
                  barSize={16}
                >
                  <LabelList
                    dataKey="value"
                    position="right"
                    offset={8}
                    className="fill-foreground font-bold"
                    fontSize={11}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm font-medium">
              No roles to display
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Distribution Bar chart */}
      <Card className="bg-card/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold tracking-tight">Team Allocations</CardTitle>
          <CardDescription className="text-xs font-medium">
            Team members mapped by functional team assignments
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-2 min-h-[250px]">
          {teamDistribution.length > 0 ? (
            <ChartContainer config={teamChartConfig} className="h-[220px] w-full">
              <BarChart
                data={teamDistribution}
                layout="vertical"
                margin={{ left: 10, right: 10, top: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} />
                <XAxis type="number" hide tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="team"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={100}
                  style={{ fontSize: "11px", fontWeight: "600" }}
                />
                <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                <Bar
                  dataKey="value"
                  fill="var(--color-chart-primary)"
                  radius={[0, 4, 4, 0]}
                  name="Members"
                  barSize={16}
                >
                  <LabelList
                    dataKey="value"
                    position="right"
                    offset={8}
                    className="fill-foreground font-bold"
                    fontSize={11}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm font-medium">
              No teams to display
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
