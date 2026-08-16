"use client";

import React from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ReportBuilderLayout, ReportField, ReportPreset } from "@/components/shared/reports/ReportBuilderLayout";

const ALUMNI_GROWTH_FIELDS: ReportField[] = [
  { id: "name", label: "Alumnus Name", group: "Identity" },
  { id: "email", label: "Email", group: "Identity" },
  { id: "campus", label: "Campus", group: "Identity" },
  { id: "course", label: "Course", group: "Identity" },
  { id: "status", label: "Master Status", group: "Identity" },
  { id: "company", label: "Current Company", group: "Profile" },
  { id: "salary", label: "Monthly Salary (INR)", group: "Profile" },
  { id: "last_contact", label: "Last Contact Date", group: "Interactions" },
  { id: "last_outcome", label: "Last Outcome Tag", group: "Interactions" },
  { id: "pf_counted", label: "Pay-Forward Cap Progress (INR)", group: "Pay-Forward" },
  { id: "pf_lifetime", label: "Lifetime Contribution (INR)", group: "Pay-Forward" },
  { id: "mentoring_status", label: "Mentoring Pipeline Stage", group: "Pipelines" },
  { id: "placement_status", label: "Placement Pipeline Stage", group: "Pipelines" },
];

const ALUMNI_GROWTH_PRESETS: ReportPreset[] = [
  {
    id: "pay_forward",
    name: "Pay-Forward Report",
    desc: "Cap progress, monthly salary bands, monetary + non-monetary totals",
    fields: ["name", "email", "campus", "salary", "pf_counted", "pf_lifetime"],
  },
  {
    id: "mentoring",
    name: "Mentoring Pipeline Report",
    desc: "Stage breakdown, mentoring interest, session matching",
    fields: ["name", "email", "campus", "course", "mentoring_status", "last_contact"],
  },
  {
    id: "placement",
    name: "Placement Pipeline Report",
    desc: "Working status, current company, placement support outreach",
    fields: ["name", "email", "campus", "company", "placement_status", "last_outcome"],
  },
  {
    id: "consolidated_donor",
    name: "Consolidated Donor Report",
    desc: "Rollup of all donor contributions across campuses & teams",
    fields: ["name", "email", "campus", "pf_counted", "pf_lifetime", "last_contact"],
  },
];

const REASON_COLORS = [
  "#4f46e5",
  "#059669",
  "#ea580c",
  "#2563eb",
  "#c026d3",
  "#e11d48",
  "#0d9488",
  "#65a30d",
  "#7c3aed",
  "#d97706",
];

interface ReportsClientProps {
  sampleData: any[];
  teamActivity: { staff: string; byReason: Record<string, number>; total: number }[];
}

export default function ReportsClient({ sampleData, teamActivity }: ReportsClientProps) {
  const allReasons = Array.from(
    new Set(teamActivity.flatMap((t) => Object.keys(t.byReason)))
  ).sort();

  const chartData = teamActivity.map((t) => ({
    name: t.staff.split("@")[0],
    total: t.total,
    ...t.byReason,
  }));

  const teamActivityTabContent = (
    <div className="space-y-6 pt-2">
      <Card className="border border-border/80 rounded-2xl bg-card shadow-2xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Staff Activity Breakdown by Interaction Reason</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ChartContainer config={{}} className="h-full w-full">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                {allReasons.map((reason, index) => (
                  <Bar
                    key={reason}
                    dataKey={reason}
                    stackId="a"
                    fill={REASON_COLORS[index % REASON_COLORS.length]}
                    name={reason}
                  />
                ))}
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <ReportBuilderLayout
      title="Alumni Growth Reporting Hub"
      description="Field-picker driven custom report generator for Pay-Forward, Mentoring, and Placement pipelines."
      icon={<BarChart3 className="h-8 w-8 text-primary" />}
      availableFields={ALUMNI_GROWTH_FIELDS}
      presets={ALUMNI_GROWTH_PRESETS}
      data={sampleData}
      defaultPresetId="pay_forward"
      exportFilenamePrefix="NGConnect_Alumni_Growth_Report"
      extraTabs={[
        {
          id: "team-activity",
          label: "Team Activity Breakdown",
          content: teamActivityTabContent,
        },
      ]}
    />
  );
}
