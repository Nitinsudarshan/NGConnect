# RBAC Audit — Unmoderated Surfaces

Everything listed here is **reachable today without an RBAC allocation**. Nothing
below has been closed: each entry is left working exactly as it was, so this list
is a decision queue, not a changelog.

For each item: **who can reach it now**, and the **suggested resource** to gate it
with. Write your call in the _Decision_ column (`gate as suggested` / `leave open` /
`gate as <other resource>`) and I will implement it.

Audited at `v1.09.02` against the seeded matrix in
`supabase/migrations/20260816000003_*` and `20260918000001_*`.
Decisions applied in `v1.09.03` are marked **DONE** with what was actually done;
everything still blank is waiting on you.

**Standing rule from the first review round:** gate what is destructive. A read
that a role can already reach through the UI is not gated on its own; an action
that writes, deletes, or hands out credentials is.

**Standing rule for the Member tier:** `Member` is moderated more tightly than
every other role. The engine caps it at read-only — `edit` and `delete` are
refused for members on every resource regardless of what the matrix says — and
staff-only reads refuse members explicitly. Member self-service (own profile,
own watch progress, own feedback, own requests) binds to the session identity
and is unaffected.

---

## A. Pages reachable by every signed-in user

| # | Surface | Who reaches it now | Suggested resource | Decision |
|---|---|---|---|---|
| A1 | `/profile` | Everyone incl. Member | **Leave open** — a user's own profile | |
| A2 | `/engagement/*`, `/pay-forward/*`, `/reports` | Everyone | **Leave open** — redirect stubs; the canonical routes are gated | |
| A3 | `/learning-center/sessions/[id]/feedback` | Everyone | **Leave open** — attendees submit session feedback | |

## B. API routes with no permission check

| # | Route | Who reaches it now | Suggested resource | Decision |
|---|---|---|---|---|
| B1 | `GET /api/feedback` | Any signed-in user sees their own; **Admin / Super Admin see everyone's** (hardcoded, not in the matrix) | New resource `manage.feedback` (view), or reuse `manage.reports` | |
| B2 | `POST /api/feedback` | Everyone | `general.feedback` view | |
| B3 | `GET /api/learning-center/coursera-status` | Everyone | **Leave open** — returns the caller's own Coursera status | |
| B4 | `POST /api/user/heartbeat` | Everyone | **Leave open** — presence ping for the caller | |
| B5 | `GET /api/integrations/google/auth` + `/callback` | ~~Any signed-in user~~ → `learning_center.settings.integrations` edit | `learning_center.settings.integrations` edit | **DONE** — both halves gated; writes a credential, so destructive |
| B6 | `GET /api/notifications/unsubscribe`, `/track/[token]/pixel.gif` | Public, unauthenticated by design (email links) | **Leave open** | |
| B7 | `/api/cron/reminders`, `/api/notifications/nightly-rollup`, `/api/notifications/process-queue` | `CRON_SECRET` bearer only | **Leave open** — machine endpoints, no user context | |

## C. Server actions with no permission check

Server actions are callable directly by anyone signed in — hiding the button that
calls one is not access control.

| # | Action | What it does | Suggested resource | Decision |
|---|---|---|---|---|
| C1 | `updateAlumniProfileFieldsAction` | Writes fields on any alumni record | `crm.alumni_profile` edit | **DONE** |
| C2 | `updatePipelineMembershipAction` | Adds/removes an alumnus from a pipeline | `crm.pipelines.*` edit (per pipeline) | **DONE** — resolves `crm.pipelines.${pipeline_code}` |
| C3 | `recordContributionAction` | Records a contribution against an alumnus | `crm.workspace` edit | **DONE** |
| C4 | `completeFollowupAction` | Closes a follow-up | `crm.follow_ups` edit | **DONE** |
| C5 | `transferPocAction` | Reassigns lead ownership | per-pipeline edit | **DONE** — gated on the pipeline being transferred; the owner-or-Admin rule still applies on top |
| C6 | `assignToMeAction` | Claims an unassigned alumnus | per-pipeline edit | **DONE** — gated on the pipeline being claimed |
| C7 | `getCallReasonsAction`, `getPipelineEligibleStaffAction` | Read config lists / staff directory | — | **DONE (partial)** — not destructive, so left open to staff; members are refused (the staff directory leaked internal emails to the member tier) |
| C8 | `saveWatchProgressAction` | Saves the caller's own video progress | **Leave open** | |
| C9 | `getCategorySessionCountAction`, `getSubcategorySessionCountAction` | Read counts for the settings UI | `learning_center.settings.session_categories` view | |
| C10 | `fetchExternalTextAction` | Server-side fetch of a caller-supplied URL | `learning_center.recordings` view + target filter | **DONE (adjusted)** — the session playback modal calls this to load transcripts, so an edit gate would break member playback. Gated at `learning_center.recordings` view, and localhost / link-local / RFC1918 / non-HTTP targets are now refused |
| C11 | `logLearningCenterActivity`, `logIntegrationAction` | Append a row to the audit log | **Leave open** or `learning_center.settings.edit_log` edit — note a caller can currently forge audit entries | |
| C12 | `getProfileData`, `saveProfileData` | The caller's own profile | **Leave open** | |
| C13 | All 21 exports in `lib/learning-center/queries.ts` | Read Learning Center data (sessions, mentors, audit logs, Coursera config) | `learning_center.*` view per query | |

## D. Matrix bypasses — allocation exists but can be skipped

| # | Surface | Bypass | Suggested change | Decision |
|---|---|---|---|---|
| D1 | `logInteractionAction`, `getKanbanColumnCardsAction`, `getKanbanBoardCardsAction`, `getPipelineListViewAction` | `!hasAccess && role !== 'Admin' && role !== 'Super Admin'` — Admin and Super Admin pass even if the matrix revokes `crm.workspace` | Drop the role clause; Super Admin already bypasses inside `checkAccess` | |
| D2 | `impersonateUser` | Requires `manage.users` edit **and** the role hierarchy; the hierarchy itself is hardcoded in `ROLE_HIERARCHY` | **Leave as is** — hierarchy is a safety rail, not a permission | |
| D3 | Super Admin email allowlist in `lib/roles.ts` | Two hardcoded addresses always resolve to Super Admin regardless of the matrix | **Leave as is** — break-glass access | |

## E. Cosmetic role checks (UI only, no data exposure)

| # | Surface | Behaviour | Suggested change | Decision |
|---|---|---|---|---|
| E1 | Sidebar Coursera / Pay-Forward banners | Shown only to `Member` | Leave — member-facing promos | |
| E2 | Changelog footer | Hidden from `Member` | Leave, or gate on `general.docs` | |
| E3 | Header help trigger | Different copy for `Member` | Leave | |
| E4 | Content Hub nav label | "Learning Hub" for Member/Viewer, "Content Hub" otherwise | Leave — wording only | |
| E5 | RBAC matrix user list | Lists staff only (excludes Member and Super Admin) | Leave, or list everyone | |
| E6 | Alumni Network page | Lists users whose role is `Member` and team is Alumni Growth / PNC / None | Leave — a data filter, not a gate | |


---

## Applied in v1.09.03

- **B5** — Google Meet OAuth (both the start and the callback that stores the
  token) requires `learning_center.settings.integrations` edit.
- **C1–C6** — every destructive CRM write resolves through the matrix; the three
  pipeline-scoped ones check the pipeline they touch, so a Program user with
  mentoring but not pay-forward is stopped at the right boundary.
- **C7** — left open to staff (reads, not destructive); members refused.
- **C10** — gated at recordings view, plus an internal-target filter, rather
  than the edit right originally suggested. See the row for why.
- **Member tier** — `READ_ONLY_ROLES` in `src/lib/permissions.ts` caps members
  at view across `checkAccess`, `checkAnyAccess`, `getUserPermissions` and
  `getAllPermissions`. The RBAC matrix disables the edit and delete boxes for
  the Member role and says why, so nobody ticks a box the engine will ignore.
