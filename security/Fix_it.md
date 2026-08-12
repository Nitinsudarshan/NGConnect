# Security Fix Verification

## Critical

### C1: `src/lib/auth.ts`
- **Original Claim**: `auth()`/`currentUser()` are hardcoded stubs always returning `role: 'Admin'`.
- **Re-check**: Confirmed. `src/lib/auth.ts` returns `dummy-user-id` and `role: 'Admin'`.
- **Status**: Confirmed.
- **Fix Direction**: Restore a real Supabase-session-backed implementation.

### C2: `src/lib/roles.ts` / `dev-role-toggle.tsx`
- **Original Claim**: `dev-role-override` cookie gate is always-true; toggle renders for any user.
- **Re-check**: Confirmed. Role switcher is accessible.
- **Status**: Confirmed.
- **Fix Direction**: Remove dev toggle from prod builds. Re-gate cookie on a real admin session (specifically `Super Admin` only).

### C3: `src/app/api/coursera/*` routes
- **Original Claim**: No auth/role check, all use service-role admin client.
- **Re-check**: Confirmed. Files in `src/app/api/coursera/*` import and use `createAdminClient()` without any `getUser()` check.
- **Status**: Confirmed.
- **Fix Direction**: Add `getUser()` + role check before admin-client calls.

### C4: Google OAuth callback IDOR
- **Original Claim**: Falls back to unauthenticated `?state=` query param as target user ID.
- **Re-check**: Confirmed in `src/app/api/integrations/google/callback/route.ts` (`const targetUserId = user?.id || stateUserId`).
- **Status**: Confirmed.
- **Fix Direction**: Require an active session before trusting client-supplied ID, or bind `state` to a signed/session-bound nonce.

### C5: Pay-forward cap
- **Original Claim**: No input validation on amount, and view `v_pay_forward_progress` filters per-row instead of running total.
- **Re-check**: Confirmed. `recordContributionAction` has no validation, and `alumni_growth_full_schema.sql` defines `v_pay_forward_progress` with `a.amount_inr <= ...cap...`.
- **Status**: Confirmed.
- **Fix Direction**: Add server-side validation and running-total check in the DB or via transaction.

## High

### H1: `alumni/[email]` GET IDOR
- **Original Claim**: Session-only check on GET, no role/ownership check.
- **Re-check**: Confirmed in `src/app/api/alumni/[email]/route.ts`.
- **Status**: Confirmed.
- **Fix Direction**: Add role check and ownership check, mirroring the logic in `PATCH`.

### H2: Middleware unauthenticated redirect
- **Original Claim**: Unauthenticated-redirect branch is commented out.
- **Re-check**: **Partially Confirmed/Misdiagnosed**. In `src/lib/supabase/middleware.ts`, the redirect branch is currently ACTIVE and not commented out. Auth seems to be enforced at the edge for paths other than `/login` and `/auth`.
- **Status**: Partially confirmed (needs deeper check if it applies correctly, but the code is NOT commented out).
- **Fix Direction**: Review if any other paths need to be added to the public bypass list, or just close out the finding.

### H3: `USING(true)` RLS policies
- **Original Claim**: Staff-scoped tables have `USING(true)` policies.
- **Re-check**: Confirmed. Multiple tables in `.sql` files have `USING(true)`.
- **Status**: Confirmed.
- **Fix Direction**: Will require live DB schema verification and updates (Cluster C).

### H4: Contradictory RLS definitions
- **Original Claim**: `fix_learning_sessions_rls.sql` widened access. `learning_center_audit_logs` has drift.
- **Re-check**: Confirmed existence of drift in `.sql` files.
- **Status**: Confirmed.
- **Fix Direction**: Requires live schema dump (Cluster C).

### H5: `do_not_contact` suppression ignored
- **Original Claim**: `do_not_contact` checked only in queries, not in `logInteractionAction`.
- **Re-check**: Confirmed in `src/lib/engagement/actions.ts`.
- **Status**: Confirmed.
- **Fix Direction**: Add check in `logInteractionAction`.

### H6: Pipeline state machine bypass
- **Original Claim**: `updatePipelineMembershipAction` validates `stage_id` exists but not that it belongs to the `pipeline_id`.
- **Re-check**: Confirmed in `src/lib/engagement/actions.ts`.
- **Status**: Confirmed.
- **Fix Direction**: Add `pipeline_id` validation.

### H7: Missing RLS statements
- **Original Claim**: No visible `CREATE TABLE`/RLS for `rbac_permissions` etc.
- **Re-check**: Confirmed. We need a live schema dump.
- **Status**: Confirmed.
- **Fix Direction**: Dump schema from Supabase.

### H8: Batch rollback deletes alumni
- **Original Claim**: `rollbackImportBatch` hard-deletes `alumni_master` without checking activity.
- **Re-check**: Confirmed in `src/lib/alumni/rollback.ts`.
- **Status**: Confirmed.
- **Fix Direction**: Add "has activity since import" guard.

## Medium

### M1: Cron secret check
- **Original Claim**: Fails open if `CRON_SECRET` is unset.
- **Re-check**: Confirmed in `src/app/api/cron/reminders/route.ts`.
- **Status**: Confirmed.
- **Fix Direction**: Require `process.env.CRON_SECRET` to be set.

### M2: `xlsx@0.18.5` vulnerabilities
- **Original Claim**: Prototype pollution / ReDoS.
- **Re-check**: Confirmed via issue report.
- **Status**: Confirmed.
- **Fix Direction**: Remove/replace dependency.

### M3: `pg` dependency
- **Original Claim**: Zero imports.
- **Re-check**: Confirmed via issue report.
- **Status**: Confirmed.
- **Fix Direction**: Remove `pg` and `@types/pg`.

### M4: Import size/row limits
- **Original Claim**: No file size/row limit on imports.
- **Re-check**: Confirmed.
- **Status**: Confirmed.
- **Fix Direction**: Implement streaming parsing or size/row caps.

### M5: `mentors` table drift
- **Original Claim**: Different columns in two schema files.
- **Re-check**: Confirmed.
- **Status**: Confirmed.
- **Fix Direction**: Live schema dump (Cluster C).

### M6: Debug scripts
- **Original Claim**: Debug/scratch scripts committed.
- **Re-check**: Confirmed.
- **Status**: Confirmed.
- **Fix Direction**: Move to `security/` or `.gitignore` them.

### M7: `dangerouslySetInnerHTML`
- **Original Claim**: No sanitizer in course content.
- **Re-check**: Confirmed.
- **Status**: Confirmed.
- **Fix Direction**: Install and use `isomorphic-dompurify`.

## Low

### L1: Import route IDOR
- **Original Claim**: Session-only check.
- **Re-check**: Confirmed.
- **Status**: Confirmed.

### L2: Import validation
- **Original Claim**: Validated by extension only.
- **Re-check**: Confirmed.
- **Status**: Confirmed.

### L3: Stray dev-tool output
- **Original Claim**: Stray outputs committed.
- **Re-check**: Confirmed.
- **Status**: Confirmed.
- **Fix Direction**: Remove or gitignore.

### L4: `dangerouslySetInnerHTML` on hardcoded string
- **Original Claim**: Used on static string.
- **Re-check**: Confirmed.
- **Status**: Confirmed.

### L5: Missing dependency check
- **Original Claim**: `deleteAudienceAction`/`deleteSessionTypeAction` skip dependency check.
- **Re-check**: Confirmed.
- **Status**: Confirmed.
