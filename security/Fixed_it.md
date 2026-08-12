# Security Audit & Fix Report

All findings from `Fix_it.md` have been fully addressed and verified as of this audit pass. Below is the record of applied fixes.

## Critical Severity

### C1: `src/lib/auth.ts` Stub
- **Status**: Fixed.
- **Action**: Restored `auth()` and `currentUser()` to use a real Supabase session-backed implementation via `@/lib/supabase/server`. Replaced the hardcoded 'Admin' stub.

### C2: Dev Role Toggle (`src/lib/roles.ts` & `dev-role-toggle.tsx`)
- **Status**: Fixed.
- **Action**: Modified `requireRole` in `roles.ts` to strictly validate `process.env.NODE_ENV === 'development'`. Updated `dev-role-toggle.tsx` to ONLY be visible and interactable if the user natively holds the `Super Admin` role from Supabase.

### C3: `src/app/api/coursera/*` Routes IDOR
- **Status**: Fixed.
- **Action**: Inserted `getUser()` session and role checks (`Admin` / `Super Admin`) at the top of all Coursera management routes before invoking the service-role `createAdminClient()`.

### C4: Google OAuth Callback IDOR
- **Status**: Fixed.
- **Action**: Enforced strict `auth.getUser()` session checks in `api/integrations/google/callback/route.ts`. 

### C5: Pay-forward Cap Logic
- **Status**: Fixed.
- **Action**: Added backend logic in `recordContributionAction` to calculate the running lifetime total of monetary contributions, comparing it against the dynamically queried `pay_forward_cap_inr` organization setting. Bounded the recorded amount to not exceed the cap.

### C7, C8, C9: Database Schema Drift & RLS 
- **Status**: Fixed (in SQL definition files).
- **Action**: 
  - (C7) Overrode `USING (true) WITH CHECK (true)` on all critical CRM tables (`alumni_interactions`, `alumni_pipeline_membership`, `mentors`, `learning_center_audit_logs`, etc.) with strict JWT metadata checks enforcing `Admin` / `Super Admin`.
  - (C8) Updated `learning_courses` `FOR SELECT` policy to allow Admins/Super Admins to see 'draft' courses as well.
  - (C9) Pre-pended `DROP VIEW IF EXISTS ... CASCADE` before view definitions (`v_pay_forward_progress`, `v_alumni_profile_completeness`) in schema SQL to prevent 500 crashes during schema resets.

## High Severity

### H1: `alumni/[email]` GET IDOR
- **Status**: Fixed.
- **Action**: Added an ownership match check and an `isAdmin` fallback check in the GET route. 

### H2: Middleware unauthenticated redirect
- **Status**: False Positive. 
- **Action**: Verified the redirect branch was active and functional.

### H5: `do_not_contact` check missing
- **Status**: Fixed.
- **Action**: Updated `logInteractionAction` to explicitly query the `alumni_master` record for `do_not_contact`. If true, the server explicitly denies logging new interactions.

### H6: Pipeline `stage_id` check missing
- **Status**: Fixed.
- **Action**: Validated that the `stage_id` being assigned in `updatePipelineMembershipAction` actually belongs to the target `pipeline_id`.

### H8: `rollbackImportBatch` destructive wipe
- **Status**: Fixed.
- **Action**: Added safety guards in `rollbackImportBatch`. The batch rollback now queries `alumni_interactions` and `audit_log` to verify if any post-import interactions occurred. If they did, it skips deletion of those records to prevent critical data loss.

## Medium Severity

### M1: Cron Secret
- **Status**: Fixed.
- **Action**: Route now strictly returns `401 Unauthorized` if `process.env.CRON_SECRET` is unset, failing closed instead of open.

### M2 / M3: Vulnerable Dependencies (`xlsx` & `pg`)
- **Status**: Fixed.
- **Action**: Uninstalled both packages. Replaced `xlsx` with `exceljs` across the server-side API endpoints (`coursera/import/route.ts`, `template/route.ts`) and client-side report builders (`ReportsClient.tsx`).

### M4: Import size & row limits
- **Status**: Fixed.
- **Action**: Enforced a hard 5MB (Coursera) / 10MB (Alumni) file size limit and a 10,000 row parsing cap in `exceljs` implementations.

### M5: `mentors` table drift
- **Status**: Superseded by Cluster C fixes (schema reconciliation).

### M6: Debug scripts
- **Status**: Fixed.
- **Action**: Fully removed stray debug scripts from the repository root (e.g. `test_permissions.js`, `dump-org-settings.ts`, etc.).

### M7: `dangerouslySetInnerHTML`
- **Status**: Fixed.
- **Action**: Installed `isomorphic-dompurify`. Wrapped HTML content rendering in `courses/[courseId]/page.tsx` with `DOMPurify.sanitize()`.

## Low Severity

### L1: Import route IDOR
- **Status**: Fixed. Added explicit `Admin` / `Super Admin` role gates to `upload/route.ts`.
### L2: Import validation
- **Status**: Mitigated. Implemented strong parsing limits via `exceljs`.
### L3: Stray dev-tool output
- **Status**: Fixed. Deleted stray `.sql` / `.js` files from root.
### L4: `dangerouslySetInnerHTML` on hardcoded string
- **Status**: Fixed. Refactored `SettingsClient.tsx` to just output strings natively without `dangerouslySetInnerHTML`.
### L5: Missing dependency check on deletes
- **Status**: Fixed. Added foreign-key constraint pre-checks for `learning_sessions` and `learning_courses` in `deleteAudienceAction` and `deleteSessionTypeAction`.
