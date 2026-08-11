# Graph Report - .  (2026-08-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1203 nodes · 3400 edges · 79 communities (54 shown, 25 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `16bf347e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- button.tsx
- createClient
- sidebar.tsx
- dependencies
- devDependencies
- components/page.tsx
- session-playback-modal.tsx
- createAdminClient
- compilerOptions
- dropdown-menu.tsx
- getUserRole
- Coursera Dashboard — Complete Build Instructions
- mentor-form.tsx
- NGConnect Web Application Documentation (Comprehensive)
- import.ts
- site-header.tsx
- alumni-growth/alumni/[id]/AlumniDetailClient.tsx
- components.json
- alumni.ts
- users-table.tsx
- cn
- roles.ts
- Greetings Banner Component
- chart.tsx
- createClient
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
- recalculate/route.ts
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
- forms-and-validation.md
- project-structure.md
- responsive-design.md
- security.md
- server-client-boundary.md
- testing.md
- rules/graphify.md
- workflows/graphify.md
- gitlog.md

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
- `NavItem` --references--> `react`  [EXTRACTED]
  src/components/nav-main.tsx → package.json
- `NavMain()` --references--> `react`  [EXTRACTED]
  src/components/nav-main.tsx → package.json
- `FormItem()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json
- `useFormField()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json

## Import Cycles
- None detected.

## Communities (79 total, 25 thin omitted)

### Community 0 - "button.tsx"
Cohesion: 0.06
Nodes (82): FollowUpsClient(), FollowUpsClientProps, DEFAULT_STAGES, MentoringColumn(), DEFAULT_STAGES, PayForwardColumn(), DEFAULT_STAGES, PlacementColumn() (+74 more)

### Community 1 - "createClient"
Cohesion: 0.07
Nodes (72): GET(), GET(), GET(), GET(), LearningCenterDashboardClient(), LearningCenterDashboard(), metadata, metadata (+64 more)

### Community 2 - "sidebar.tsx"
Cohesion: 0.11
Nodes (32): data, CourseraSidebarBanner(), NavItem, NavMain(), NavSecondary(), NavUser(), Sidebar(), SidebarContent() (+24 more)

### Community 3 - "dependencies"
Cohesion: 0.05
Nodes (45): class-variance-authority, clsx, @hookform/resolvers, lucide-react, next, next-themes, nodemailer, dependencies (+37 more)

### Community 4 - "devDependencies"
Cohesion: 0.05
Nodes (37): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, pg, shadcn, tailwindcss (+29 more)

### Community 5 - "components/page.tsx"
Cohesion: 0.10
Nodes (21): MOCK_TEXT, SCROLLBAR_OPTIONS, Accordion(), AccordionContent(), AccordionItem(), AccordionTrigger(), Collapsible(), CollapsibleContent() (+13 more)

### Community 6 - "session-playback-modal.tsx"
Cohesion: 0.07
Nodes (47): SessionsClient(), MentorDetailsPage(), EditSessionModalProps, PastSessionCardProps, isDriveUrl(), normalizeDriveUrl(), SessionMediaModal(), SessionMediaModalProps (+39 more)

### Community 7 - "createAdminClient"
Cohesion: 0.15
Nodes (15): GET(), Params, PATCH(), POST(), GET(), GET(), GET(), GET() (+7 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 9 - "dropdown-menu.tsx"
Cohesion: 0.14
Nodes (21): ROLES, HeaderUserMenu(), toTitleCase(), Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount() (+13 more)

### Community 10 - "getUserRole"
Cohesion: 0.16
Nodes (16): RolePermissionData, CourseraDashboardPage(), SearchParams, ImportHistoryPage(), DataManagementLayout(), COURSERA_CATEGORY, DATA_MANAGEMENT_CATEGORIES, DataManagementPage() (+8 more)

### Community 11 - "Coursera Dashboard — Complete Build Instructions"
Cohesion: 0.06
Nodes (30): Architecture Overview, Complete Algorithm (implement exactly in this order), Coursera Dashboard — Complete Build Instructions, Dashboard layout, `GET /api/coursera/learner/[email]`, `GET /api/coursera/metrics/available-months`, `GET /api/coursera/metrics?month=2026-03-01`, `GET /api/coursera/metrics/trend?months=6` (+22 more)

### Community 12 - "mentor-form.tsx"
Cohesion: 0.14
Nodes (19): FormControl(), FormDescription(), FormField(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext, FormItemContextValue (+11 more)

### Community 13 - "NGConnect Web Application Documentation (Comprehensive)"
Cohesion: 0.10
Nodes (20): 1. Overview, 2.1 Framework & Core Libraries, 2.2 Styling & UI Components, 2.3 Backend & Infrastructure, 2. Technology Stack & Core Tooling, 3.1 Routing & Middleware, 3.2 Utilities & State Management, 3. Application Architecture (+12 more)

### Community 14 - "import.ts"
Cohesion: 0.19
Nodes (14): POST(), defaultColumnMap, parseImportFile(), VALID_STATUSES, validateImportRow(), validateImportRows(), GharColumnMap, ImportAction (+6 more)

### Community 15 - "site-header.tsx"
Cohesion: 0.13
Nodes (19): DashboardLayout(), AppSidebar(), DevRoleToggle(), ModeToggle(), HeaderUserMenu, SiteHeader(), Breadcrumb(), BreadcrumbEllipsis() (+11 more)

### Community 16 - "alumni-growth/alumni/[id]/AlumniDetailClient.tsx"
Cohesion: 0.05
Nodes (75): AlumniDetailClient(), AlumniDetailClientProps, AlumniDetailPage(), PageProps, FollowUpsPage(), MentoringClientProps, PayForwardClientProps, PlacementClientProps (+67 more)

### Community 17 - "components.json"
Cohesion: 0.10
Nodes (19): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+11 more)

### Community 18 - "alumni.ts"
Cohesion: 0.24
Nodes (10): overridable, AlumniMaster, AlumniProfile, AlumniStatus, CareerEntry, CourseraActivity, CourseraConfig, MergedProfile (+2 more)

### Community 19 - "users-table.tsx"
Cohesion: 0.21
Nodes (10): AlumniNetworkStatsCards(), AlumniNetworkStatsCharts(), AlumniNetworkPage(), SUPER_ADMINS, updateUserRoleAndTeam(), ManageUsersPage(), formatRelativeTime(), UsersTable() (+2 more)

### Community 20 - "cn"
Cohesion: 0.14
Nodes (20): CardAction(), Field(), FieldContent(), FieldDescription(), FieldError(), FieldGroup(), FieldLabel(), FieldLegend() (+12 more)

### Community 21 - "roles.ts"
Cohesion: 0.15
Nodes (21): rollbackRbac(), saveRbacChanges(), MentoringClient(), MentoringPage(), PayForwardPage(), PayForwardClient(), PlacementPage(), PlacementClient() (+13 more)

### Community 22 - "Greetings Banner Component"
Cohesion: 0.18
Nodes (10): 1. Component Location & Overview, 2. Component Design & Aesthetics, 3. Content Structure, 4.1. Hydration & Safe Mounting, 4.2. User Personalization, 4.3. Time & Date Logic, 4.4. Safe Access & Fallbacks, 4. Operational Rules & Logic (+2 more)

### Community 23 - "chart.tsx"
Cohesion: 0.05
Nodes (49): react, react, chartConfig, CourseraDashboardClient(), delta(), fmt(), formatMonth(), formatMonthShort() (+41 more)

### Community 24 - "createClient"
Cohesion: 0.08
Nodes (23): AuditLogsPage(), AvailableMonth, formatDuration(), formatMonth(), formatRows(), generateAvailableMonthOptions(), ImportCourseraPage(), ImportLogRow (+15 more)

### Community 25 - "(dashboard)/page.tsx"
Cohesion: 0.17
Nodes (13): GreetingsPreviewPage(), DashboardPage(), CourseraCharts(), dailyVariantIndex(), DashboardGreeting(), DashboardStats(), GreetingEntry, hourlyGreetings (+5 more)

### Community 26 - "AGENTS.md"
Cohesion: 0.20
Nodes (6): Accessibility Rules, Rules, Design System Rules, Rules, Performance Rules, Rules

### Community 27 - "Created Tables Log"
Cohesion: 0.20
Nodes (9): 1. `ng_campuses`, 2. `highest_education`, 3. `ng_courses`, 4. `import_batches`, 5. `alumni_master`, 6. `alumni_profile`, 7. `import_batch_records`, 8. `audit_log` (+1 more)

### Community 28 - "Charts, Graphs, and Data Visualizations"
Cohesion: 0.20
Nodes (9): 1 Color (`--color-chart-primary` only), 2 Colors (`--color-chart-primary` + `--color-chart-accent-1`), 3 Colors (`--color-chart-primary` + `--color-chart-accent-1` + `--color-chart-accent-2`), 4+ Colors, Charts, Graphs, and Data Visualizations, Color Tokens, Hard Rules, How Many Colors to Use (+1 more)

### Community 29 - "server.ts"
Cohesion: 0.15
Nodes (9): GET(), MAPPING_FILE_PATH, POST(), POST(), ActivityLogsPage(), formatMonth(), SearchParams, LearnerDetailPage() (+1 more)

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

### Community 39 - "recalculate/route.ts"
Cohesion: 0.70
Nodes (4): fetchAllSupabase(), firstDayOfMonth(), POST(), upsertInBatches()

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

## Knowledge Gaps
- **345 isolated node(s):** `supabase`, `supabase`, `$schema`, `style`, `rsc` (+340 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`, `chart.tsx`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `button.tsx`, `session-playback-modal.tsx`, `createAdminClient`, `getUserRole`, `import.ts`, `site-header.tsx`, `alumni-growth/alumni/[id]/AlumniDetailClient.tsx`, `users-table.tsx`, `roles.ts`, `(dashboard)/page.tsx`, `server.ts`, `rollback.ts`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `button.tsx`, `sidebar.tsx`, `components/page.tsx`, `session-playback-modal.tsx`, `dropdown-menu.tsx`, `mentor-form.tsx`, `site-header.tsx`, `alumni-growth/alumni/[id]/AlumniDetailClient.tsx`, `chart.tsx`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **What connects `supabase`, `supabase`, `$schema` to the rest of the system?**
  _345 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `button.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06217882836587873 - nodes in this community are weakly interconnected._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.06629243517775996 - nodes in this community are weakly interconnected._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10796221322537113 - nodes in this community are weakly interconnected._