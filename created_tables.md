# Created Tables Log

This file documents all the tables created in the Supabase database for the NGConnect project.

## 1. `ng_campuses`
Stores the campus locations and their current operational status.

- **Columns**:
  - `id` (UUID): Primary key, default `gen_random_uuid()`.
  - `name` (VARCHAR): Unique, name of the campus.
  - `status` (VARCHAR): Current status of the campus (`active` or `closed`).
  - `created_at` (TIMESTAMPTZ): Creation timestamp.
- **RLS Policies**:
  - Authenticated users can select (view) all campuses.
  - No public write access (only database admin/migrations).

---

## 2. `highest_education`
Stores the available options for highest level of education.

- **Columns**:
  - `id` (UUID): Primary key, default `gen_random_uuid()`.
  - `name` (VARCHAR): Unique, education level description.
  - `created_at` (TIMESTAMPTZ): Creation timestamp.
- **RLS Policies**:
  - Authenticated users can select (view) all levels.
  - No public write access.

---

## 3. `ng_courses`
Stores the courses which correspond to the school departments.

- **Columns**:
  - `id` (UUID): Primary key, default `gen_random_uuid()`.
  - `name` (VARCHAR): Unique, name of the course/school (`School of Programming`, `School of Business`, or `School of Finance`).
  - `created_at` (TIMESTAMPTZ): Creation timestamp.
- **RLS Policies**:
  - Authenticated users can select (view) all courses.
  - No public write access.



---

## 4. `import_batches`
Tracks every CSV/XLSX file imported from GHAR.

- **Columns**: `id` (UUID PK), `file_name`, `file_type` (`csv`/`xlsx`), `file_size`, `uploaded_by` (FK → auth.users), `uploaded_by_name`, `uploaded_at`, `records_processed`, `records_created`, `records_updated`, `records_failed`, `status` (`processing`/`completed`/`failed`/`rolled_back`), `notes`.
- **RLS**: Super Admin full access. Manager/Admin read-only. Alumni no access.

---

## 5. `alumni_master`
Source-of-truth for GHAR-imported alumni data. Immutable except by imports or Super Admin.

- **Primary Key**: `email` (TEXT) — org-issued, immutable, the stable identity anchor across all imports.
- **Columns**: `name`, `phone_number`, `gender`, `city`, `state`, `campus`, `course`, `entry_year`, `technology_stack`, `donor`, `cycle`, `company`, `starting_position`, `starting_salary`, `month_of_placement`, `year_of_placement`, `linkedin_profile`, `status`, `dropout_date`, `reason`, `import_batch_id` (FK), `created_at`, `updated_at`.
- **Status values**: `Active`, `Placed`, `DropOut`, `Intern (Out Campus)`, `Intern (In Campus)`, `Completed`, `Completed-Opted out for placement`, `InActive`.
- **RLS**: All authenticated users read. Super Admin full write.
- **Triggers**: `trg_audit_alumni_master` (audit log on every change), `trg_updated_at_alumni_master`.

---

## 6. `alumni_profile`
Alumni self-service profile data. Never overwritten by imports.

- **Columns**: `id` (UUID PK), `alumni_email` (TEXT UNIQUE FK → alumni_master(email)), `phone_number`, `city`, `state`, `profile_photo` (Storage URL), `highest_education`, `batch_year`, `bio`, `skills` (TEXT[]), `linkedin_profile`, `github_profile`, `current_company`, `current_role`, `current_salary`, `career_progression` (JSONB), `mentoring_interests` (TEXT[]), `created_at`, `updated_at`, `updated_by` (FK → auth.users).
- **RLS**: Member (Alumni) can insert/update own row (Google OAuth email match). Super Admin full access. Others read-only.
- **Triggers**: `trg_audit_alumni_profile`, `trg_updated_at_alumni_profile`.

---

## 7. `import_batch_records`
Per-row import activity log — one record per alumni per import attempt.

- **Columns**: `id` (UUID PK), `import_batch_id` (FK → import_batches), `alumni_email` (FK → alumni_master(email)), `action` (`created`/`updated`/`skipped`/`failed`), `status` (`success`/`error`), `error_message`, `created_at`.
- **RLS**: Super Admin full access. Manager/Admin read-only.

---

## 8. `audit_log`
Permanent, append-only change history for all alumni data. Supports rollback.

- **Columns**: `id` (UUID PK), `table_name`, `record_id` (TEXT — email for alumni_master, UUID for others), `field_name`, `old_value`, `new_value`, `action_type` (`INSERT`/`UPDATE`/`DELETE`/`IMPORT`/`RESTORE`), `changed_by_user_id`, `changed_by_name`, `changed_by_role`, `changed_at`, `ip_address`.
- **RLS**: No UPDATE or DELETE policies (append-only). Super Admin and internal roles can SELECT. All writes use the service-role client.

---

## 9. `coursera_removal_log`
One row per learner removal attempt made by Coursera Prune Inactive (`/data-management/coursera/prune`).

- **Columns**: `id` (UUID PK), `run_id` (UUID, FK → `coursera_prune_runs.id`), `removed_at`, `removed_by` (FK → `auth.users`), `mode` (`inactive_days`/`free_seats`), `threshold` (days or seats), `email`, `external_id`, `full_name`, `last_seen_at`, `last_seen_source`, `days_inactive`, `courses_count`, `soft_delete`, `success`, `outcome` (`removed`/`failed`/`spared`), `message`.
- **Indexes**: unique (`run_id`, `email`) — each member is handled at most once per run.
- **RLS**: Enabled with no policies — service-role only. Reads go through `/api/coursera/prune-inactive/removals` (RBAC `data_management.coursera_prune` view).

---

## 10. `coursera_prune_runs`
Log of every prune-tool action: refreshes (scans), saved prune lists (previews, with their full candidate list, usable for 7 days), and prunes (executions, run in batches and resumable).

- **Columns**: `id` (UUID PK), `kind` (`scan`/`preview`/`execute`), `created_at`, `created_by`, `created_by_email`, `mode`, `threshold` (CHECK: ≥ 90 when `mode = 'inactive_days'`), `grace_days`, `soft_delete`, `total_members`, `eligible_members`, `candidate_count`, `succeeded`, `failed`, `spared`, `preview_id` (execution → preview), `executed_run_id` (preview → execution; makes each preview single-use), `status` (`running`/`done`/`failed` for scans and executions), `checked_count`, `completed_at`, `step_lock_until` (short lease so only one request processes a batch), `details` (JSONB).
- **Indexes**: unique `preview_id` for `kind = 'execute'`, so a preview can only be executed once.
- **RLS**: Enabled with no policies — service-role only.

---

## 11. `coursera_prune_protected`
Accounts that prune runs must never remove (staff, test accounts).

- **Columns**: `email` (TEXT PK, lower-case), `note`, `added_at`, `added_by` (FK → `auth.users`), `added_by_email`.
- **RLS**: Enabled with no policies — service-role only. Managed from the prune page (RBAC `data_management.coursera_prune` edit).

---

## 12. `coursera_prune_scan_members`
One row per program member in a refresh (scan). The member list is stored up front; each member's activity is then checked live a batch per request, so no request hits the platform timeout and a stopped refresh can resume.

- **Columns**: `scan_id` (UUID, FK → `coursera_prune_runs.id`, cascade delete), `external_id`, `email`, `full_name`, `joined_at`, `checked_at` (null = not checked yet), `attempts`, `lookup_ok` (false = Coursera never answered after 3 tries), `latest_activity_at`, `earliest_enrollment_at`, `courses_count`. Primary key (`scan_id`, `external_id`).
- **Indexes**: partial index on `scan_id` where `checked_at is null` (next batch lookup).
- **RLS**: Enabled with no policies — service-role only.
