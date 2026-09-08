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

export const CURRENT_VERSION = "1.07.15";

export const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "1.07.15",
    date: "2026-09-08",
    title: "Enrollment Date & Last Activity Date for Unmatched Learners & Verification",
    type: "patch",
    highlights: [
      "Added Enrollment Date and Last Activity Date columns to Sheet 3 (Unmatched Learners) in exported Excel reports",
      "Added Learner Name, Enrollment Date, and Last Activity Date to the interactive verification UI list on /data-management/coursera/export",
      "Automated extraction of earliest course enrollment and latest learning activity across historical snapshots"
    ],
    changes: [
      {
        category: "Features",
        description: "Added Enrollment Date and Last Activity Date columns to Sheet 3 (Unmatched Learners) in exported Coursera Excel activity reports.",
      },
      {
        category: "Improvements",
        description: "Enhanced verify-users API and export UI with live date stamps for enrolled and active accounts.",
      },
    ],
  },
  {
    version: "1.07.14",
    date: "2026-09-08",
    title: "Coursera Enterprise Live API Integration & Multi-Layer Abuse Protections",
    type: "patch",
    highlights: [
      "Integrated live Coursera Enterprise OAuth 2.0 client credentials API with automated token caching and roster lookup",
      "Implemented multi-layer abuse protections: sliding-window rate limiter, single-flight request coalescing, and circuit breaker",
      "Connected live Enterprise verification to export activity report and member dashboard status checks",
      "Added live enterprise account status badge to export page verification results"
    ],
    changes: [
      {
        category: "Features",
        description: "Implemented Coursera for Business Enterprise API client (coursera-api.ts) supporting live account verification and roster synchronization.",
      },
      {
        category: "Security",
        description: "Created high-performance sliding-window in-memory rate limiter (rate-limiter.ts) protecting verification and export endpoints from abuse and DoS.",
      },
      {
        category: "Security",
        description: "Added circuit breaker and request coalescing to Coursera API client to safeguard external API quotas and handle upstream throttling gracefully.",
      },
      {
        category: "Improvements",
        description: "Wired live Coursera enterprise roster fallback into /api/coursera/export, verify-users route, and member dashboard learning queries.",
      },
    ],
  },
  {
    version: "1.07.13",
    date: "2026-09-08",
    title: "Coursera Account Verification & Unmatched Learners Worksheet Export",
    type: "patch",
    highlights: [
      "Added dedicated Unmatched Learners worksheet to exported Excel report to flag requested users without Coursera accounts or activity",
      "Created server-side Coursera account verification endpoint (/api/coursera/export/verify-users) scanning snapshots and monthly logs",
      "Added interactive 'Check Coursera Accounts' UI widget providing instant verification statistics and expandable missing accounts preview",
      "Added 'Include Unmatched / No Coursera Account Sheet' option under Report Output Structure"
    ],
    changes: [
      {
        category: "Features",
        description: "Implemented server-side Coursera account verification API (/api/coursera/export/verify-users) and verification UI widget on export page.",
      },
      {
        category: "Features",
        description: "Added Unmatched Learners sheet to exported Excel reports detailing missing accounts, historical enrollment, and verification notes.",
      },
      {
        category: "Improvements",
        description: "Added toggle checkbox for Unmatched / No Coursera Account Sheet under Report Output Structure.",
      },
    ],
  },
  {
    version: "1.07.12",
    date: "2026-09-08",
    title: "Coursera Report Snapshot Month Formatting & Consolidated User Scoping",
    type: "patch",
    highlights: [
      "Formatted Snapshot Month column values in exported Excel reports to 'Aug 2026', 'Jul 2026' style",
      "Removed Compliance Status column from exported activity report per user requirements",
      "Consolidated 'Specific User' and 'Comma-separated List' into a single 'Specific User(s)' scope allowing single or multiple comma-separated email IDs"
    ],
    changes: [
      {
        category: "Improvements",
        description: "Formatted Snapshot Month cells in both Learner Summary and Course Breakdown sheets to clean 'MMM YYYY' format (e.g. Aug 2026).",
      },
      {
        category: "Improvements",
        description: "Removed Compliance Status column from the Learner Summary export sheet.",
      },
      {
        category: "Improvements",
        description: "Merged Specific User and Comma-separated List options in /data-management/coursera/export into a streamlined Specific User(s) selector.",
      },
    ],
  },
  {
    version: "1.07.11",
    date: "2026-09-08",
    title: "Coursera Activity Report Excel Export & Learner List Ingestion",
    type: "patch",
    highlights: [
      "Added dedicated 'Export Activity Report' portal under /data-management/coursera/export with multi-sheet Excel generation",
      "Flexible user filtering: All users, specific user email ID, comma-separated email list, or spreadsheet import (.xlsx/.csv)",
      "Server-side spreadsheet parser extracting learner emails with real-time feedback and template download",
      "Generated workbooks feature Learner Monthly Summary and granular Course Breakdown snapshots with formatted columns and headers",
      "Integrated fast access links directly into Coursera Dashboard and Activity Logs navigation"
    ],
    changes: [
      {
        category: "Features",
        description: "Implemented Coursera Activity Report export portal (/data-management/coursera/export) with month filtering and 4-tier user scoping (all, single, comma-separated, spreadsheet import).",
      },
      {
        category: "Features",
        description: "Created server-side Excel export endpoints (/api/coursera/export, /api/coursera/export/parse-list, /api/coursera/export/template) streaming styled .xlsx workbooks.",
      },
      {
        category: "Improvements",
        description: "Added direct 'Export Activity Report' navigation cards to Data Management, Coursera Dashboard, and Activity Logs.",
      },
    ],
  },
  {
    version: "1.07.10",
    date: "2026-09-08",
    title: "Coursera & Alumni Import Capacity Expansion & Phantom Row Hardening",
    type: "patch",
    highlights: [
      "Expanded Coursera export import capacity from 10,000 rows to 100,000 rows and file size limit from 5MB to 25MB",
      "Fixed false-positive 'File has too many rows' errors caused by Excel metadata / styled empty rows by switching from sheet.rowCount to sheet.actualRowCount and filtering blank rows",
      "Doubled batch upsert size to 1,000 rows and set route maxDuration to 300s to streamline high-volume database ingestion without timeouts",
      "Applied matching phantom row filtering and 50,000 row capacity to Alumni import parser"
    ],
    changes: [
      {
        category: "Fixes",
        description: "Fixed 'File has too many rows (max 10000 allowed)' error in /data-management/import-coursera by evaluating non-empty data rows rather than Excel worksheet dimension rowCount.",
      },
      {
        category: "Improvements",
        description: "Increased Coursera import limit to 100,000 rows and 25MB file size, with batch upsert chunk size increased to 1,000 rows for faster processing.",
      },
      {
        category: "Fixes",
        description: "Hardened Alumni import parser (import-parser.ts) to filter empty rows and raised capacity to 50,000 rows.",
      },
    ],
  },
  {
    version: "1.07.09",
    date: "2026-08-31",
    title: "Auth Cookie / Session Size Hardening & Profile Storage Isolation",
    type: "patch",
    highlights: [
      "Eliminated HTTP 494 REQUEST_HEADER_TOO_LARGE vulnerabilities by strictly capping auth metadata to essential identity and authorization claims",
      "Created strict Auth Metadata Contract (auth-contract.ts) and centralized guardrails (auth-guard.ts) with strict < 3KB normal budget and 4KB hard block",
      "Isolated application profile persistence: rich fields (bio, skills, campus, education, socials, theme) now strictly persist in PostgreSQL (alumni_profile table)",
      "Built Admin Auth Diagnostics Dashboard (/manage/diagnostics/auth) with real-time Cookie header size, chunk count, and metadata footprint telemetry",
      "Added edge middleware cookie header inspection to log structured diagnostics before infrastructure limits are reached",
      "Automated auth metadata migration script (migrate-auth-metadata.mjs) pruning bloated user records across Supabase Auth",
      "Added 18-point automated regression test suite (auth-hardening.test.ts) covering payload sizing, avatar safety, and resilience"
    ],
    changes: [
      {
        category: "Security",
        description: "Enforced strict Auth Metadata Contract allowing only minimal claims in user_metadata and app_metadata, preventing JWT inflation and 494 errors.",
      },
      {
        category: "Features",
        description: "Created Admin Auth Diagnostics Dashboard (/manage/diagnostics/auth) to inspect request cookie sizes, Supabase chunk counts, and JWT metadata without credential leakage.",
      },
      {
        category: "Improvements",
        description: "Separated profile persistence in ProfilePage and profile/actions.ts so rich attributes save to PostgreSQL alumni_profile instead of auth metadata.",
      },
      {
        category: "Fixes",
        description: "Hardened /auth/callback, /api/user/heartbeat, and manage/users/actions.ts against arbitrary metadata spreading.",
      },
      {
        category: "Improvements",
        description: "Added Edge middleware cookie size monitoring emitting structured warning alerts when request Cookie headers approach 3KB.",
      },
      {
        category: "Features",
        description: "Built automated data migration script (migrate-auth-metadata.mjs) and 18-point automated regression test suite.",
      },
    ],
  },
  {
    version: "1.07.08",
    date: "2026-08-31",
    title: "Auth Hardening Initial Scaffolding",
    type: "patch",
    changes: [
      {
        category: "Security",
        description: "Initial scaffolding of auth payload budgeting and metadata sanitization schemas.",
      },
    ],
  },
  {
    version: "1.07.07",
    date: "2026-08-31",
    title: "Strictly Hierarchical RBAC User Impersonation ('Log In As User')",
    type: "patch",
    highlights: [
      "Implemented strict RBAC hierarchy rules for user impersonation (Level 7 Super Admin > Level 6 Admin > Level 5-1 Lower roles)",
      "Admins can only impersonate strictly lower-level roles (Cannot impersonate Super Admins or fellow Admins)",
      "Added 'Log In As User' action in Manage Users table with secure magic link generation and 1-click execution",
      "Directly routed token_hash query parameter to /auth/callback for robust OTP verification avoiding browser URL hash truncation",
      "Added token_hash & OTP verification support in /auth/callback to resolve MissingOAuthCode error on magiclink impersonation links",
      "Resolved avatar base64 data URI bloat by introducing getSafeAvatarUrl and sanitizeUserMetadata to strictly reject non-HTTP(S) payloads",
      "Added Supabase Storage cloud bucket ('avatars') upload for user profile photos, completely preventing image byte storage in auth metadata",
      "Repaired all existing affected auth user records (Nilam, Jyoti) to clean valid Google picture URLs or null",
      "Isolated client-safe role constants in role-constants.ts to respect Server/Client Component boundaries"
    ],
    changes: [
      {
        category: "Features",
        description: "Added impersonateUser server action with strict role hierarchy checks and one-time magic link token generation.",
      },
      {
        category: "Security",
        description: "Enforced strict RBAC hierarchy: Super Admin can impersonate levels 6-1, Admin can impersonate levels 5-1 only, lower roles cannot impersonate.",
      },
      {
        category: "Fixes",
        description: "Eliminated base64 data URI storage in user_metadata, cookies, and session headers by adding getSafeAvatarUrl and Supabase Storage upload.",
      },
      {
        category: "Fixes",
        description: "Sanitized Nilam, Jyoti, and all existing user records in Supabase Auth to restore clean Google profile pictures and fix impersonation 500s.",
      },
      {
        category: "Fixes",
        description: "Updated /auth/callback to accept both OAuth code and magiclink token_hash/token parameters with verifyOtp verification.",
      },
      {
        category: "Features",
        description: "Added 'Log In As User' button in UsersTable with confirmation modal that dynamically displays only on eligible target rows.",
      },
      {
        category: "Improvements",
        description: "Created role-constants.ts to separate client-safe type definitions from server-only auth imports.",
      },
    ],
  },
  {
    version: "1.07.06",
    date: "2026-08-31",
    title: "Instantaneous Realtime Force Sign Out (Individual & Bulk)",
    type: "patch",
    highlights: [
      "Added per-user Force Sign Out button in Manage Users table with instantaneous client session termination",
      "Added bulk 'Force Sign Out All' action with confirmation modal to terminate all active sessions",
      "Integrated Realtime broadcast event channel (force_signout) so target clients immediately revoke auth and redirect to login screen",
      "Added clear session terminated alert on the login page for kicked sessions"
    ],
    changes: [
      {
        category: "Features",
        description: "Implemented forceSignOutUser and forceSignOutAllUsers server actions with real-time broadcast triggering in PresenceProvider.",
      },
      {
        category: "Features",
        description: "Added per-user Force Sign Out action buttons and top-bar 'Force Sign Out All' button in UsersTable with confirmation dialogs.",
      },
      {
        category: "Security",
        description: "Enabled immediate client-side session destruction and token invalidation on force sign out signal.",
      },
      {
        category: "Improvements",
        description: "Added dedicated SessionTerminated notification banner in LoginForm.",
      },
    ],
  },
  {
    version: "1.07.05",
    date: "2026-08-31",
    title: "Global Realtime Presence & Live Activity Tracking",
    type: "patch",
    highlights: [
      "Added global PresenceProvider using Supabase Realtime presence channel so Active Now indicator reflects actual online users across all clients",
      "Fixed UsersTable Active Now indicator to display live online status for any connected team member instead of just oneself",
      "Implemented automatic login & periodic heartbeat tracking (/api/user/heartbeat) to immediately record last_login_at and last_active_at",
      "Enhanced stats cards across Manage Users, Alumni Network, and Dashboard to include metadata activity timestamps"
    ],
    changes: [
      {
        category: "Features",
        description: "Introduced PresenceProvider and usePresence hook to broadcast and subscribe to user presence over Supabase Realtime channel.",
      },
      {
        category: "Fixes",
        description: "Fixed Manage Users table to show 'Active Now' for all active users based on live presence rather than a client-only self-check.",
      },
      {
        category: "Fixes",
        description: "Updated /auth/callback and created /api/user/heartbeat to immediately persist last_login_at and last_active_at, eliminating 'Never' timestamps for active users.",
      },
      {
        category: "Improvements",
        description: "Updated 7-day activity metrics across UsersStatsCards, DashboardStats, and AlumniNetworkStats to factor in last_active_at and last_login_at.",
      },
    ],
  },
  {
    version: "1.07.04",
    date: "2026-08-31",
    title: "OAuth Callback 500 Hardening, PKCE Isolation & Session Resiliency",
    type: "patch",
    highlights: [
      "Eliminated 500 Internal Server Error in OAuth callback with top-level error trapping and proxy header sanitization",
      "Isolated /auth routes in middleware to prevent PKCE cookie corruption during code exchange",
      "Fixed logout to properly clear Supabase auth cookies and prevent stale session persistence",
      "Restored visibility of Member-role accounts in Admin Users & Roles table with new Role filter",
      "Fixed feedback attribution to display submitter email and normalized emails across DB queries"
    ],
    changes: [
      {
        category: "Fixes",
        description: "Added top-level try-catch and sanitized multi-host x-forwarded-host parsing in /auth/callback to prevent 500 crashes during OAuth redirect.",
      },
      {
        category: "Security",
        description: "Bypassed middleware getUser session refresh on /auth routes to protect PKCE code verifier cookies during OAuth exchange.",
      },
      {
        category: "Fixes",
        description: "Implemented real supabase.auth.signOut() in NavUser and HeaderUserMenu to fully invalidate sessions on logout.",
      },
      {
        category: "Improvements",
        description: "Removed role !== 'Member' filter from Manage Users page and added dynamic Role filtering (All, Super Admin, Admin, Manager, Program, Operations, Viewer, Member) in UsersTable.",
      },
      {
        category: "Fixes",
        description: "Fixed FeedbackPage history rendering to show submitter identity instead of viewer context, and normalized email comparisons to lowercase.",
      },
    ],
  },
  {
    version: "1.07.03",
    date: "2026-08-17",
    title: "Vercel Production Build TypeScript Cast Fix",
    type: "patch",
    changes: [
      {
        category: "Fixes",
        description: "Fixed TypeScript type casting (as unknown as any[]) for readXlsxFile rows in BulkUploadDialog to resolve Vercel deployment build error.",
      },
    ],
  },
  {
    version: "1.07.02",
    date: "2026-08-17",
    title: "Dashboard Layout Variable Evaluation Fix",
    type: "patch",
    changes: [
      {
        category: "Fixes",
        description: "Fixed ReferenceError by declaring isSuperAdmin before trueRole evaluation in DashboardLayout.",
      },
    ],
  },
  {
    version: "1.07.01",
    date: "2026-08-17",
    title: "Staff Role View Mode Switcher (Staff Mode vs Member Mode)",
    type: "patch",
    highlights: [
      "Enabled all staff roles (Super Admin, Admin, Manager, Program, Operations) to switch view modes between Staff Mode and Member Mode.",
      "Added header Role View Mode button and dropdown for seamless role context switching.",
    ],
    changes: [
      {
        category: "Features",
        description: "Expanded DevRoleToggle component and site header into a universal Role View Mode Switcher for all staff roles.",
      },
      {
        category: "Features",
        description: "Updated checkRole and getUserRole in src/lib/roles.ts to allow staff members to override active view mode to Member.",
      },
    ],
  },
  {
    version: "1.07.00",
    date: "2026-08-17",
    title: "Manage Users Single Creation Modal & Bulk Spreadsheet Upload Suite",
    type: "minor",
    highlights: [
      "Launched Add User single-user creation modal with Role, Team, and Alumni status assignment.",
      "Built Bulk Upload modal supporting CSV and XLSX spreadsheet ingestion with client-side preview & validation grid.",
      "Added downloadable sample CSV template directly in the upload workflow.",
    ],
    changes: [
      {
        category: "Features",
        description: "Created AddUserDialog component and createUser server action in Manage Users (/manage/users) utilizing Supabase Auth Admin API.",
      },
      {
        category: "Features",
        description: "Built BulkUploadDialog component and bulkCreateUsers server action for batch user ingestion with duplicate detection and error logs.",
      },
      {
        category: "Improvements",
        description: "Integrated Add User and Bulk Upload action buttons into UsersTable header toolbar.",
      },
    ],
  },
  {
    version: "1.06.03",
    date: "2026-08-17",
    title: "Login Page UI Layout & Borderless Loader Refresh",
    type: "patch",
    changes: [
      {
        category: "Improvements",
        description: "Removed outer spinning rings from login page header loader and added showRing prop support to LoadingSpinner.",
      },
      {
        category: "Improvements",
        description: "Refreshed login form card layout with expanded max-width (420px), generous padding, rounded-2xl corners, and balanced element spacing.",
      },
    ],
  },
  {
    version: "1.06.02",
    date: "2026-08-16",
    title: "Universal In-App Help Registry Expansion & Manage Help Docs Update",
    type: "patch",
    highlights: [
      "Scanned all platform routes and registered 10 missing HelpEntry objects in HELP_REGISTRY.",
      "Header [i] Eye icon help trigger now available on all pages: /manage, /manage/reports, /manage/notifications, /learning-center/reports, /alumni-growth/requests, /support, /feedback, /docs, /data-management/import-coursera, and /data-management/coursera/license-audit.",
      "Updated Manage Help Docs (/manage/help) to dynamically categorize and control visibility for all newly added platform guides.",
    ],
    changes: [
      {
        category: "Features",
        description: "Registered 10 new HelpEntry definitions with formatted section text, step lists, and Mermaid process flowcharts in help-registry.ts.",
      },
      {
        category: "Features",
        description: "Updated getHelpIdForRoute to map all 10 new route paths so header [i] trigger renders contextually on every page.",
      },
      {
        category: "Improvements",
        description: "Refreshed /manage/help management controls so administrators can preview, toggle global visibility, or hide guides for Member role users across all 35+ platform pages.",
      },
    ],
  },
  {
    version: "1.06.01",
    date: "2026-08-16",
    title: "Master Administration System Report Hub & User Classification Rollup",
    type: "patch",
    highlights: [
      "Transformed Manage Reports (/manage/reports) into the Master Executive System Report Hub.",
      "Detailed classification across Users (Staff vs Members), Alumni Growth CRM, Pay-Forward, Learning Center LMS, and Data Quality Signals.",
      "Added Executive System Summary tab with metric cards for total accounts, staff/member split, Pay-Forward totals, Coursera hours, and data quality alerts.",
    ],
    changes: [
      {
        category: "Features",
        description: "Expanded Manage Reports data pipeline (getManageReportData) to query Supabase Auth users, alumni master, CRM pipelines, Coursera telemetry, and data health signals.",
      },
      {
        category: "Features",
        description: "Built Master Executive Consolidated Report preset combining User Category, Role, Team, Salary, Pay-Forward Contribution, Coursera Hours, and Data Quality.",
      },
      {
        category: "Improvements",
        description: "Added Executive System Summary tab displaying metric widgets and domain classification rollups.",
      },
    ],
  },
  {
    version: "1.06.00",
    date: "2026-08-16",
    title: "Pre-Distribution Audit Fixes & Reports Consolidation",
    type: "minor",
    highlights: [
      "Real query wiring for Alumni Growth Reports sourcing salary, pay-forward, interactions, and pipeline stages from live database tables.",
      "Database-backed rbac_permissions table migration (20260816000003_rbac_permissions_table.sql) with seeded permissions across all 7 roles.",
      "Stray script cleanup, hardcoded dev shortcut removal, and stale mock DB badge cleanup.",
      "Unified report architecture featuring Learning Center Reports (/learning-center/reports), Alumni Growth Reports (/alumni-growth/reports), and Manage Reports (/manage/reports).",
      "Extracted shared ReportBuilderLayout component supporting presets, field picker config, live table preview, search filters, and ExcelJS exports.",
    ],
    changes: [
      {
        category: "Fixes",
        description: "Replaced hardcoded sample report data in Alumni Growth reports with real SQL queries (getAlumniGrowthReportData).",
      },
      {
        category: "Security",
        description: "Created public.rbac_permissions database table and seeded default access permissions for Super Admin, Admin, Manager, Program, Operations, Viewer, and Member roles.",
      },
      {
        category: "Fixes",
        description: "Removed stray root scripts (temp_check_july.js, temp_refactor.js, temp_refactor_license.js) and unrendered ReportsClient component in engagement/reports.",
      },
      {
        category: "Fixes",
        description: "Removed nitinsudarshan@gmail.com hardcoded query shortcut in getUserCourseraData and removed stale 'Local Mock Database Active' badge from Profile Settings.",
      },
      {
        category: "Features",
        description: "Built Learning Center Reports (/learning-center/reports) absorbing Coursera executive analytics and session/mentor metrics.",
      },
      {
        category: "Features",
        description: "Built Manage Reports (/manage/reports) for cross-cutting data quality signals (contact suppression, unresponsive email, notification failures).",
      },
      {
        category: "Improvements",
        description: "Extracted shared ReportBuilderLayout component and updated sidebar navigation with three distinct report entry points.",
      },
      {
        category: "Improvements",
        description: "Created comprehensive .env.example environment variables template and reconciled README.md against ROLES.md.",
      },
    ],
  },
  {
    version: "1.05.02",
    date: "2026-08-16",
    title: "PostgREST No-Rows Error (PGRST116) 404 Handling Fix",
    type: "patch",
    changes: [
      {
        category: "Fixes",
        description: "Updated updateMemberRequestStatus in requests-store.ts to return null on PostgREST error code PGRST116 (no row matched), allowing PATCH /api/member-requests to return a clean 404 response.",
      },
    ],
  },
  {
    version: "1.05.01",
    date: "2026-08-16",
    title: "Member Requests Security Hardening & Feedback DB Persistence",
    type: "patch",
    changes: [
      {
        category: "Security",
        description: "Enforced 401 Unauthorized authentication guards on all /api/member-requests routes and session-only email identity binding on POST requests.",
      },
      {
        category: "Security",
        description: "Enforced app_metadata role check (Admin/Super Admin) on /api/member-requests PATCH handlers and updated RLS policies (20260816000001_member_requests_rls_fix.sql).",
      },
      {
        category: "Improvements",
        description: "Replaced member request ID generation with crypto.randomUUID() and removed in-memory store fallbacks.",
      },
      {
        category: "Features",
        description: "Created public.alumni_member_feedback database table (20260816000002_member_feedback.sql) with RLS policies.",
      },
      {
        category: "Features",
        description: "Wired /feedback page to real server-authenticated /api/feedback API route with server-side comments validation.",
      },
    ],
  },
  {
    version: "1.05.00",
    date: "2026-08-16",
    title: "Member Support Portal, Feedback Engine & Requests Management Suite",
    type: "minor",
    highlights: [
      "Role-restricted sidebar navigation hiding system documentation from non-admin roles.",
      "Dedicated Support Portal with helpline (9999999999), official email, and real-time IST active/offline status evaluator.",
      "Contextual Feedback Engine with session topic requests and career placement support inputs.",
      "In-app Member Request Workflow for Coursera Enterprise access and Pay-Forward engagements.",
      "Staff Member Requests Management Workspace (/alumni-growth/requests) with PageBanner layout.",
    ],
    changes: [
      {
        category: "Features",
        description: "Created Support Portal (/support) with 9999999999 helpline, alumnigrowth@navgurukul.org contact, and dynamic IST working hours active/offline status.",
      },
      {
        category: "Features",
        description: "Created Member Feedback Hub (/feedback) with 4 contextual tracks, star ratings, session topic suggestions, and anonymous submission.",
      },
      {
        category: "Features",
        description: "Launched In-App Request Workflow for Coursera Enterprise access and Pay-Forward engagements replacing legacy mailto links.",
      },
      {
        category: "Features",
        description: "Built Staff Member Requests Workspace (/alumni-growth/requests) with access granting actions and PageBanner integration.",
      },
      {
        category: "Security",
        description: "Restricted sidebar Documentation link (/docs) to Super Admin/Admin roles and enforced server/client route guards on /alumni-growth/requests.",
      },
      {
        category: "Improvements",
        description: "Added Supabase SQL migration script (20260816000000_alumni_member_requests.sql) for alumni_member_requests table and RLS policies.",
      },
    ],
  },
  {
    version: "1.04.29",
    date: "2026-08-16",
    title: "Coursera URL Direct Link & Staff Requests Route Access Guard",
    type: "patch",
    changes: [
      {
        category: "Fixes",
        description: "Updated Coursera login link in CourseraSidebarBanner to target https://www.coursera.org/ directly.",
      },
      {
        category: "Security",
        description: "Added server-side and client-side role redirect guards on /alumni-growth/requests to redirect Member and Viewer roles to homepage.",
      },
    ],
  },
  {
    version: "1.04.28",
    date: "2026-08-16",
    title: "SQL Migration Script & Typography Alignment for Member Requests",
    type: "patch",
    changes: [
      {
        category: "Features",
        description: "Created Supabase SQL migration script (20260816000000_alumni_member_requests.sql) for alumni_member_requests table with RLS policies.",
      },
      {
        category: "Improvements",
        description: "Verified typography alignment and Noto Sans / Geist font hierarchy across Member Requests, Support, and Feedback pages.",
      },
    ],
  },
  {
    version: "1.04.27",
    date: "2026-08-16",
    title: "PageBanner Integration & Compact Design for Member Requests Portal",
    type: "patch",
    changes: [
      {
        category: "Improvements",
        description: "Integrated standard PageBanner component into /alumni-growth/requests matching overall platform theme.",
      },
      {
        category: "Improvements",
        description: "Redesigned request workspace with compact metric cards, minimal padding, and standard app card styles.",
      },
    ],
  },
  {
    version: "1.04.26",
    date: "2026-08-16",
    title: "In-App Member Request Workflow & Staff Requests Portal",
    type: "minor",
    changes: [
      {
        category: "Features",
        description: "Replaced static mailto links with in-app Request Access workflows for Coursera Enterprise licenses and Pay-Forward engagements.",
      },
      {
        category: "Features",
        description: "Created Staff Member Requests Portal (/alumni-growth/requests) allowing team members to grant Coursera access and process Pay-Forward requests.",
      },
      {
        category: "Improvements",
        description: "Updated Coursera and Pay-Forward sidebar banners to support Request Sent, Approved Access (with login link), and Received reset states.",
      },
    ],
  },
  {
    version: "1.04.25",
    date: "2026-08-16",
    title: "Exact Hours/Minutes Countdown for Offline Support Helpline",
    type: "patch",
    changes: [
      {
        category: "Improvements",
        description: "Formatted offline helpline badge text to exact countdown format 'Opens in XXh YYm' or 'Opens in XX hrs'.",
      },
    ],
  },
  {
    version: "1.04.24",
    date: "2026-08-16",
    title: "Dynamic IST Working Hours Status Indicator for Support Helpline",
    type: "patch",
    changes: [
      {
        category: "Features",
        description: "Added real-time IST working hours evaluator showing active green status during Mon-Fri 10:00 AM - 5:00 PM IST and red offline status with next opening countdown outside working hours.",
      },
    ],
  },
  {
    version: "1.04.23",
    date: "2026-08-16",
    title: "Support Portal SLA Timelines, Official Email & Member Categories Alignment",
    type: "patch",
    changes: [
      {
        category: "Features",
        description: "Updated support contact email to alumnigrowth@navgurukul.org and updated helpline SLAs (48hr general, 4hr quick response).",
      },
      {
        category: "Improvements",
        description: "Populated all support channels with member-specific information and dynamic member reference ticket IDs.",
      },
    ],
  },
  {
    version: "1.04.22",
    date: "2026-08-16",
    title: "Member-Centric Feedback Category & Focus Area Refinement",
    type: "patch",
    changes: [
      {
        category: "Improvements",
        description: "Replaced internal staff terms (Alumni Growth Board, Reports Export) with member-facing features (Learning Hub, Video Player, Support Portal).",
      },
      {
        category: "Improvements",
        description: "Updated Career & Placement focus areas to Mentoring & Peer Connect and Pay-Forward Program.",
      },
    ],
  },
  {
    version: "1.04.21",
    date: "2026-08-16",
    title: "Contextual Feedback Fields for Sessions & Career Placement Tracks",
    type: "patch",
    changes: [
      {
        category: "Improvements",
        description: "Scoped 'Suggest Upcoming Session Topics or Workshops' input dynamically under Sessions & Learning feedback category.",
      },
      {
        category: "Features",
        description: "Added dedicated Career & Placement support request field for mock technical interviews, resume audits, and job referrals.",
      },
      {
        category: "Improvements",
        description: "Added focus area sub-selectors across Sessions & Learning, Career & Placement, Platform UI/UX, and General feedback tracks.",
      },
    ],
  },
  {
    version: "1.04.20",
    date: "2026-08-16",
    title: "SideNav Documentation Role Restriction & Dedicated Support/Feedback Hubs",
    type: "patch",
    changes: [
      {
        category: "Security",
        description: "Restricted sidebar Documentation link (/docs) visibility strictly to Super Admin and Admin roles.",
      },
      {
        category: "Features",
        description: "Created dedicated Support Portal (/support) featuring telephone helpline (9999999999), ticket ID tracking, SLAs, and support FAQs.",
      },
      {
        category: "Features",
        description: "Launched interactive Member Feedback Hub (/feedback) supporting general, platform UI, session topic suggestions, and anonymous submission.",
      },
    ],
  },
  {
    version: "1.04.19",
    date: "2026-08-16",
    title: ".gitignore UTF-16LE Encoding Fix & Untracked File Cleanup",
    type: "patch",
    changes: [
      {
        category: "Fixes",
        description: "Repaired UTF-16LE corruption at .gitignore tail, converting graphify-out/ and security/ entries to plain UTF-8 with CRLF line endings.",
      },
      {
        category: "Improvements",
        description: "Removed graphify-out/ build cache (107 files) and security/ audit logs (2 files) from git tracking via git rm --cached.",
      },
    ],
  },
  {
    version: "1.04.18",
    date: "2026-08-16",
    title: "Engagement Event Traceability Fixes & Changelog Governance Alignment",
    type: "patch",
    changes: [
      {
        category: "Fixes",
        description: "Fixed email_sent engagement event traceability by capturing notification_sends ID instead of queue ID.",
      },
      {
        category: "Fixes",
        description: "Removed wrong-actor profile_updated engagement event firing from staff-facing alumni PATCH route.",
      },
      {
        category: "Fixes",
        description: "Corrected inaccurate route mapping descriptions in v1.04.17 changelog entry.",
      },
      {
        category: "Improvements",
        description: "Added mandatory git diff verification requirement to versioning and changelog governance rules.",
      },
    ],
  },
  {
    version: "1.04.17",
    date: "2026-08-16",
    title: "Help System Post-Merge Audit & Section Numbering Alignment",
    type: "patch",
    changes: [
      {
        category: "Fixes",
        description: "Resolved broken route mappings for /alumni-growth/all-data and the Learning Center session feedback page.",
      },
      {
        category: "Features",
        description: "Added staffOnly section filtering in HeaderHelpTrigger for contextual member vs. staff guidance.",
      },
      {
        category: "Improvements",
        description: "Replaced duplicate numeric section prefixes in Learning Center help entries with descriptive role labels (Staff Notes / Student Guidance).",
      },
      {
        category: "Improvements",
        description: "Expanded profile settings help guide and aligned reports generator documentation with live CSV/Print exports.",
      },
      {
        category: "Fixes",
        description: "Cleaned up deprecated HelpModal and BoardHelpModal components across dashboard routes.",
      },
    ],
  },
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
