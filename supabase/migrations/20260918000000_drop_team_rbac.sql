-- ============================================================
-- Migration: 20260918000000_drop_team_rbac.sql
-- Retire TEAM-based RBAC
-- ============================================================
-- Permissions are now resolved on two tiers only:
--   1. Individual user override (subject_type = 'user')
--   2. Role default          (subject_type = 'role')
--
-- The team tier ('CEO's Office', 'Alumni Growth', 'PNC', 'Finance', 'None')
-- conflicted with role defaults and made effective access hard to reason
-- about, so it is removed from the permission engine entirely.
--
-- NOTE: `team` remains a purely organisational attribute on a user's
-- metadata (used for directory / reporting purposes). It simply no longer
-- grants or revokes any access.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Archive existing team rows before deleting them
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rbac_permissions_team_backup (
  id UUID PRIMARY KEY,
  resource_id TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT FALSE,
  can_edit BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rbac_permissions_team_backup ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to rbac_permissions_team_backup for service role"
  ON public.rbac_permissions_team_backup;

CREATE POLICY "Allow all access to rbac_permissions_team_backup for service role"
  ON public.rbac_permissions_team_backup
  FOR ALL
  TO service_role
  USING (true);

INSERT INTO public.rbac_permissions_team_backup
  (id, resource_id, subject_type, subject_id, can_view, can_edit, can_delete, created_at, updated_at)
SELECT id, resource_id, subject_type, subject_id, can_view, can_edit, can_delete, created_at, updated_at
FROM public.rbac_permissions
WHERE subject_type = 'team'
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Record the drop in the RBAC audit log (best effort)
-- ------------------------------------------------------------
DO $$
DECLARE
  team_row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO team_row_count
  FROM public.rbac_permissions
  WHERE subject_type = 'team';

  IF to_regclass('public.rbac_audit_logs') IS NOT NULL AND team_row_count > 0 THEN
    -- The snapshot column may be json or jsonb depending on how the table was
    -- provisioned, so pass an untyped literal and let Postgres coerce it.
    EXECUTE format(
      'INSERT INTO public.rbac_audit_logs (changed_by, snapshot) VALUES (%L, %L)',
      'system (migration 20260918000000_drop_team_rbac)',
      format(
        '{"type":"team_rbac_dropped","count":%s,"backup_table":"public.rbac_permissions_team_backup"}',
        team_row_count
      )
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Skipped RBAC audit log entry for team drop: %', SQLERRM;
END $$;

-- ------------------------------------------------------------
-- 3. Delete the team rows
-- ------------------------------------------------------------
DELETE FROM public.rbac_permissions
WHERE subject_type = 'team';

-- ------------------------------------------------------------
-- 4. Prevent new team rows from ever being written again
-- ------------------------------------------------------------
ALTER TABLE public.rbac_permissions
  DROP CONSTRAINT IF EXISTS rbac_permissions_subject_type_check;

ALTER TABLE public.rbac_permissions
  ADD CONSTRAINT rbac_permissions_subject_type_check
  CHECK (subject_type IN ('user', 'role'));
