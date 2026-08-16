"use client";

import React from "react";
import { ShieldAlert, Users, TrendingUp, BookOpen, AlertTriangle, Layers, Award, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReportBuilderLayout, ReportField, ReportPreset } from "@/components/shared/reports/ReportBuilderLayout";

const MANAGE_REPORT_FIELDS: ReportField[] = [
  // User Identity & Security
  { id: "name", label: "User / Alumnus Name", group: "Identity & Accounts" },
  { id: "email", label: "Email Address", group: "Identity & Accounts" },
  { id: "user_category", label: "User Category (Staff / Member)", group: "Identity & Accounts" },
  { id: "role", label: "Assigned Role", group: "Identity & Accounts" },
  { id: "team", label: "Assigned Team", group: "Identity & Accounts" },
  { id: "campus", label: "Campus", group: "Identity & Accounts" },
  { id: "course", label: "Course / Track", group: "Identity & Accounts" },
  { id: "master_status", label: "Master Account Status", group: "Identity & Accounts" },
  { id: "created_at", label: "Account Registered Date", group: "Identity & Accounts" },

  // Alumni Growth & Pipelines
  { id: "company", label: "Current Employer", group: "Alumni Growth CRM" },
  { id: "salary", label: "Monthly Salary (INR)", group: "Alumni Growth CRM" },
  { id: "pf_counted", label: "Pay-Forward Cap Progress (INR)", group: "Alumni Growth CRM" },
  { id: "pf_lifetime", label: "Lifetime Monetary Contribution (INR)", group: "Alumni Growth CRM" },
  { id: "mentoring_status", label: "Mentoring Pipeline Stage", group: "Alumni Growth CRM" },
  { id: "placement_status", label: "Placement Pipeline Stage", group: "Alumni Growth CRM" },
  { id: "last_contact", label: "Last Interaction Date", group: "Alumni Growth CRM" },
  { id: "last_outcome", label: "Last Interaction Outcome", group: "Alumni Growth CRM" },

  // Learning Center & LMS
  { id: "program_name", label: "Learning Program Hub", group: "Learning Center LMS" },
  { id: "learning_hours", label: "Total Coursera Hours", group: "Learning Center LMS" },
  { id: "completed_courses", label: "Completed Courses Count", group: "Learning Center LMS" },
  { id: "enrolled_courses", label: "Enrolled Courses Count", group: "Learning Center LMS" },
  { id: "compliance_status", label: "20h License Compliance", group: "Learning Center LMS" },

  // Data Quality & Deliverability
  { id: "suppression_status", label: "Contact Suppression Flag", group: "Data Quality & Health" },
  { id: "suppressed_since", label: "Suppressed Since Date", group: "Data Quality & Health" },
  { id: "email_activity_status", label: "90-Day Email Activity", group: "Data Quality & Health" },
  { id: "call_activity_status", label: "Call Activity Status", group: "Data Quality & Health" },
  { id: "delivery_failures", label: "Notification Send Failures", group: "Data Quality & Health" },
  { id: "last_delivery_error", label: "Last Delivery Error Note", group: "Data Quality & Health" },
  { id: "data_health_flag", label: "Data Health Recommendation", group: "Data Quality & Health" },

  // Engagement Requests
  { id: "request_count", label: "Access Requests Submitted", group: "Member Engagement" },
];

const MANAGE_REPORT_PRESETS: ReportPreset[] = [
  {
    id: "master_executive",
    name: "Master Executive Consolidated Report",
    desc: "Cross-platform summary combining user roles, salary, pay-forward, Coursera hours, and data health",
    fields: ["name", "email", "user_category", "role", "team", "salary", "pf_lifetime", "learning_hours", "data_health_flag"],
  },
  {
    id: "user_classification",
    name: "Users & Staff Classification Audit",
    desc: "Breakdown of internal Staff accounts (Super Admin, Admin, Manager, Program, Ops) vs Alumni Members",
    fields: ["name", "email", "user_category", "role", "team", "campus", "created_at"],
  },
  {
    id: "alumni_growth_full",
    name: "Detailed Alumni Growth & Pipeline Audit",
    desc: "Complete CRM rollup across current employer, salary, Pay-Forward total, Mentoring & Placement stages",
    fields: ["name", "email", "company", "salary", "pf_counted", "pf_lifetime", "mentoring_status", "placement_status", "last_contact"],
  },
  {
    id: "learning_center_full",
    name: "Learning Center & Coursera Telemetry",
    desc: "Full LMS breakdown across active learning hours, completed tracks, and 20-hour compliance status",
    fields: ["name", "email", "program_name", "learning_hours", "completed_courses", "compliance_status"],
  },
  {
    id: "data_quality_suppression",
    name: "Data Quality & Deliverability Audit",
    desc: "Data quality audit for contact suppressions, 90-day activity, notification send failures, and error notes",
    fields: ["name", "email", "suppression_status", "suppressed_since", "email_activity_status", "delivery_failures", "last_delivery_error", "data_health_flag"],
  },
];

interface SummaryMetrics {
  totalAccounts: number;
  staffCount: number;
  memberCount: number;
  totalPfMonetary: number;
  totalHours: number;
  totalCompliant: number;
  totalSuppressed: number;
  totalFailures: number;
  totalRequests: number;
}

interface ManageReportsClientProps {
  data: {
    masterRows: Record<string, any>[];
    summary: SummaryMetrics;
  };
}

export default function ManageReportsClient({ data }: ManageReportsClientProps) {
  const { masterRows, summary } = data;

  const overviewTabContent = (
    <div className="space-y-6 pt-2">
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 bg-card/60 backdrop-blur-sm rounded-2xl">
          <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total System Accounts
            </CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-1">
            <div className="text-2xl font-black">{summary.totalAccounts}</div>
            <div className="flex gap-1.5 pt-1">
              <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-200">
                Staff: {summary.staffCount}
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-200">
                Members: {summary.memberCount}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card/60 backdrop-blur-sm rounded-2xl">
          <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Pay-Forward Monetary Total
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-1">
            <div className="text-2xl font-black">₹{summary.totalPfMonetary.toLocaleString()}</div>
            <p className="text-[11px] text-muted-foreground">Lifetime monetary contributions logged</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card/60 backdrop-blur-sm rounded-2xl">
          <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Coursera Learning Hours
            </CardTitle>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-1">
            <div className="text-2xl font-black">{summary.totalHours} hrs</div>
            <p className="text-[11px] text-muted-foreground">{summary.totalCompliant} learners compliant (≥20h)</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card/60 backdrop-blur-sm rounded-2xl">
          <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Data Quality Signals
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-1">
            <div className="text-2xl font-black text-amber-600">{summary.totalSuppressed} Suppressed</div>
            <p className="text-[11px] text-muted-foreground">{summary.totalFailures} notification delivery failures</p>
          </CardContent>
        </Card>
      </div>

      {/* Categorized Breakdown Table */}
      <Card className="border border-border/80 rounded-2xl bg-card shadow-2xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" /> Master System Classification Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
              <h4 className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                <Users className="w-3.5 h-3.5 text-indigo-600" /> User Classification
              </h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li className="flex justify-between"><span>Internal Staff Accounts:</span> <strong className="text-foreground">{summary.staffCount}</strong></li>
                <li className="flex justify-between"><span>External Alumni Members:</span> <strong className="text-foreground">{summary.memberCount}</strong></li>
                <li className="flex justify-between"><span>Total Registered:</span> <strong className="text-foreground">{summary.totalAccounts}</strong></li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
              <h4 className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Alumni Growth CRM
              </h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li className="flex justify-between"><span>Lifetime Contributed:</span> <strong className="text-foreground">₹{summary.totalPfMonetary.toLocaleString()}</strong></li>
                <li className="flex justify-between"><span>Member Access Requests:</span> <strong className="text-foreground">{summary.totalRequests}</strong></li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
              <h4 className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Learning & Telemetry
              </h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li className="flex justify-between"><span>Total Active Hours:</span> <strong className="text-foreground">{summary.totalHours} hrs</strong></li>
                <li className="flex justify-between"><span>Compliant Learners (≥20h):</span> <strong className="text-foreground">{summary.totalCompliant}</strong></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <ReportBuilderLayout
      title="Master Administration & System Reports"
      description="Detailed, classified report generator covering Users (Staff vs Members), Alumni Growth CRM, Learning Center LMS, and Data Quality."
      icon={<ShieldAlert className="h-8 w-8 text-primary" />}
      availableFields={MANAGE_REPORT_FIELDS}
      presets={MANAGE_REPORT_PRESETS}
      data={masterRows}
      defaultPresetId="master_executive"
      exportFilenamePrefix="NGConnect_Master_Executive_Report"
      extraTabs={[
        {
          id: "executive-overview",
          label: "Executive System Summary",
          content: overviewTabContent,
        },
      ]}
    />
  );
}
