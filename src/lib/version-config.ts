/**
 * Versioning Configuration and Changelog Registry for NGConnect
 * 
 * Version Format: x.xx.xx
 *  - x   : Major release / architectural overhaul
 *  - xx  : Moderate changes / new feature additions
 *  - xx  : Counter for minor changes / bug fixes / patches
 */

export type ChangeType = "major" | "minor" | "patch";

export interface VersionChangeItem {
  category: "Features" | "Improvements" | "Fixes" | "Security";
  description: string;
}

export interface VersionEntry {
  version: string; // e.g. "1.04.15"
  date: string;    // e.g. "2026-08-15"
  title: string;
  type: ChangeType;
  highlights?: string[];
  changes: VersionChangeItem[];
}

export const CURRENT_VERSION = "1.04.16";

export const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "1.04.16",
    date: "2026-08-15",
    title: "Unified Engagement Events Ledger & SQL Triggers",
    type: "patch",
    changes: [
      {
        category: "Features",
        description: "Launched unified append-only engagement events ledger (alumni_engagement_events) with strict RLS policies.",
      },
      {
        category: "Features",
        description: "Implemented platform login engagement tracking in auth callback route for alumni accounts.",
      },
      {
        category: "Improvements",
        description: "Added SQL triggers for substantive call logging (alumni_interactions) and mentoring attendance logging (mentoring_attendance).",
      },
      {
        category: "Improvements",
        description: "Extended notification pipeline and tracking pixel to insert email_sent and deduplicated email_opened events.",
      },
      {
        category: "Improvements",
        description: "Hooked profile_updated engagement event into alumni profile update API route.",
      },
      {
        category: "Improvements",
        description: "Added mandatory versioning and changelog maintenance rule to project governance rules.",
      },
      {
        category: "Improvements",
        description: "Expanded platform version changelog modal dimensions to 90% viewport width and 90% height.",
      },
    ],
  },
  {
    version: "1.04.15",
    date: "2026-08-15",
    title: "Help Docs Hub, Mermaid Flowcharts & Contextual Member RBAC Controls",
    type: "patch",
    changes: [
      {
        category: "Features",
        description: "Added per-entry 'Hide for Members' toggle controls in Docs Hub (/manage/help).",
      },
      {
        category: "Features",
        description: "Embedded interactive Mermaid process flowcharts across all major platform help guides.",
      },
      {
        category: "Improvements",
        description: "Registered manage.help in RBAC resource matrix and contextualized member visibility switches.",
      },
      {
        category: "Fixes",
        description: "Cleaned up page-level inline eye icons and consolidated trigger into header action bar.",
      },
    ],
  },
  {
    version: "1.04.14",
    date: "2026-08-15",
    title: "Centralized Header Eye Trigger & Route Resolution",
    type: "patch",
    changes: [
      {
        category: "Features",
        description: "Implemented HeaderHelpTrigger component positioned next to theme toggle.",
      },
      {
        category: "Improvements",
        description: "Added getHelpIdForRoute matching logic supporting query parameters and tab parameters.",
      },
      {
        category: "Fixes",
        description: "Removed inline HelpModal triggers across 33+ dashboard and CRM page components.",
      },
    ],
  },
  {
    version: "1.04.10",
    date: "2026-08-14",
    title: "Granular RBAC Matrix, Audit Trail & Rollback Engine",
    type: "minor",
    changes: [
      {
        category: "Features",
        description: "Launched Role-Based Access Control (RBAC) matrix for role, team, and user-level permissions.",
      },
      {
        category: "Features",
        description: "Added RBAC audit logging with single-click snapshot rollback capability.",
      },
      {
        category: "Security",
        description: "Enforced server-side permission checks across all API route handlers and server components.",
      },
    ],
  },
  {
    version: "1.03.05",
    date: "2026-08-10",
    title: "Coursera Ingestion Engine & Telemetry Analytics",
    type: "minor",
    changes: [
      {
        category: "Features",
        description: "Integrated automated Coursera learning telemetry ingestion and learner transcripts.",
      },
      {
        category: "Improvements",
        description: "Added Coursera performance stats widgets to alumni detail profiles.",
      },
    ],
  },
  {
    version: "1.02.00",
    date: "2026-08-01",
    title: "Alumni Growth CRM Pipelines (Pay-Forward, Mentoring, Placement)",
    type: "minor",
    changes: [
      {
        category: "Features",
        description: "Created Kanban boards and list views for Pay-Forward, Mentoring, and Placement tracks.",
      },
      {
        category: "Features",
        description: "Implemented daily Workspace queue with call cool-down algorithms.",
      },
    ],
  },
  {
    version: "1.00.00",
    date: "2026-07-15",
    title: "NGConnect Core Architecture Launch",
    type: "major",
    changes: [
      {
        category: "Features",
        description: "Initial platform release built on Next.js App Router, TypeScript, and Supabase.",
      },
    ],
  },
];
