# Graph Report - NGConnect  (2026-08-09)

## Corpus Check
- 265 files · ~140,830 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1282 nodes · 3507 edges · 97 communities (67 shown, 30 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `16bf347e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- WorkspaceClient.tsx
- learning-center/queries.ts
- sidebar.tsx
- dependencies
- devDependencies
- components/page.tsx
- users-table.tsx
- createAdminClient
- compilerOptions
- dropdown-menu.tsx
- card.tsx
- Coursera Dashboard — Complete Build Instructions
- mentor-form.tsx
- NGConnect Web Application Documentation (Comprehensive)
- import.ts
- site-header.tsx
- getUserRole
- components.json
- alumni.ts
- alumni-growth/settings/SettingsClient.tsx
- cn
- createClient
- Greetings Banner Component
- chart.tsx
- login-form.tsx
- (dashboard)/page.tsx
- AGENTS.md
- Created Tables Log
- Charts, Graphs, and Data Visualizations
- server.ts
- rollback.ts
- NGConnect AI Agent Guidelines
- Code Standards
- supabase/middleware.ts
- Global Rules
- Role-Based Access Control (RBAC) Settings
- icon.tsx
- temp_check_july.js
- temp_refactor.js
- lib/utils.ts
- zoom.ts
- NGConnect Roles and User Categories
- temp_refactor_license.js
- check-data.ts
- check-db.ts
- engagement/alumni/[id]/page.tsx
- Input.tsx
- check_db.ts
- temp_update.ts
- test-rls.ts
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
- alumni-growth/alumni/[id]/AlumniDetailClient.tsx
- project-structure.md
- responsive-design.md
- security.md
- server-client-boundary.md
- testing.md
- rules/graphify.md
- workflows/graphify.md
- gitlog.md
- badge.tsx
- alumni_engagement_crm_schema.sql
- learning_center_schema_part2.sql
- pipeline_stages_upgrade.sql
- supabase_schema.sql
- button.tsx
- learning_center_schema.sql
- import-coursera/page.tsx
- alumni/[email]/route.ts
- recordings-client.tsx
- settings-layout.tsx
- pipeline_stages
- accessibility.md
- public.user_integrations
- alumni_pipeline_membership
- alumni_pipeline_membership
- public.learning_sessions

## God Nodes (most connected - your core abstractions)
1. `cn()` - 144 edges
2. `createClient()` - 120 edges
3. `Button()` - 58 edges
4. `createAdminClient()` - 54 edges
5. `Card()` - 51 edges
6. `getUserRole()` - 51 edges
7. `CardContent()` - 48 edges
8. `Badge()` - 46 edges
9. `CardHeader()` - 41 edges
10. `CardTitle()` - 41 edges

## Surprising Connections (you probably didn't know these)
- `SettingsClient()` --references--> `react`  [EXTRACTED]
  src/app/(dashboard)/learning-center/settings/settings-client.tsx → package.json
- `ChartContainer()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json
- `ChartTooltipContent()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json
- `useChart()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json
- `FormItem()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json

## Import Cycles
- None detected.

## Communities (97 total, 30 thin omitted)

### Community 0 - "WorkspaceClient.tsx"
Cohesion: 0.12
Nodes (31): FollowUpsClientProps, AVAILABLE_FIELDS, PRESETS, ReportsClientProps, AuditLogsPage(), DUMMY_AUDIT_LOGS, DUMMY_EMAILS, DUMMY_TIMELINE_MAP (+23 more)

### Community 1 - "learning-center/queries.ts"
Cohesion: 0.13
Nodes (33): GET(), LearningCenterDashboardClient(), LearningCenterDashboard(), metadata, CreateSessionPage(), metadata, metadata, SessionsPage() (+25 more)

### Community 2 - "sidebar.tsx"
Cohesion: 0.11
Nodes (35): react, react, AppSidebar(), data, CourseraSidebarBanner(), NavItem, NavMain(), NavSecondary() (+27 more)

### Community 3 - "dependencies"
Cohesion: 0.05
Nodes (45): class-variance-authority, clsx, @hookform/resolvers, lucide-react, next, next-themes, nodemailer, dependencies (+37 more)

### Community 4 - "devDependencies"
Cohesion: 0.05
Nodes (37): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, pg, shadcn, tailwindcss (+29 more)

### Community 5 - "components/page.tsx"
Cohesion: 0.09
Nodes (22): MOCK_TEXT, SCROLLBAR_OPTIONS, Accordion(), AccordionContent(), AccordionItem(), AccordionTrigger(), Collapsible(), CollapsibleContent() (+14 more)

### Community 6 - "users-table.tsx"
Cohesion: 0.08
Nodes (49): MentorDetailsPage(), UsersTableProps, EditSessionModalProps, PastSessionCardProps, isDriveUrl(), normalizeDriveUrl(), SessionMediaModal(), SessionMediaModalProps (+41 more)

### Community 7 - "createAdminClient"
Cohesion: 0.11
Nodes (22): POST(), GET(), GET(), GET(), GET(), fetchAllSupabase(), firstDayOfMonth(), POST() (+14 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 9 - "dropdown-menu.tsx"
Cohesion: 0.23
Nodes (13): ROLES, HeaderUserMenu(), toTitleCase(), Avatar(), AvatarFallback(), AvatarImage(), DropdownMenu(), DropdownMenuContent() (+5 more)

### Community 10 - "card.tsx"
Cohesion: 0.12
Nodes (26): DUMMY_BATCHES, COURSERA_CATEGORY, DATA_MANAGEMENT_CATEGORIES, FollowUpsClientProps, AlumniNetworkStatsProps, AuditLog, UsersStatsProps, chartConfig (+18 more)

### Community 11 - "Coursera Dashboard — Complete Build Instructions"
Cohesion: 0.06
Nodes (30): Architecture Overview, Complete Algorithm (implement exactly in this order), Coursera Dashboard — Complete Build Instructions, Dashboard layout, `GET /api/coursera/learner/[email]`, `GET /api/coursera/metrics/available-months`, `GET /api/coursera/metrics?month=2026-03-01`, `GET /api/coursera/metrics/trend?months=6` (+22 more)

### Community 12 - "mentor-form.tsx"
Cohesion: 0.13
Nodes (20): MentorFormProps, FormControl(), FormDescription(), FormField(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext (+12 more)

### Community 13 - "NGConnect Web Application Documentation (Comprehensive)"
Cohesion: 0.10
Nodes (20): 1. Overview, 2.1 Framework & Core Libraries, 2.2 Styling & UI Components, 2.3 Backend & Infrastructure, 2. Technology Stack & Core Tooling, 3.1 Routing & Middleware, 3.2 Utilities & State Management, 3. Application Architecture (+12 more)

### Community 14 - "import.ts"
Cohesion: 0.19
Nodes (16): POST(), POST(), defaultColumnMap, parseImportFile(), processImportRows(), VALID_STATUSES, validateImportRow(), validateImportRows() (+8 more)

### Community 15 - "site-header.tsx"
Cohesion: 0.15
Nodes (16): DashboardLayout(), ModeToggle(), HeaderUserMenu, SiteHeader(), Breadcrumb(), BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink() (+8 more)

### Community 16 - "getUserRole"
Cohesion: 0.05
Nodes (66): RolePermissionData, rollbackRbac(), saveRbacChanges(), AlumniDetailPage(), PageProps, FollowUpsPage(), MentoringClient(), MentoringPage() (+58 more)

### Community 17 - "components.json"
Cohesion: 0.10
Nodes (19): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+11 more)

### Community 18 - "alumni.ts"
Cohesion: 0.24
Nodes (10): overridable, AlumniMaster, AlumniProfile, AlumniStatus, CareerEntry, CourseraActivity, CourseraConfig, MergedProfile (+2 more)

### Community 19 - "alumni-growth/settings/SettingsClient.tsx"
Cohesion: 0.13
Nodes (24): AlumniDetailClientProps, NAV_ITEMS, SettingsClientProps, WorkspaceClientProps, AlumniDetailClientProps, QueueClientProps, SettingsClientProps, LogInteractionModalProps (+16 more)

### Community 20 - "cn"
Cohesion: 0.09
Nodes (30): AvatarBadge(), AvatarGroup(), AvatarGroupCount(), CardAction(), DropdownMenuCheckboxItem(), DropdownMenuRadioItem(), DropdownMenuShortcut(), DropdownMenuSubContent() (+22 more)

### Community 21 - "createClient"
Cohesion: 0.22
Nodes (26): CreateSessionClient(), SettingsClient(), EditSessionModal(), createGoogleMeetLink(), archiveMentorAction(), createMentor(), createSessionAction(), deleteAudienceAction() (+18 more)

### Community 22 - "Greetings Banner Component"
Cohesion: 0.18
Nodes (10): 1. Component Location & Overview, 2. Component Design & Aesthetics, 3. Content Structure, 4.1. Hydration & Safe Mounting, 4.2. User Personalization, 4.3. Time & Date Logic, 4.4. Safe Access & Fallbacks, 4. Operational Rules & Logic (+2 more)

### Community 23 - "chart.tsx"
Cohesion: 0.06
Nodes (37): chartConfig, CourseraDashboardClient(), delta(), fmt(), formatMonth(), formatMonthShort(), getDistColorVar(), KpiCard() (+29 more)

### Community 24 - "login-form.tsx"
Cohesion: 0.13
Nodes (9): geistMono, geistSans, metadata, LoadingSpinner(), LoadingView(), LoginForm(), MiniLoader(), ThemeProvider() (+1 more)

### Community 25 - "(dashboard)/page.tsx"
Cohesion: 0.11
Nodes (19): GreetingsPreviewPage(), DashboardPage(), CourseraCharts(), CourseraMetrics, CourseraStats(), CourseraStatsProps, DashboardCharts(), getColorVar() (+11 more)

### Community 26 - "AGENTS.md"
Cohesion: 0.20
Nodes (6): Design System Rules, Rules, Forms & Validation, Rules, Performance Rules, Rules

### Community 27 - "Created Tables Log"
Cohesion: 0.20
Nodes (9): 1. `ng_campuses`, 2. `highest_education`, 3. `ng_courses`, 4. `import_batches`, 5. `alumni_master`, 6. `alumni_profile`, 7. `import_batch_records`, 8. `audit_log` (+1 more)

### Community 28 - "Charts, Graphs, and Data Visualizations"
Cohesion: 0.20
Nodes (9): 1 Color (`--color-chart-primary` only), 2 Colors (`--color-chart-primary` + `--color-chart-accent-1`), 3 Colors (`--color-chart-primary` + `--color-chart-accent-1` + `--color-chart-accent-2`), 4+ Colors, Charts, Graphs, and Data Visualizations, Color Tokens, Hard Rules, How Many Colors to Use (+1 more)

### Community 29 - "server.ts"
Cohesion: 0.14
Nodes (9): GET(), MAPPING_FILE_PATH, POST(), GET(), GET(), GET(), sendEmail(), SendEmailOptions (+1 more)

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
Cohesion: 0.40
Nodes (4): Adding a new feature/cluster, Database Schema / SQL Editor, How it works, Role-Based Access Control (RBAC) Settings

### Community 36 - "icon.tsx"
Cohesion: 0.33
Nodes (4): alt, contentType, runtime, size

### Community 37 - "temp_check_july.js"
Cohesion: 0.33
Nodes (4): { createClient }, dotenv, path, supabase

### Community 38 - "temp_refactor.js"
Cohesion: 0.33
Nodes (5): content, fs, path, startIdx1, startIdx2

### Community 39 - "lib/utils.ts"
Cohesion: 0.18
Nodes (19): DEFAULT_STAGES, MentoringClientProps, MentoringColumn(), DEFAULT_STAGES, PayForwardClientProps, PayForwardColumn(), DEFAULT_STAGES, PlacementClientProps (+11 more)

### Community 40 - "zoom.ts"
Cohesion: 0.60
Nodes (4): createZoomMeeting(), getZoomAccessToken(), testZoomConnection(), ZoomMeetingOptions

### Community 41 - "NGConnect Roles and User Categories"
Cohesion: 0.50
Nodes (3): 1. Authentication Roles (`UserRole`), 2. Teams (`UserTeam`), NGConnect Roles and User Categories

### Community 42 - "temp_refactor_license.js"
Cohesion: 0.50
Nodes (3): content, fs, returnStart

### Community 63 - "NGConnect"
Cohesion: 0.50
Nodes (3): Getting Started, License, NGConnect

### Community 64 - "UI Component Rules"
Cohesion: 0.50
Nodes (3): Known drift to clean up, Rules, UI Component Rules

### Community 70 - "alumni-growth/alumni/[id]/AlumniDetailClient.tsx"
Cohesion: 0.16
Nodes (19): AlumniDetailClient(), FollowUpsClient(), WorkspaceClient(), FollowUpsClient(), QueueClient(), AVAILABLE_FIELDS, PRESETS, ReportsClientProps (+11 more)

### Community 79 - "badge.tsx"
Cohesion: 0.14
Nodes (15): MentoringClient(), MentoringClientProps, STAGES, PayForwardClient(), PayForwardClientProps, STAGES, PlacementClient(), PlacementClientProps (+7 more)

### Community 80 - "alumni_engagement_crm_schema.sql"
Cohesion: 0.19
Nodes (20): public.alumni_interactions, public.alumni_pipeline_membership, public.alumni_salary_records, public.contribution_types, public.enforce_followup_datetime(), public.interaction_outcomes, public.interaction_support_areas, public.mentoring_attendance (+12 more)

### Community 81 - "learning_center_schema_part2.sql"
Cohesion: 0.19
Nodes (14): feedback_responses, course_items, course_progress, courses, learning_center_audit_logs, mentor_stats, quiz_attempts, quiz_options (+6 more)

### Community 82 - "pipeline_stages_upgrade.sql"
Cohesion: 0.21
Nodes (11): alumni_interactions, alumni_master, interaction_outcomes, org_settings, alumni_contact_suppression, apply_do_not_contact(), pipeline_stages, reevaluate_pay_forward_eligibility() (+3 more)

### Community 83 - "supabase_schema.sql"
Cohesion: 0.18
Nodes (6): public.alumni_master, public.highest_education, public.import_batches, public.ng_campuses, public.ng_courses, auth.users

### Community 84 - "button.tsx"
Cohesion: 0.29
Nodes (5): DUMMY_PREVIEW, MAP_FIELDS, Button(), buttonVariants, Progress()

### Community 85 - "learning_center_schema.sql"
Cohesion: 0.47
Nodes (8): public.learning_audiences, public.learning_course_progress, public.learning_courses, public.learning_session_types, public.learning_sessions, public.mentors, public.user_integrations, auth.users

### Community 86 - "import-coursera/page.tsx"
Cohesion: 0.33
Nodes (8): AvailableMonth, formatDuration(), formatMonth(), formatRows(), generateAvailableMonthOptions(), ImportCourseraPage(), ImportLogRow, UploadResult

### Community 87 - "alumni/[email]/route.ts"
Cohesion: 0.36
Nodes (5): GET(), Params, PATCH(), mergeAlumniProfile(), setAuditContext()

### Community 88 - "recordings-client.tsx"
Cohesion: 0.38
Nodes (5): metadata, RecordingsPage(), RecordingsClient(), PastSessionCard(), getPastSessions()

### Community 89 - "settings-layout.tsx"
Cohesion: 0.50
Nodes (3): SettingsLayout(), SettingsLayoutProps, SettingsNavItem

## Knowledge Gaps
- **349 isolated node(s):** `supabase`, `supabase`, `$schema`, `style`, `rsc` (+344 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `sidebar.tsx`, `devDependencies`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `learning-center/queries.ts`, `alumni-growth/alumni/[id]/AlumniDetailClient.tsx`, `createAdminClient`, `users-table.tsx`, `card.tsx`, `import.ts`, `site-header.tsx`, `getUserRole`, `badge.tsx`, `alumni-growth/settings/SettingsClient.tsx`, `chart.tsx`, `alumni/[email]/route.ts`, `recordings-client.tsx`, `(dashboard)/page.tsx`, `server.ts`, `rollback.ts`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `WorkspaceClient.tsx`, `sidebar.tsx`, `components/page.tsx`, `users-table.tsx`, `alumni-growth/alumni/[id]/AlumniDetailClient.tsx`, `lib/utils.ts`, `dropdown-menu.tsx`, `card.tsx`, `mentor-form.tsx`, `site-header.tsx`, `badge.tsx`, `button.tsx`, `chart.tsx`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **What connects `supabase`, `supabase`, `$schema` to the rest of the system?**
  _349 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `WorkspaceClient.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11836734693877551 - nodes in this community are weakly interconnected._
- **Should `learning-center/queries.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12564102564102564 - nodes in this community are weakly interconnected._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10609756097560975 - nodes in this community are weakly interconnected._