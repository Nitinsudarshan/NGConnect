# Graph Report - NGConnect  (2026-08-15)

## Corpus Check
- 309 files · ~188,314 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1616 nodes · 4568 edges · 135 communities (92 shown, 43 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a175349a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- schema.ts
- learning-center/settings/page.tsx
- sidebar.tsx
- dependencies
- devDependencies
- site-header.tsx
- button.tsx
- createAdminClient
- compilerOptions
- dropdown-menu.tsx
- card.tsx
- Coursera Dashboard — Complete Build Instructions
- alumni-growth/alumni/[id]/AlumniDetailClient.tsx
- NGConnect Web Application Documentation (Comprehensive)
- import.ts
- alumni-growth/pipelines/mentoring/MentoringClient.tsx
- auth
- components.json
- help-registry.ts
- engagement/queries.ts
- cn
- badge.tsx
- Greetings Banner Component
- chart.tsx
- createClient
- app/layout.tsx
- AGENTS.md
- Created Tables Log
- Charts, Graphs, and Data Visualizations
- dispatcher.ts
- settings-client.tsx
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
- mentor-form.tsx
- roles.ts
- update-licenses.ts
- next.config.ts
- postcss.config.mjs
- globals.d.ts
- NGConnect
- UI Component Rules
- version-config.ts
- component-architecture.md
- data-access.md
- rollback.ts
- documentation.md
- components/page.tsx
- alumni-growth/settings/SettingsClient.tsx
- responsive-design.md
- security.md
- server-client-boundary.md
- 20260812191509_supabase_schema.sql
- rules/graphify.md
- workflows/graphify.md
- gitlog.md
- learning-center/queries.ts
- 20260812191501_alumni_engagement_crm_schema.sql
- 20260812191505_learning_center_schema_part2.sql
- 20260812191507_pipeline_stages_upgrade.sql
- package.json
- alumni/[email]/route.ts
- 20260812191504_learning_center_schema.sql
- api-conventions.md
- Add User Autocomplete to RBAC Grid
- clsx
- 20260813000001_channel_specific_outcomes.sql
- FollowupDateSelector.tsx
- engagement.ts
- sheet.tsx
- template/route.ts
- public.pipeline_poc_eligibility
- forms-and-validation.md
- public.learning_sessions
- performance.md
- pipeline_stages
- public.user_integrations
- @dnd-kit/utilities
- recharts
- resource-tree.ts
- @supabase/ssr
- zod
- next
- nodemailer
- radix-ui
- import/route.ts
- read-excel-file
- @supabase/supabase-js
- tailwind-merge
- public.interaction_outcomes
- alumni_pipeline_membership
- alumni_pipeline_membership
- recalculate/route.ts
- useUserContext
- react
- 20260813000002_email_notifications_system.sql
- InteractionOutcome
- data-import.md
- alumni-growth/settings/page.tsx
- @hookform/resolvers
- public.alumni_contact_suppression
- public.apply_do_not_contact
- activity-logs/page.tsx
- import-coursera/page.tsx
- video-player.tsx
- class-variance-authority
- settings-layout.tsx
- getKanbanBoardCardsAction
- project-structure.md

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 171 edges
2. `cn()` - 145 edges
3. `createAdminClient()` - 90 edges
4. `Button()` - 66 edges
5. `getUserRole()` - 57 edges
6. `Badge()` - 55 edges
7. `Card()` - 53 edges
8. `CardContent()` - 49 edges
9. `CardHeader()` - 42 edges
10. `CardTitle()` - 42 edges

## Surprising Connections (you probably didn't know these)
- `SettingsClient()` --references--> `react`  [EXTRACTED]
  src/app/(dashboard)/learning-center/settings/settings-client.tsx → package.json
- `LogInteractionModal()` --references--> `react`  [EXTRACTED]
  src/components/engagement/LogInteractionModal.tsx → package.json
- `EditLogTab()` --references--> `react`  [EXTRACTED]
  src/components/settings/edit-log-tab.tsx → package.json
- `ChartContainer()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json
- `ChartTooltipContent()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json

## Import Cycles
- None detected.

## Communities (135 total, 43 thin omitted)

### Community 0 - "schema.ts"
Cohesion: 0.22
Nodes (8): CategoryFormSchema, CategoryFormValues, MentorFormSchema, MentorFormValues, SessionFormSchema, SessionFormValues, SubcategoryFormSchema, SubcategoryFormValues

### Community 1 - "learning-center/settings/page.tsx"
Cohesion: 0.26
Nodes (14): CreateSessionPage(), metadata, metadata, SessionsPage(), metadata, SettingsPage(), enrichSessionsWithCategoryNames(), getAudiences() (+6 more)

### Community 2 - "sidebar.tsx"
Cohesion: 0.12
Nodes (29): data, CourseraSidebarBanner(), NavSecondary(), NavUser(), PayForwardSidebarBanner(), Sidebar(), SidebarContent(), SidebarContext (+21 more)

### Community 3 - "dependencies"
Cohesion: 0.10
Nodes (21): @dnd-kit/core, @dnd-kit/sortable, exceljs, isomorphic-dompurify, lucide-react, mermaid, next-themes, dependencies (+13 more)

### Community 4 - "devDependencies"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, shadcn, tailwindcss, @tailwindcss/postcss (+17 more)

### Community 5 - "site-header.tsx"
Cohesion: 0.15
Nodes (16): AppSidebar(), ModeToggle(), HeaderUserMenu, SiteHeader(), Breadcrumb(), BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink() (+8 more)

### Community 6 - "button.tsx"
Cohesion: 0.15
Nodes (25): DEFAULT_SETTINGS, isDriveUrl(), normalizeDriveUrl(), SessionMediaModal(), ConfirmDeleteDialogProps, HelpSectionRenderer(), AVATAR_COLORS, ChatEntry (+17 more)

### Community 7 - "createAdminClient"
Cohesion: 0.07
Nodes (38): POST(), GET(), GET(), GET(), GET(), DELETE(), firstDayOfMonth(), GET() (+30 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 9 - "dropdown-menu.tsx"
Cohesion: 0.23
Nodes (13): ROLES, HeaderUserMenu(), toTitleCase(), Avatar(), AvatarFallback(), AvatarImage(), DropdownMenu(), DropdownMenuContent() (+5 more)

### Community 10 - "card.tsx"
Cohesion: 0.09
Nodes (37): AuditLogsPage(), MAP_FIELDS, RecordHistoryContent(), RollbackCenterPage(), FollowUpsClientProps, MentoringClientProps, STAGES, PayForwardClientProps (+29 more)

### Community 11 - "Coursera Dashboard — Complete Build Instructions"
Cohesion: 0.06
Nodes (30): Architecture Overview, Complete Algorithm (implement exactly in this order), Coursera Dashboard — Complete Build Instructions, Dashboard layout, `GET /api/coursera/learner/[email]`, `GET /api/coursera/metrics/available-months`, `GET /api/coursera/metrics?month=2026-03-01`, `GET /api/coursera/metrics/trend?months=6` (+22 more)

### Community 12 - "alumni-growth/alumni/[id]/AlumniDetailClient.tsx"
Cohesion: 0.24
Nodes (14): AlumniNetworkStatsProps, BANNER_THEMES, ProfilePage(), LogInteractionModal(), TransferLeadModalProps, AlumniDetailsModule(), DialogFooter(), Select() (+6 more)

### Community 13 - "NGConnect Web Application Documentation (Comprehensive)"
Cohesion: 0.10
Nodes (20): 1. Overview, 2.1 Framework & Core Libraries, 2.2 Styling & UI Components, 2.3 Backend & Infrastructure, 2. Technology Stack & Core Tooling, 3.1 Routing & Middleware, 3.2 Utilities & State Management, 3. Application Architecture (+12 more)

### Community 14 - "import.ts"
Cohesion: 0.15
Nodes (18): PATCH(), POST(), POST(), defaultColumnMap, parseImportFile(), processImportRows(), VALID_STATUSES, validateImportRow() (+10 more)

### Community 15 - "alumni-growth/pipelines/mentoring/MentoringClient.tsx"
Cohesion: 0.08
Nodes (41): AlumniDetailClient(), CalendarStrip(), CATEGORY_STYLES, classifyFollowup(), FollowUpCard(), FollowUpCategory, FollowUpsClient(), startOf() (+33 more)

### Community 16 - "auth"
Cohesion: 0.20
Nodes (16): DataManagementLayout(), COURSERA_CATEGORY, DATA_MANAGEMENT_CATEGORIES, DataManagementPage(), ManageAlumniNetworkLayout(), HelpDocsPage(), metadata, ManageMasterDataLayout() (+8 more)

### Community 17 - "components.json"
Cohesion: 0.10
Nodes (19): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+11 more)

### Community 18 - "help-registry.ts"
Cohesion: 0.19
Nodes (11): getSetFromLS(), HelpDocsClient(), saveSetToLS(), getSetFromLS(), HeaderHelpTrigger(), COLOR_DOT, getHelpEntry(), getHelpIdForRoute() (+3 more)

### Community 19 - "engagement/queries.ts"
Cohesion: 0.15
Nodes (27): AlumniDetailPage(), PageProps, FollowUpsPage(), ReportsPage(), ReportsClient(), WorkspacePage(), DEFAULT_PIPELINE_STAGES, enrichAlumniList() (+19 more)

### Community 20 - "cn"
Cohesion: 0.07
Nodes (36): Accordion(), AccordionContent(), AccordionItem(), AccordionTrigger(), AvatarBadge(), AvatarGroup(), AvatarGroupCount(), CardAction() (+28 more)

### Community 21 - "badge.tsx"
Cohesion: 0.22
Nodes (20): SessionsClient(), MentorDetailsPage(), DrillDownDialog(), NotificationDashboardClient(), NotificationTrendChart(), TrendChartProps, TrendDataPoint, UsersTableProps (+12 more)

### Community 22 - "Greetings Banner Component"
Cohesion: 0.18
Nodes (10): 1. Component Location & Overview, 2. Component Design & Aesthetics, 3. Content Structure, 4.1. Hydration & Safe Mounting, 4.2. User Personalization, 4.3. Time & Date Logic, 4.4. Safe Access & Fallbacks, 4. Operational Rules & Logic (+2 more)

### Community 23 - "chart.tsx"
Cohesion: 0.06
Nodes (43): chartConfig, CourseraDashboardClient(), delta(), fmt(), formatMonth(), formatMonthShort(), getDistColorVar(), KpiCard() (+35 more)

### Community 24 - "createClient"
Cohesion: 0.26
Nodes (14): GET(), MAPPING_FILE_PATH, POST(), GET(), LearningCenterDashboard(), metadata, saveWatchProgressAction(), checkCourseraApiUserActive() (+6 more)

### Community 25 - "app/layout.tsx"
Cohesion: 0.23
Nodes (6): geistMono, geistSans, metadata, LoginForm(), ThemeProvider(), Toaster()

### Community 26 - "AGENTS.md"
Cohesion: 0.20
Nodes (6): Accessibility Rules, Rules, Design System Rules, Rules, Rules, Testing Rules

### Community 27 - "Created Tables Log"
Cohesion: 0.20
Nodes (9): 1. `ng_campuses`, 2. `highest_education`, 3. `ng_courses`, 4. `import_batches`, 5. `alumni_master`, 6. `alumni_profile`, 7. `import_batch_records`, 8. `audit_log` (+1 more)

### Community 28 - "Charts, Graphs, and Data Visualizations"
Cohesion: 0.20
Nodes (9): 1 Color (`--color-chart-primary` only), 2 Colors (`--color-chart-primary` + `--color-chart-accent-1`), 3 Colors (`--color-chart-primary` + `--color-chart-accent-1` + `--color-chart-accent-2`), 4+ Colors, Charts, Graphs, and Data Visualizations, Color Tokens, Hard Rules, How Many Colors to Use (+1 more)

### Community 29 - "dispatcher.ts"
Cohesion: 0.06
Nodes (45): GET(), GET(), handleAuthAndProcess(), POST(), GET(), DrillDownDialogProps, DashboardClientProps, SettingsClientProps (+37 more)

### Community 30 - "settings-client.tsx"
Cohesion: 0.20
Nodes (24): CreateSessionClient(), SettingsClient(), EditSessionModal(), createGoogleMeetLink(), archiveMentorAction(), createMentor(), createSessionAction(), deleteAudienceAction() (+16 more)

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
Cohesion: 0.15
Nodes (25): SettingsClient(), LearnerDetailPage(), PageProps, CourseraDashboardPage(), SearchParams, ImportHistoryPage(), SettingsClient(), LearningCenterLayout() (+17 more)

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

### Community 48 - "mentor-form.tsx"
Cohesion: 0.24
Nodes (13): MentorFormProps, FormControl(), FormDescription(), FormField(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext (+5 more)

### Community 49 - "roles.ts"
Cohesion: 0.17
Nodes (21): GranularPermissionInput, RolePermissionData, rollbackGranularRbac(), saveGranularRbacChanges(), saveRbacChanges(), MentoringPage(), PayForwardPage(), PlacementPage() (+13 more)

### Community 63 - "NGConnect"
Cohesion: 0.20
Nodes (9): 🏗 Architecture & Code Standards, 🗄️ Database Schema, 📦 Getting Started, Installation, 🚀 Key Features, 📄 License, NGConnect, Prerequisites (+1 more)

### Community 64 - "UI Component Rules"
Cohesion: 0.50
Nodes (3): Known drift to clean up, Rules, UI Component Rules

### Community 65 - "version-config.ts"
Cohesion: 0.33
Nodes (5): ChangeType, CURRENT_VERSION, VERSION_HISTORY, VersionChangeItem, VersionEntry

### Community 68 - "rollback.ts"
Cohesion: 0.36
Nodes (6): POST(), POST(), AdminUser, rollbackImportBatch(), rollbackRecord(), RollbackTable

### Community 70 - "components/page.tsx"
Cohesion: 0.11
Nodes (23): AVAILABLE_FIELDS, PRESETS, ReportsClientProps, MOCK_TEXT, SCROLLBAR_OPTIONS, FollowUpsClient(), QueueClient(), AVAILABLE_FIELDS (+15 more)

### Community 71 - "alumni-growth/settings/SettingsClient.tsx"
Cohesion: 0.16
Nodes (16): NAV_ITEMS, OUTCOME_MAPPING_ROWS, SettingsClientProps, ConfirmDeleteDialog(), EditLogTab(), EditLogTabProps, LC_ENTITY_TYPES, MentorForm() (+8 more)

### Community 75 - "20260812191509_supabase_schema.sql"
Cohesion: 0.18
Nodes (6): public.alumni_master, public.highest_education, public.import_batches, public.ng_campuses, public.ng_courses, auth.users

### Community 79 - "learning-center/queries.ts"
Cohesion: 0.10
Nodes (26): LearningCenterDashboardClient(), metadata, RecordingsPage(), RecordingsClient(), ContinueWatchingCardProps, EditSessionModalProps, PastSessionCard(), PastSessionCardProps (+18 more)

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

### Community 84 - "alumni/[email]/route.ts"
Cohesion: 0.20
Nodes (13): GET(), Params, mergeAlumniProfile(), overridable, AlumniMaster, AlumniProfile, AlumniStatus, CareerEntry (+5 more)

### Community 85 - "20260812191504_learning_center_schema.sql"
Cohesion: 0.47
Nodes (8): public.learning_audiences, public.learning_course_progress, public.learning_courses, public.learning_session_types, public.learning_sessions, public.mentors, public.user_integrations, auth.users

### Community 87 - "Add User Autocomplete to RBAC Grid"
Cohesion: 0.25
Nodes (7): 1. New Server Action, 2. Update RBAC Grid UI, Add User Autocomplete to RBAC Grid, [MODIFY] [rbac-grid.tsx](file:///D:/Projects/NGConnect/src/app/(dashboard)/manage/rbac/_components/rbac-grid.tsx), [NEW] [users.ts](file:///D:/Projects/NGConnect/src/app/actions/users.ts), Proposed Changes, Verification Plan

### Community 89 - "20260813000001_channel_specific_outcomes.sql"
Cohesion: 0.25
Nodes (7): public.apply_do_not_contact, public.alumni_contact_suppression, public.apply_do_not_contact(), interaction_outcomes, public.alumni_interactions, public.alumni_master, trg_apply_do_not_contact

### Community 90 - "FollowupDateSelector.tsx"
Cohesion: 0.43
Nodes (7): addDays(), FollowupDateSelector(), FollowupDateSelectorProps, formatDateTimeLocal(), isSunday(), isValid(), setTime()

### Community 91 - "engagement.ts"
Cohesion: 0.14
Nodes (13): OwnershipTags(), PipelineOwnerTag(), AlumniInteraction, AlumniPipelineMembership, AlumniSalaryRecord, LogInteractionPayload, Mentor, MentoringSession (+5 more)

### Community 92 - "sheet.tsx"
Cohesion: 0.18
Nodes (8): Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle(), SheetTrigger()

### Community 102 - "resource-tree.ts"
Cohesion: 0.25
Nodes (8): RbacGrid(), RESOURCES_BY_CLUSTER, ActionType, getResource(), getResourcesByCluster(), PERMISSION_RESOURCES, PermissionResource, RESOURCE_CLUSTERS

### Community 108 - "import/route.ts"
Cohesion: 0.60
Nodes (5): fetchAllSupabase(), firstDayOfMonth(), parseDate(), POST(), upsertInBatches()

### Community 118 - "recalculate/route.ts"
Cohesion: 0.70
Nodes (4): fetchAllSupabase(), firstDayOfMonth(), POST(), upsertInBatches()

### Community 119 - "useUserContext"
Cohesion: 0.18
Nodes (13): GreetingsPreviewPage(), dailyVariantIndex(), DashboardGreeting(), DevRoleToggle(), GreetingEntry, hourlyGreetings, ICONS, SidebarVersionFooter() (+5 more)

### Community 120 - "react"
Cohesion: 0.22
Nodes (8): react, react, NavItem, NavMain(), SidebarMenuSkeleton(), SidebarProvider(), Slider(), useIsMobile()

### Community 121 - "20260813000002_email_notifications_system.sql"
Cohesion: 0.42
Nodes (8): public.alumni_channel_activity, public.notification_provider_settings, public.notification_queue, public.notification_sends, public.notification_templates, public.notification_triggers, public.alumni_interactions, public.alumni_master

### Community 122 - "InteractionOutcome"
Cohesion: 0.29
Nodes (10): AlumniDetailClientProps, FollowUpsClientProps, WorkspaceClientProps, AlumniDetailClientProps, QueueClientProps, SettingsClientProps, LogInteractionModalProps, InteractionOutcome (+2 more)

### Community 124 - "alumni-growth/settings/page.tsx"
Cohesion: 0.36
Nodes (9): metadata, SettingsPage(), getAllPipelinePocEligibility(), getCallReasons(), getContributionTypes(), getOutcomeMapping(), getPipelines(), getPipelineStages() (+1 more)

### Community 128 - "activity-logs/page.tsx"
Cohesion: 0.67
Nodes (3): ActivityLogsPage(), formatMonth(), SearchParams

### Community 129 - "import-coursera/page.tsx"
Cohesion: 0.33
Nodes (8): AvailableMonth, formatDuration(), formatMonth(), formatRows(), generateAvailableMonthOptions(), ImportCourseraPage(), ImportLogRow, UploadResult

### Community 130 - "video-player.tsx"
Cohesion: 0.33
Nodes (6): buildEmbedUrl(), detectEmbed(), formatTime(), VideoPlayer(), VideoPlayerProps, syncSessionDurationAction()

### Community 132 - "settings-layout.tsx"
Cohesion: 0.36
Nodes (6): SettingsLayout(), SettingsLayoutProps, SettingsNavItem, Collapsible(), CollapsibleContent(), CollapsibleTrigger()

### Community 133 - "getKanbanBoardCardsAction"
Cohesion: 0.40
Nodes (5): MentoringClient(), PayForwardClient(), PlacementClient(), getKanbanBoardCardsAction(), getKanbanBoardCards()

## Knowledge Gaps
- **435 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+430 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **43 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `createClient` to `activity-logs/page.tsx`, `learning-center/settings/page.tsx`, `site-header.tsx`, `getKanbanBoardCardsAction`, `createAdminClient`, `card.tsx`, `import.ts`, `alumni-growth/pipelines/mentoring/MentoringClient.tsx`, `auth`, `engagement/queries.ts`, `badge.tsx`, `dispatcher.ts`, `settings-client.tsx`, `engagement/actions.ts`, `roles.ts`, `rollback.ts`, `components/page.tsx`, `learning-center/queries.ts`, `alumni/[email]/route.ts`, `import/route.ts`, `recalculate/route.ts`, `alumni-growth/settings/page.tsx`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `sidebar.tsx`, `dependencies`, `alumni-growth/settings/SettingsClient.tsx`, `alumni-growth/alumni/[id]/AlumniDetailClient.tsx`, `mentor-form.tsx`, `chart.tsx`, `settings-client.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `class-variance-authority`, `@dnd-kit/utilities`, `recharts`, `@supabase/ssr`, `zod`, `next`, `nodemailer`, `radix-ui`, `read-excel-file`, `@supabase/supabase-js`, `tailwind-merge`, `package.json`, `clsx`, `react`, `@hookform/resolvers`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _435 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11711711711711711 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._