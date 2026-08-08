# Graph Report - .  (2026-08-08)

## Corpus Check
- 267 files · ~140,750 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1038 nodes · 3245 edges · 63 communities (52 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Tsx Page Module
- Tsx Page Module
- Tsx Sidebar Module
- React Next Module
- @types Eslint Module
- Tsx Page Module
- Tsx Table Module
- Route Get() Module
- Next Dom Module
- Tsx User Module
- Tsx Layout Module
- Tsx Edit Module
- Mentor Form Module
- Tsx Default Module
- Import Route Module
- Tsx Breadcrumb Module
- Page Tsx Module
- Components Json Module
- Overridable Route Module
- Alumnidetailclientprops Settingsclientprops Module
- Tsx Cardaction() Module
- Permissions Rolepermissiondata Module
- Tsx Settingsclient() Module
- Tsx Chartconfig Module
- Tsx Layout Module
- Tsx User Module
- Tsx Page Module
- Page Tsx Module
- Courseradashboardclient Tsx Module
- Route Get() Module
- Route Post() Module
- Page Tsx Module
- Tsx Page Module
- Middleware Important: Module
- Alumnidetailclient() Workspaceclient() Module
- Reportgeneratorclient Tsx Module
- Icon Tsx Module
- Temp Check Module
- Temp Refactor Module
- Route Fetchallsupabase() Module
- Zoom Createzoommeeting() Module
- Followupsclient() Page Module
- Temp Refactor Module
- Check Data Module
- Check Checkdb() Module
- Page Tsx Module
- Input Tsx Module
- Check Adminclient Module
- Temp Update Module
- Test Rls Module
- Update Licenses Module
- Next Config Module
- Config Postcss Module
- Globals Customjwtsessionclaims Module

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

## Communities (63 total, 11 thin omitted)

### Community 0 - "Tsx Page Module"
Cohesion: 0.05
Nodes (94): FollowUpsClientProps, AVAILABLE_FIELDS, PRESETS, ReportsClientProps, AuditLogsPage(), DUMMY_AUDIT_LOGS, chartConfig, Course (+86 more)

### Community 1 - "Tsx Page Module"
Cohesion: 0.07
Nodes (74): GET(), GET(), GET(), LearningCenterDashboardClient(), LearningCenterDashboard(), metadata, metadata, RecordingsPage() (+66 more)

### Community 2 - "Tsx Sidebar Module"
Cohesion: 0.10
Nodes (37): react, react, data, CourseraSidebarBanner(), NavItem, NavMain(), NavSecondary(), NavUser() (+29 more)

### Community 3 - "React Next Module"
Cohesion: 0.05
Nodes (40): class-variance-authority, clsx, @hookform/resolvers, lucide-react, next, next-themes, nodemailer, dependencies (+32 more)

### Community 4 - "@types Eslint Module"
Cohesion: 0.05
Nodes (37): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, pg, shadcn, tailwindcss (+29 more)

### Community 5 - "Tsx Page Module"
Cohesion: 0.10
Nodes (21): MOCK_TEXT, SCROLLBAR_OPTIONS, Accordion(), AccordionContent(), AccordionItem(), AccordionTrigger(), Checkbox(), Progress() (+13 more)

### Community 6 - "Tsx Table Module"
Cohesion: 0.13
Nodes (27): MentorDetailsPage(), SUPER_ADMINS, updateUserRoleAndTeam(), formatRelativeTime(), UsersTable(), UsersTableProps, EditSessionModalProps, PastSessionCardProps (+19 more)

### Community 7 - "Route Get() Module"
Cohesion: 0.12
Nodes (20): POST(), fetchAllSupabase(), firstDayOfMonth(), parseDate(), POST(), upsertInBatches(), GET(), GET() (+12 more)

### Community 8 - "Next Dom Module"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 9 - "Tsx User Module"
Cohesion: 0.14
Nodes (21): ROLES, HeaderUserMenu(), toTitleCase(), Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount() (+13 more)

### Community 10 - "Tsx Layout Module"
Cohesion: 0.13
Nodes (18): LearnerDetailPage(), PageProps, CourseraDashboardPage(), SearchParams, ImportHistoryPage(), DataManagementLayout(), COURSERA_CATEGORY, DATA_MANAGEMENT_CATEGORIES (+10 more)

### Community 11 - "Tsx Edit Module"
Cohesion: 0.17
Nodes (14): isDriveUrl(), normalizeDriveUrl(), SessionMediaModal(), Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader() (+6 more)

### Community 12 - "Mentor Form Module"
Cohesion: 0.12
Nodes (22): MentorForm(), MentorFormProps, FormControl(), FormDescription(), FormField(), FormFieldContext, FormFieldContextValue, FormItem() (+14 more)

### Community 13 - "Tsx Default Module"
Cohesion: 0.20
Nodes (20): DEFAULT_STAGES, MentoringClientProps, MentoringColumn(), DEFAULT_STAGES, PayForwardClientProps, PayForwardColumn(), DEFAULT_STAGES, PlacementClientProps (+12 more)

### Community 14 - "Import Route Module"
Cohesion: 0.19
Nodes (16): POST(), POST(), defaultColumnMap, parseImportFile(), processImportRows(), VALID_STATUSES, validateImportRow(), validateImportRows() (+8 more)

### Community 15 - "Tsx Breadcrumb Module"
Cohesion: 0.14
Nodes (17): DashboardLayout(), AppSidebar(), ModeToggle(), HeaderUserMenu, SiteHeader(), Breadcrumb(), BreadcrumbEllipsis(), BreadcrumbItem() (+9 more)

### Community 16 - "Page Tsx Module"
Cohesion: 0.23
Nodes (16): AlumniDetailPage(), PageProps, ReportsPage(), SettingsPage(), WorkspacePage(), DEFAULT_PIPELINE_STAGES, getAlumnusEngagementDetails(), getContributionTypes() (+8 more)

### Community 17 - "Components Json Module"
Cohesion: 0.10
Nodes (19): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+11 more)

### Community 18 - "Overridable Route Module"
Cohesion: 0.16
Nodes (15): GET(), Params, PATCH(), mergeAlumniProfile(), overridable, setAuditContext(), AlumniMaster, AlumniProfile (+7 more)

### Community 19 - "Alumnidetailclientprops Settingsclientprops Module"
Cohesion: 0.16
Nodes (19): AlumniDetailClientProps, SettingsClientProps, WorkspaceClientProps, AlumniDetailClientProps, QueueClientProps, SettingsClientProps, LogInteractionModalProps, AlumniInteraction (+11 more)

### Community 20 - "Tsx Cardaction() Module"
Cohesion: 0.17
Nodes (18): CardAction(), Field(), FieldContent(), FieldDescription(), FieldError(), FieldGroup(), FieldLabel(), FieldLegend() (+10 more)

### Community 21 - "Permissions Rolepermissiondata Module"
Cohesion: 0.19
Nodes (13): RolePermissionData, rollbackRbac(), saveRbacChanges(), getChanges(), RbacAuditLog(), RbacGrid(), RbacPage(), auth() (+5 more)

### Community 22 - "Tsx Settingsclient() Module"
Cohesion: 0.21
Nodes (14): NAV_ITEMS, SettingsClient(), SettingsClient(), SettingsLayout(), SettingsLayoutProps, SettingsNavItem, manageContributionTypeAction(), manageOutcomeAction() (+6 more)

### Community 23 - "Tsx Chartconfig Module"
Cohesion: 0.17
Nodes (14): chartConfig, CourseraChartsProps, CourseraMonthlyMetric, ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent() (+6 more)

### Community 24 - "Tsx Layout Module"
Cohesion: 0.18
Nodes (8): geistMono, geistSans, metadata, LoadingSpinner(), LoginForm(), MiniLoader(), ThemeProvider(), Toaster()

### Community 25 - "Tsx User Module"
Cohesion: 0.21
Nodes (11): GreetingsPreviewPage(), dailyVariantIndex(), DashboardGreeting(), DevRoleToggle(), GreetingEntry, hourlyGreetings, ICONS, User (+3 more)

### Community 26 - "Tsx Page Module"
Cohesion: 0.19
Nodes (10): DashboardPage(), CourseraCharts(), CourseraMetrics, CourseraStats(), CourseraStatsProps, chartConfig, DashboardCharts(), DashboardChartsProps (+2 more)

### Community 27 - "Page Tsx Module"
Cohesion: 0.36
Nodes (9): MentoringClient(), MentoringPage(), PayForwardPage(), PayForwardClient(), PlacementPage(), PlacementClient(), getKanbanFacets(), getPipelineBoardData() (+1 more)

### Community 28 - "Courseradashboardclient Tsx Module"
Cohesion: 0.24
Nodes (11): chartConfig, CourseraDashboardClient(), delta(), fmt(), formatMonth(), formatMonthShort(), getDistColorVar(), KpiCard() (+3 more)

### Community 29 - "Route Get() Module"
Cohesion: 0.20
Nodes (7): GET(), MAPPING_FILE_PATH, POST(), GET(), ActivityLogsPage(), formatMonth(), SearchParams

### Community 30 - "Route Post() Module"
Cohesion: 0.36
Nodes (6): POST(), POST(), AdminUser, rollbackImportBatch(), rollbackRecord(), RollbackTable

### Community 31 - "Page Tsx Module"
Cohesion: 0.33
Nodes (8): AvailableMonth, formatDuration(), formatMonth(), formatRows(), generateAvailableMonthOptions(), ImportCourseraPage(), ImportLogRow, UploadResult

### Community 32 - "Tsx Page Module"
Cohesion: 0.33
Nodes (6): buildEmbedUrl(), detectEmbed(), formatTime(), VideoPlayer(), VideoPlayerProps, syncSessionDurationAction()

### Community 33 - "Middleware Important: Module"
Cohesion: 0.38
Nodes (5): IMPORTANT: Avoid writing any logic between createServerClient and, IMPORTANT: You *must* return the supabaseResponse object as it is. If you're, updateSession(), config, middleware()

### Community 34 - "Alumnidetailclient() Workspaceclient() Module"
Cohesion: 0.40
Nodes (5): AlumniDetailClient(), WorkspaceClient(), updateAlumniProfileFieldsAction(), calculateProfileScore(), formatINR()

### Community 35 - "Reportgeneratorclient Tsx Module"
Cohesion: 0.33
Nodes (5): chartConfig, MetricRow, Periodicity, Props, ReportType

### Community 36 - "Icon Tsx Module"
Cohesion: 0.33
Nodes (4): alt, contentType, runtime, size

### Community 37 - "Temp Check Module"
Cohesion: 0.33
Nodes (4): { createClient }, dotenv, path, supabase

### Community 38 - "Temp Refactor Module"
Cohesion: 0.33
Nodes (5): content, fs, path, startIdx1, startIdx2

### Community 39 - "Route Fetchallsupabase() Module"
Cohesion: 0.70
Nodes (4): fetchAllSupabase(), firstDayOfMonth(), POST(), upsertInBatches()

### Community 40 - "Zoom Createzoommeeting() Module"
Cohesion: 0.60
Nodes (4): createZoomMeeting(), getZoomAccessToken(), testZoomConnection(), ZoomMeetingOptions

### Community 41 - "Followupsclient() Page Module"
Cohesion: 0.67
Nodes (3): FollowUpsClient(), FollowUpsPage(), getFollowUpsData()

### Community 42 - "Temp Refactor Module"
Cohesion: 0.50
Nodes (3): content, fs, returnStart

## Knowledge Gaps
- **248 isolated node(s):** `supabase`, `supabase`, `$schema`, `style`, `rsc` (+243 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `React Next Module` to `Tsx Sidebar Module`, `@types Eslint Module`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Tsx Page Module` to `Tsx Page Module`, `Alumnidetailclient() Workspaceclient() Module`, `Tsx Table Module`, `Route Get() Module`, `Followupsclient() Page Module`, `Tsx Layout Module`, `Tsx Default Module`, `Import Route Module`, `Tsx Breadcrumb Module`, `Page Tsx Module`, `Overridable Route Module`, `Permissions Rolepermissiondata Module`, `Tsx Settingsclient() Module`, `Tsx Page Module`, `Page Tsx Module`, `Route Get() Module`, `Route Post() Module`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Why does `cn()` connect `Tsx Cardaction() Module` to `Tsx Page Module`, `Tsx Sidebar Module`, `Tsx Page Module`, `Tsx Table Module`, `Tsx User Module`, `Tsx Edit Module`, `Mentor Form Module`, `Tsx Default Module`, `Tsx Breadcrumb Module`, `Tsx Chartconfig Module`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **What connects `supabase`, `supabase`, `$schema` to the rest of the system?**
  _248 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Tsx Page Module` be split into smaller, more focused modules?**
  _Cohesion score 0.051683153132428494 - nodes in this community are weakly interconnected._
- **Should `Tsx Page Module` be split into smaller, more focused modules?**
  _Cohesion score 0.06530825496342738 - nodes in this community are weakly interconnected._
- **Should `Tsx Sidebar Module` be split into smaller, more focused modules?**
  _Cohesion score 0.09725158562367865 - nodes in this community are weakly interconnected._