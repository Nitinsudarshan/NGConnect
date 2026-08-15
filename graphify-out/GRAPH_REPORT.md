# Graph Report - NGConnect  (2026-08-14)

## Corpus Check
- 281 files · ~177,417 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1502 nodes · 4275 edges · 118 communities (78 shown, 40 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c3a59b1d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- button.tsx
- learning-center/queries.ts
- sidebar.tsx
- dependencies
- devDependencies
- sheet.tsx
- LogInteractionModal.tsx
- createClient
- compilerOptions
- dropdown-menu.tsx
- react
- Coursera Dashboard — Complete Build Instructions
- settings-client.tsx
- NGConnect Web Application Documentation (Comprehensive)
- import.ts
- (dashboard)/layout.tsx
- roles.ts
- components.json
- alumni.ts
- alumni-growth/settings/SettingsClient.tsx
- cn
- engagement/queries.ts
- Greetings Banner Component
- chart.tsx
- app/layout.tsx
- useUserContext
- AGENTS.md
- Created Tables Log
- Charts, Graphs, and Data Visualizations
- reminders/route.ts
- rollback.ts
- NGConnect AI Agent Guidelines
- Code Standards
- supabase/middleware.ts
- Global Rules
- Role-Based Access Control (RBAC) Settings
- icon.tsx
- temp_check_july.js
- temp_refactor.js
- engagement/actions.ts
- zoom.ts
- NGConnect Roles and User Categories
- temp_refactor_license.js
- 20260812191502_alumni_growth_full_schema.sql
- High
- engagement/alumni/[id]/page.tsx
- Input.tsx
- Critical Severity
- users-table.tsx
- getSupabaseUserEmail
- update-licenses.ts
- next.config.ts
- postcss.config.mjs
- globals.d.ts
- NGConnect
- UI Component Rules
- api-conventions.md
- component-architecture.md
- data-access.md
- data-import.md
- documentation.md
- rbac-grid.tsx
- project-structure.md
- responsive-design.md
- security.md
- server-client-boundary.md
- 20260812191509_supabase_schema.sql
- rules/graphify.md
- workflows/graphify.md
- gitlog.md
- alumni-growth/follow-ups/FollowUpsClient.tsx
- 20260812191501_alumni_engagement_crm_schema.sql
- 20260812191505_learning_center_schema_part2.sql
- 20260812191507_pipeline_stages_upgrade.sql
- package.json
- components/page.tsx
- 20260812191504_learning_center_schema.sql
- import-coursera/page.tsx
- Add User Autocomplete to RBAC Grid
- session-playback-modal.tsx
- 20260813000001_channel_specific_outcomes.sql
- FollowupDateSelector.tsx
- import/route.ts
- session-media-modal.tsx
- template/route.ts
- public.pipeline_poc_eligibility
- forms-and-validation.md
- public.learning_sessions
- performance.md
- pipeline_stages
- public.user_integrations
- clsx
- @dnd-kit/core
- @dnd-kit/sortable
- isomorphic-dompurify
- lucide-react
- next
- nodemailer
- radix-ui
- react-hook-form
- read-excel-file
- @supabase/supabase-js
- tailwind-merge
- public.interaction_outcomes
- alumni_pipeline_membership
- alumni_pipeline_membership

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 161 edges
2. `cn()` - 145 edges
3. `createAdminClient()` - 67 edges
4. `Button()` - 65 edges
5. `getUserRole()` - 57 edges
6. `Badge()` - 51 edges
7. `Card()` - 51 edges
8. `CardContent()` - 47 edges
9. `CardHeader()` - 40 edges
10. `CardTitle()` - 40 edges

## Surprising Connections (you probably didn't know these)
- `SettingsClient()` --references--> `react`  [EXTRACTED]
  src/app/(dashboard)/learning-center/settings/settings-client.tsx → package.json
- `LogInteractionModal()` --references--> `react`  [EXTRACTED]
  src/components/engagement/LogInteractionModal.tsx → package.json
- `NavItem` --references--> `react`  [EXTRACTED]
  src/components/nav-main.tsx → package.json
- `EditLogTab()` --references--> `react`  [EXTRACTED]
  src/components/settings/edit-log-tab.tsx → package.json
- `ChartTooltipContent()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json

## Import Cycles
- None detected.

## Communities (118 total, 40 thin omitted)

### Community 0 - "button.tsx"
Cohesion: 0.05
Nodes (105): AlumniDetailClient(), DEFAULT_STAGES, MentoringClient(), MentoringClientProps, MentoringColumn(), DEFAULT_STAGES, PayForwardClient(), PayForwardClientProps (+97 more)

### Community 1 - "learning-center/queries.ts"
Cohesion: 0.09
Nodes (43): GET(), LearningCenterDashboardClient(), LearningCenterDashboard(), metadata, metadata, RecordingsPage(), RecordingsClient(), CreateSessionClient() (+35 more)

### Community 2 - "sidebar.tsx"
Cohesion: 0.12
Nodes (31): AppSidebar(), data, CourseraSidebarBanner(), NavItem, NavSecondary(), NavUser(), PayForwardSidebarBanner(), Sidebar() (+23 more)

### Community 3 - "dependencies"
Cohesion: 0.10
Nodes (21): class-variance-authority, @dnd-kit/utilities, exceljs, @hookform/resolvers, next-themes, dependencies, class-variance-authority, @dnd-kit/utilities (+13 more)

### Community 4 - "devDependencies"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, shadcn, tailwindcss, @tailwindcss/postcss (+17 more)

### Community 5 - "sheet.tsx"
Cohesion: 0.18
Nodes (8): Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle(), SheetTrigger()

### Community 6 - "LogInteractionModal.tsx"
Cohesion: 0.19
Nodes (14): BoardHelpModalProps, EditSessionModal(), EditSessionModalProps, ConfirmDeleteDialogProps, Dialog(), DialogContent(), DialogDescription(), DialogFooter() (+6 more)

### Community 7 - "createClient"
Cohesion: 0.08
Nodes (41): GET(), MAPPING_FILE_PATH, POST(), POST(), GET(), GET(), GET(), GET() (+33 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 9 - "dropdown-menu.tsx"
Cohesion: 0.14
Nodes (21): ROLES, HeaderUserMenu(), toTitleCase(), Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount() (+13 more)

### Community 10 - "react"
Cohesion: 0.22
Nodes (8): react, react, NavMain(), ChartContainer(), SidebarMenuSkeleton(), SidebarProvider(), Slider(), useIsMobile()

### Community 11 - "Coursera Dashboard — Complete Build Instructions"
Cohesion: 0.06
Nodes (30): Architecture Overview, Complete Algorithm (implement exactly in this order), Coursera Dashboard — Complete Build Instructions, Dashboard layout, `GET /api/coursera/learner/[email]`, `GET /api/coursera/metrics/available-months`, `GET /api/coursera/metrics?month=2026-03-01`, `GET /api/coursera/metrics/trend?months=6` (+22 more)

### Community 12 - "settings-client.tsx"
Cohesion: 0.08
Nodes (49): SettingsClient(), MentorForm(), MentorFormProps, buildEmbedUrl(), detectEmbed(), formatTime(), VideoPlayer(), VideoPlayerProps (+41 more)

### Community 13 - "NGConnect Web Application Documentation (Comprehensive)"
Cohesion: 0.10
Nodes (20): 1. Overview, 2.1 Framework & Core Libraries, 2.2 Styling & UI Components, 2.3 Backend & Infrastructure, 2. Technology Stack & Core Tooling, 3.1 Routing & Middleware, 3.2 Utilities & State Management, 3. Application Architecture (+12 more)

### Community 14 - "import.ts"
Cohesion: 0.13
Nodes (21): GET(), Params, PATCH(), POST(), POST(), defaultColumnMap, parseImportFile(), processImportRows() (+13 more)

### Community 15 - "(dashboard)/layout.tsx"
Cohesion: 0.32
Nodes (6): SiteHeader(), SidebarInset(), BreadcrumbContext, BreadcrumbContextType, BreadcrumbProvider(), useBreadcrumb()

### Community 16 - "roles.ts"
Cohesion: 0.14
Nodes (26): DataManagementLayout(), COURSERA_CATEGORY, DATA_MANAGEMENT_CATEGORIES, DataManagementPage(), ManageAlumniNetworkLayout(), ManageMasterDataLayout(), SUPER_ADMINS, ManageUsersLayout() (+18 more)

### Community 17 - "components.json"
Cohesion: 0.10
Nodes (19): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+11 more)

### Community 18 - "alumni.ts"
Cohesion: 0.24
Nodes (10): overridable, AlumniMaster, AlumniProfile, AlumniStatus, CareerEntry, CourseraActivity, CourseraConfig, MergedProfile (+2 more)

### Community 19 - "alumni-growth/settings/SettingsClient.tsx"
Cohesion: 0.06
Nodes (49): AlumniDetailClientProps, FollowUpsClientProps, NAV_ITEMS, OUTCOME_MAPPING_ROWS, SettingsClientProps, WorkspaceClientProps, AlumniDetailClientProps, QueueClientProps (+41 more)

### Community 20 - "cn"
Cohesion: 0.09
Nodes (32): ModeToggle(), HeaderUserMenu, Breadcrumb(), BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList(), BreadcrumbPage() (+24 more)

### Community 21 - "engagement/queries.ts"
Cohesion: 0.13
Nodes (33): AlumniDetailPage(), PageProps, FollowUpsPage(), ReportsPage(), ReportsClient(), metadata, SettingsPage(), WorkspacePage() (+25 more)

### Community 22 - "Greetings Banner Component"
Cohesion: 0.18
Nodes (10): 1. Component Location & Overview, 2. Component Design & Aesthetics, 3. Content Structure, 4.1. Hydration & Safe Mounting, 4.2. User Personalization, 4.3. Time & Date Logic, 4.4. Safe Access & Fallbacks, 4. Operational Rules & Logic (+2 more)

### Community 23 - "chart.tsx"
Cohesion: 0.06
Nodes (42): chartConfig, CourseraDashboardClient(), delta(), fmt(), formatMonth(), formatMonthShort(), getDistColorVar(), KpiCard() (+34 more)

### Community 24 - "app/layout.tsx"
Cohesion: 0.23
Nodes (6): geistMono, geistSans, metadata, LoginForm(), ThemeProvider(), Toaster()

### Community 25 - "useUserContext"
Cohesion: 0.19
Nodes (12): GreetingsPreviewPage(), MasterDataPage(), dailyVariantIndex(), DashboardGreeting(), DevRoleToggle(), GreetingEntry, hourlyGreetings, ICONS (+4 more)

### Community 26 - "AGENTS.md"
Cohesion: 0.20
Nodes (6): Accessibility Rules, Rules, Design System Rules, Rules, Rules, Testing Rules

### Community 27 - "Created Tables Log"
Cohesion: 0.20
Nodes (9): 1. `ng_campuses`, 2. `highest_education`, 3. `ng_courses`, 4. `import_batches`, 5. `alumni_master`, 6. `alumni_profile`, 7. `import_batch_records`, 8. `audit_log` (+1 more)

### Community 28 - "Charts, Graphs, and Data Visualizations"
Cohesion: 0.20
Nodes (9): 1 Color (`--color-chart-primary` only), 2 Colors (`--color-chart-primary` + `--color-chart-accent-1`), 3 Colors (`--color-chart-primary` + `--color-chart-accent-1` + `--color-chart-accent-2`), 4+ Colors, Charts, Graphs, and Data Visualizations, Color Tokens, Hard Rules, How Many Colors to Use (+1 more)

### Community 29 - "reminders/route.ts"
Cohesion: 0.40
Nodes (4): GET(), sendEmail(), SendEmailOptions, transporter

### Community 30 - "rollback.ts"
Cohesion: 0.36
Nodes (6): POST(), POST(), AdminUser, rollbackImportBatch(), rollbackRecord(), RollbackTable

### Community 31 - "NGConnect AI Agent Guidelines"
Cohesion: 0.33
Nodes (6): Knowledge Graph, Known Drift, NGConnect AI Agent Guidelines, Precedence, Rule Index, Safety Requirements

### Community 32 - "Code Standards"
Cohesion: 0.40
Nodes (4): Code Standards, Imports, Naming conventions, Rules

### Community 33 - "supabase/middleware.ts"
Cohesion: 0.38
Nodes (5): IMPORTANT: Avoid writing any logic between createServerClient and, IMPORTANT: You *must* return the supabaseResponse object as it is. If you're, updateSession(), config, middleware()

### Community 34 - "Global Rules"
Cohesion: 0.40
Nodes (4): Global Rules, Precedence, Rule files, Scope

### Community 35 - "Role-Based Access Control (RBAC) Settings"
Cohesion: 0.33
Nodes (5): CRITICAL RULE: Registering New Features, Database Schema, Hierarchy & Precedence, How the Engine Works, Role-Based Access Control (RBAC) Settings

### Community 36 - "icon.tsx"
Cohesion: 0.33
Nodes (4): alt, contentType, runtime, size

### Community 37 - "temp_check_july.js"
Cohesion: 0.33
Nodes (4): { createClient }, dotenv, path, supabase

### Community 38 - "temp_refactor.js"
Cohesion: 0.33
Nodes (5): content, fs, path, startIdx1, startIdx2

### Community 39 - "engagement/actions.ts"
Cohesion: 0.13
Nodes (27): SettingsClient(), ActivityLogsPage(), formatMonth(), SearchParams, LearnerDetailPage(), PageProps, CourseraDashboardPage(), SearchParams (+19 more)

### Community 40 - "zoom.ts"
Cohesion: 0.60
Nodes (4): createZoomMeeting(), getZoomAccessToken(), testZoomConnection(), ZoomMeetingOptions

### Community 41 - "NGConnect Roles and User Categories"
Cohesion: 0.50
Nodes (3): 1. Authentication Roles (`UserRole`), 2. Teams (`UserTeam`), NGConnect Roles and User Categories

### Community 42 - "temp_refactor_license.js"
Cohesion: 0.50
Nodes (3): content, fs, returnStart

### Community 43 - "20260812191502_alumni_growth_full_schema.sql"
Cohesion: 0.10
Nodes (31): public.fn_set_updated_at, public.alumni_interactions, public.alumni_master, public.alumni_pipeline_membership, public.alumni_profile, public.alumni_salary_records, public.audit_log, public.contribution_types (+23 more)

### Community 44 - "High"
Cohesion: 0.06
Nodes (33): C1: `src/lib/auth.ts`, C2: `src/lib/roles.ts` / `dev-role-toggle.tsx`, C3: `src/app/api/coursera/*` routes, C4: Google OAuth callback IDOR, C5: Pay-forward cap, Critical, H1: `alumni/[email]` GET IDOR, H2: Middleware unauthenticated redirect (+25 more)

### Community 47 - "Critical Severity"
Cohesion: 0.07
Nodes (29): C1: `src/lib/auth.ts` Stub, C2: Dev Role Toggle (`src/lib/roles.ts` & `dev-role-toggle.tsx`), C3: `src/app/api/coursera/*` Routes IDOR, C4: Google OAuth Callback IDOR, C5: Pay-forward Cap Logic, C7, C8, C9: Database Schema Drift & RLS, Critical Severity, H1: `alumni/[email]` GET IDOR (+21 more)

### Community 48 - "users-table.tsx"
Cohesion: 0.27
Nodes (14): MentorDetailsPage(), formatRelativeTime(), UsersTableProps, MentorEditButton(), Table(), TableBody(), TableCaption(), TableCell() (+6 more)

### Community 49 - "getSupabaseUserEmail"
Cohesion: 0.26
Nodes (13): GranularPermissionInput, RolePermissionData, rollbackGranularRbac(), saveGranularRbacChanges(), saveRbacChanges(), MentoringPage(), PayForwardPage(), PlacementPage() (+5 more)

### Community 63 - "NGConnect"
Cohesion: 0.20
Nodes (9): 🏗 Architecture & Code Standards, 🗄️ Database Schema, 📦 Getting Started, Installation, 🚀 Key Features, 📄 License, NGConnect, Prerequisites (+1 more)

### Community 64 - "UI Component Rules"
Cohesion: 0.50
Nodes (3): Known drift to clean up, Rules, UI Component Rules

### Community 70 - "rbac-grid.tsx"
Cohesion: 0.15
Nodes (17): FollowUpsClient(), QueueClient(), AVAILABLE_FIELDS, PRESETS, ReportsClientProps, RbacGrid(), RESOURCES_BY_CLUSTER, ROLES (+9 more)

### Community 75 - "20260812191509_supabase_schema.sql"
Cohesion: 0.18
Nodes (6): public.alumni_master, public.highest_education, public.import_batches, public.ng_campuses, public.ng_courses, auth.users

### Community 79 - "alumni-growth/follow-ups/FollowUpsClient.tsx"
Cohesion: 0.24
Nodes (9): CalendarStrip(), CATEGORY_STYLES, classifyFollowup(), FollowUpCard(), FollowUpCategory, FollowUpsClient(), startOf(), LogInteractionModal() (+1 more)

### Community 80 - "20260812191501_alumni_engagement_crm_schema.sql"
Cohesion: 0.19
Nodes (20): public.alumni_profile, public.alumni_interactions, public.alumni_pipeline_membership, public.alumni_salary_records, public.contribution_types, public.enforce_followup_datetime(), public.interaction_outcomes, public.interaction_support_areas (+12 more)

### Community 81 - "20260812191505_learning_center_schema_part2.sql"
Cohesion: 0.19
Nodes (14): feedback_responses, mentors, sessions, course_items, course_progress, courses, learning_center_audit_logs, mentor_stats (+6 more)

### Community 82 - "20260812191507_pipeline_stages_upgrade.sql"
Cohesion: 0.21
Nodes (11): alumni_interactions, alumni_master, org_settings, alumni_contact_suppression, apply_do_not_contact(), pipeline_stages, reevaluate_pay_forward_eligibility(), interaction_outcomes (+3 more)

### Community 83 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 84 - "components/page.tsx"
Cohesion: 0.33
Nodes (6): MOCK_TEXT, SCROLLBAR_OPTIONS, Accordion(), AccordionContent(), AccordionItem(), AccordionTrigger()

### Community 85 - "20260812191504_learning_center_schema.sql"
Cohesion: 0.47
Nodes (8): public.learning_audiences, public.learning_course_progress, public.learning_courses, public.learning_session_types, public.learning_sessions, public.mentors, public.user_integrations, auth.users

### Community 86 - "import-coursera/page.tsx"
Cohesion: 0.33
Nodes (8): AvailableMonth, formatDuration(), formatMonth(), formatRows(), generateAvailableMonthOptions(), ImportCourseraPage(), ImportLogRow, UploadResult

### Community 87 - "Add User Autocomplete to RBAC Grid"
Cohesion: 0.25
Nodes (7): 1. New Server Action, 2. Update RBAC Grid UI, Add User Autocomplete to RBAC Grid, [MODIFY] [rbac-grid.tsx](file:///D:/Projects/NGConnect/src/app/(dashboard)/manage/rbac/_components/rbac-grid.tsx), [NEW] [users.ts](file:///D:/Projects/NGConnect/src/app/actions/users.ts), Proposed Changes, Verification Plan

### Community 88 - "session-playback-modal.tsx"
Cohesion: 0.24
Nodes (11): PastSessionCard(), PastSessionCardProps, AVATAR_COLORS, ChatEntry, parseVtt(), parseZoomChat(), SessionPlaybackModal(), SessionPlaybackModalProps (+3 more)

### Community 89 - "20260813000001_channel_specific_outcomes.sql"
Cohesion: 0.25
Nodes (7): public.alumni_interactions, public.apply_do_not_contact, public.alumni_contact_suppression, public.apply_do_not_contact(), interaction_outcomes, public.alumni_master, trg_apply_do_not_contact

### Community 90 - "FollowupDateSelector.tsx"
Cohesion: 0.43
Nodes (7): addDays(), FollowupDateSelector(), FollowupDateSelectorProps, formatDateTimeLocal(), isSunday(), isValid(), setTime()

### Community 91 - "import/route.ts"
Cohesion: 0.60
Nodes (5): fetchAllSupabase(), firstDayOfMonth(), parseDate(), POST(), upsertInBatches()

### Community 92 - "session-media-modal.tsx"
Cohesion: 0.53
Nodes (5): isDriveUrl(), normalizeDriveUrl(), SessionMediaModal(), SessionMediaModalProps, updateSessionMedia()

## Knowledge Gaps
- **421 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+416 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `clsx`, `@dnd-kit/core`, `@dnd-kit/sortable`, `isomorphic-dompurify`, `lucide-react`, `next`, `nodemailer`, `radix-ui`, `react`, `react-hook-form`, `read-excel-file`, `@supabase/supabase-js`, `tailwind-merge`, `package.json`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `sidebar.tsx`, `dependencies`, `settings-client.tsx`, `alumni-growth/follow-ups/FollowUpsClient.tsx`, `alumni-growth/settings/SettingsClient.tsx`, `chart.tsx`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `button.tsx`, `learning-center/queries.ts`, `rbac-grid.tsx`, `engagement/actions.ts`, `settings-client.tsx`, `import.ts`, `(dashboard)/layout.tsx`, `roles.ts`, `getSupabaseUserEmail`, `users-table.tsx`, `engagement/queries.ts`, `import/route.ts`, `session-media-modal.tsx`, `reminders/route.ts`, `rollback.ts`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _421 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `button.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05039804827940421 - nodes in this community are weakly interconnected._
- **Should `learning-center/queries.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09019607843137255 - nodes in this community are weakly interconnected._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11522048364153627 - nodes in this community are weakly interconnected._