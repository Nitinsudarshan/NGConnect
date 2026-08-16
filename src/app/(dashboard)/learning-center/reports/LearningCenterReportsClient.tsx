"use client";

import React from "react";
import { BookOpen } from "lucide-react";
import { ReportBuilderLayout, ReportField, ReportPreset } from "@/components/shared/reports/ReportBuilderLayout";
import ReportGeneratorClient from "@/app/(dashboard)/reports/_components/ReportGeneratorClient";

const LEARNING_CENTER_FIELDS: ReportField[] = [
  { id: "name", label: "Learner / Mentor Name", group: "Identity" },
  { id: "email", label: "Email Address", group: "Identity" },
  { id: "record_type", label: "Record Type", group: "Identity" },
  { id: "program_name", label: "Program / Hub Name", group: "Coursera LMS" },
  { id: "learning_hours", label: "Total Learning Hours", group: "Coursera LMS" },
  { id: "completed_courses", label: "Completed Courses", group: "Coursera LMS" },
  { id: "enrolled_courses", label: "Enrolled Courses", group: "Coursera LMS" },
  { id: "compliance_status", label: "License Compliance (≥20h)", group: "Coursera LMS" },
  { id: "snapshot_month", label: "Snapshot Month", group: "Coursera LMS" },
  { id: "session_title", label: "Session Title", group: "Live Sessions" },
  { id: "session_date", label: "Session Date", group: "Live Sessions" },
  { id: "mentor_name", label: "Mentor / Instructor", group: "Live Sessions" },
  { id: "audience", label: "Target Audience", group: "Live Sessions" },
  { id: "session_status", label: "Session Status", group: "Live Sessions" },
];

const LEARNING_CENTER_PRESETS: ReportPreset[] = [
  {
    id: "coursera_analytics",
    name: "Coursera Learner Analytics",
    desc: "Active learning hours, completion counts, and 20h compliance status",
    fields: ["name", "email", "learning_hours", "completed_courses", "compliance_status", "snapshot_month"],
  },
  {
    id: "session_activity",
    name: "Live Sessions & Mentors",
    desc: "Session schedules, instructor assignments, target audience, and status",
    fields: ["session_title", "session_date", "mentor_name", "audience", "session_status"],
  },
  {
    id: "course_completions",
    name: "Course Completions Roster",
    desc: "Detailed learner progress across enrolled and finished Coursera tracks",
    fields: ["name", "email", "program_name", "enrolled_courses", "completed_courses"],
  },
  {
    id: "consolidated_lms",
    name: "Consolidated LMS Report",
    desc: "Combined overview of learning hours, session attendance, and mentor logs",
    fields: ["name", "email", "record_type", "learning_hours", "session_title", "mentor_name"],
  },
];

interface LearningCenterReportsClientProps {
  reportData: Record<string, any>[];
  metricsData: any[];
  availableMonths: string[];
}

export default function LearningCenterReportsClient({
  reportData,
  metricsData,
  availableMonths,
}: LearningCenterReportsClientProps) {
  return (
    <ReportBuilderLayout
      title="Learning Center Reports Hub"
      description="Modular report builder for Coursera learning analytics, live sessions, and mentor engagement."
      icon={<BookOpen className="h-8 w-8 text-primary" />}
      availableFields={LEARNING_CENTER_FIELDS}
      presets={LEARNING_CENTER_PRESETS}
      data={reportData}
      defaultPresetId="coursera_analytics"
      exportFilenamePrefix="NGConnect_Learning_Center_Report"
      extraTabs={[
        {
          id: "coursera-executive",
          label: "Executive Analytics Generator",
          content: (
            <div className="pt-2">
              <ReportGeneratorClient metricsData={metricsData} availableMonths={availableMonths} />
            </div>
          ),
        },
      ]}
    />
  );
}
