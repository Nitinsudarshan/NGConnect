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

## RLS Remediation (Phase 2 Plan)

### Phase 1 Answers
1. **RLS Enabled Status:** `rowsecurity: true` confirmed for all tables listed (alumni_interactions, alumni_master, coursera_*, etc.).
2. **is_super_admin / is_member Definitions:**
   - `is_member()`: `SELECT ((auth.jwt() -> 'app_metadata' ->> 'role') = 'Member')`
   - `is_super_admin()`: `SELECT (auth.jwt() ->> 'email' IN ('nitin@navgurukul.org', 'nitinsudarshan@gmail.com') OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')`
3. **Coursera tables existence:** `coursera_metrics`, `coursera_monthly_metrics`, and `coursera_compliance_audit` DO NOT exist in the live database. (Finding moot).
4. **Relevant FK Constraints:** 
   - `alumni_profile`, `alumni_interactions`, `pay_forward_contributions`, `alumni_salary_records`, `alumni_pipeline_membership` all CASCADE delete to `alumni_master`.
   - `mentoring_sessions` SET NULL on mentor delete, but CASCADE to `alumni_pipeline_membership`.

### Planned SQL Statements

**1. alumni_interactions, alumni_salary_records, pay_forward_contributions, mentoring_sessions, mentoring_attendance**
Currently `ALL true/true`. Change: Limit ALL access to Staff roles.
```sql
-- Repeat for each of the 5 tables (example: alumni_interactions)
DROP POLICY IF EXISTS "Allow authenticated interactions" ON alumni_interactions;
CREATE POLICY "staff_all_alumni_interactions" ON alumni_interactions
  FOR ALL TO authenticated
  USING (is_super_admin() OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Manager'::text, 'Operator'::text, 'Admin'::text])))
  WITH CHECK (is_super_admin() OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Manager'::text, 'Operator'::text, 'Admin'::text])));
```

**2. mentors**
Currently `ALL true/true` (plus redundant owner policies). Change: Limit ALL access to Staff, allow authenticated users to SELECT (for viewing mentors), and keep owner-only INSERT/UPDATE.
```sql
DROP POLICY IF EXISTS "Allow authenticated mentors" ON mentors;
-- 'Authenticated users can read mentors' (SELECT true) is already present.
-- 'allow_mentor_insert_for_owner' and 'allow_mentor_update_for_owner' are already present.
CREATE POLICY "staff_all_mentors" ON mentors
  FOR ALL TO authenticated
  USING (is_super_admin() OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Manager'::text, 'Operator'::text, 'Admin'::text])))
  WITH CHECK (is_super_admin() OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Manager'::text, 'Operator'::text, 'Admin'::text])));
```

**3. learning_center_audit_logs**
Currently `ALL true/true`, `INSERT true`, `SELECT true`. Change: Limit SELECT and INSERT to Staff.
```sql
DROP POLICY IF EXISTS "Allow authenticated lc_audit_logs" ON learning_center_audit_logs;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON learning_center_audit_logs;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON learning_center_audit_logs;
CREATE POLICY "staff_all_lc_audit_logs" ON learning_center_audit_logs
  FOR ALL TO authenticated
  USING (is_super_admin() OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Manager'::text, 'Operator'::text, 'Admin'::text])));
```

**4. alumni_master & alumni_profile**
Currently `SELECT true`. Change: Restrict SELECT to staff OR the member themselves.
```sql
DROP POLICY IF EXISTS "alumni_master_select_all" ON alumni_master;
CREATE POLICY "alumni_master_select_staff_or_self" ON alumni_master
  FOR SELECT TO authenticated
  USING (
    is_super_admin() 
    OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Manager'::text, 'Operator'::text, 'Admin'::text]))
    OR (is_member() AND email = (auth.jwt() ->> 'email'::text))
  );

DROP POLICY IF EXISTS "alumni_profile_select_all" ON alumni_profile;
CREATE POLICY "alumni_profile_select_staff_or_self" ON alumni_profile
  FOR SELECT TO authenticated
  USING (
    is_super_admin() 
    OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Manager'::text, 'Operator'::text, 'Admin'::text]))
    OR (is_member() AND alumni_email = (auth.jwt() ->> 'email'::text))
  );
```

**5. org_settings**
Currently `ALL true/true`. Change: SELECT for all authenticated, ALL for Super Admin/Admin.
```sql
DROP POLICY IF EXISTS "Allow authenticated org_settings" ON org_settings;
CREATE POLICY "org_settings_select_all" ON org_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "org_settings_write_admin" ON org_settings 
  FOR ALL TO authenticated 
  USING ((((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Super Admin'::text, 'Admin'::text])))
  WITH CHECK ((((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Super Admin'::text, 'Admin'::text])));
```

**6. pipeline_stages & contribution_types**
Currently `ALL true/true`. Change: SELECT for all authenticated, ALL for Admin/Super Admin.
```sql
DROP POLICY IF EXISTS "Allow authenticated pipeline_stages" ON pipeline_stages;
CREATE POLICY "pipeline_stages_select_all" ON pipeline_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "pipeline_stages_write_admin" ON pipeline_stages 
  FOR ALL TO authenticated 
  USING ((((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Super Admin'::text, 'Admin'::text])));

DROP POLICY IF EXISTS "Allow authenticated contribution_types" ON contribution_types;
CREATE POLICY "contribution_types_select_all" ON contribution_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "contribution_types_write_admin" ON contribution_types 
  FOR ALL TO authenticated 
  USING ((((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Super Admin'::text, 'Admin'::text])));
```

**7. Coursera Hardcoded Emails (coursera_learner_month, coursera_computed_metrics, coursera_snapshots, coursera_config, coursera_import_log)**
Change: Remove hardcoded emails from the `Admins only` SELECT policy.
```sql
-- Repeat for each of the 5 coursera tables
DROP POLICY IF EXISTS "Admins only" ON coursera_learner_month;
CREATE POLICY "Admins only" ON coursera_learner_month
  FOR SELECT TO authenticated
  USING ((((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Admin'::text, 'Super Admin'::text])));
```

**8. RBAC Tables (rbac_permissions, role_permissions, rbac_audit_logs)**
Currently `SELECT true`. *Waiting for decision on read-scope.* 
For `rbac_audit_logs`, dedupe policies:
```sql
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON rbac_audit_logs;
-- Will update "Allow read access for authenticated users" based on decision.
```
