-- ============================================================
-- Migration: 20260816000003_rbac_permissions_table.sql
-- Granular Role-Based Access Control (RBAC) Permissions Table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rbac_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT NOT NULL,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('user', 'team', 'role')),
  subject_id TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT FALSE,
  can_edit BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (resource_id, subject_type, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_rbac_permissions_lookup 
  ON public.rbac_permissions (resource_id, subject_type, subject_id);

ALTER TABLE public.rbac_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to rbac_permissions for authenticated users"
  ON public.rbac_permissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all access to rbac_permissions for service role"
  ON public.rbac_permissions
  FOR ALL
  TO service_role
  USING (true);

-- ------------------------------------------------------------
-- SEED DEFAULTS FOR ROLES
-- ------------------------------------------------------------

-- Helper function to seed role permissions
DO $$
DECLARE
  res RECORD;
  resources TEXT[] := ARRAY[
    'dashboard',
    'reports',
    'crm.workspace',
    'crm.all_data',
    'crm.pipelines.pay_forward',
    'crm.pipelines.mentoring',
    'crm.pipelines.placement',
    'crm.follow_ups',
    'crm.reports',
    'crm.settings.pay_forward_rules',
    'crm.settings.active_member_criteria',
    'crm.settings.profile_scoring',
    'crm.settings.pipelines_config',
    'crm.settings.pipeline_stages',
    'crm.settings.interaction_outcomes',
    'crm.settings.contribution_types',
    'crm.settings.outcome_mapping',
    'crm.settings.mentors_directory',
    'crm.settings.edit_log',
    'learning_center.dashboard',
    'learning_center.sessions',
    'learning_center.recordings',
    'learning_center.content_hub',
    'learning_center.settings.manage_mentors',
    'learning_center.settings.audience',
    'learning_center.settings.session_types',
    'learning_center.settings.session_categories',
    'learning_center.settings.integrations',
    'learning_center.settings.edit_log',
    'data_management.import',
    'data_management.import_coursera',
    'data_management.rollback',
    'data_management.audit_logs',
    'data_management.import_history',
    'data_management.record_history',
    'data_management.coursera',
    'manage.users',
    'manage.alumni_network',
    'manage.master_data',
    'manage.rbac',
    'manage.help'
  ];
  r TEXT;
BEGIN
  FOREACH r IN ARRAY resources LOOP
    -- Super Admin & Admin: Full Access
    INSERT INTO public.rbac_permissions (resource_id, subject_type, subject_id, can_view, can_edit, can_delete)
    VALUES (r, 'role', 'Super Admin', true, true, true)
    ON CONFLICT (resource_id, subject_type, subject_id) DO NOTHING;

    INSERT INTO public.rbac_permissions (resource_id, subject_type, subject_id, can_view, can_edit, can_delete)
    VALUES (r, 'role', 'Admin', true, true, true)
    ON CONFLICT (resource_id, subject_type, subject_id) DO NOTHING;

    -- Manager: View & Edit on all operational resources, View on Manage
    IF r LIKE 'manage.%' THEN
      INSERT INTO public.rbac_permissions (resource_id, subject_type, subject_id, can_view, can_edit, can_delete)
      VALUES (r, 'role', 'Manager', true, false, false)
      ON CONFLICT (resource_id, subject_type, subject_id) DO NOTHING;
    ELSE
      INSERT INTO public.rbac_permissions (resource_id, subject_type, subject_id, can_view, can_edit, can_delete)
      VALUES (r, 'role', 'Manager', true, true, false)
      ON CONFLICT (resource_id, subject_type, subject_id) DO NOTHING;
    END IF;

    -- Program Role: Access to Learning Center + CRM Workspaces & Pipelines
    IF r IN ('dashboard', 'reports', 'learning_center.dashboard', 'learning_center.sessions', 'learning_center.recordings', 'learning_center.content_hub', 'crm.workspace', 'crm.pipelines.mentoring', 'crm.pipelines.placement', 'crm.follow_ups', 'crm.reports') THEN
      INSERT INTO public.rbac_permissions (resource_id, subject_type, subject_id, can_view, can_edit, can_delete)
      VALUES (r, 'role', 'Program', true, NOT (r IN ('dashboard', 'reports', 'crm.reports')), false)
      ON CONFLICT (resource_id, subject_type, subject_id) DO NOTHING;
    END IF;

    -- Operations Role: Access to CRM + Data Management
    IF r IN ('dashboard', 'reports', 'crm.workspace', 'crm.all_data', 'crm.pipelines.pay_forward', 'crm.pipelines.mentoring', 'crm.pipelines.placement', 'crm.follow_ups', 'crm.reports', 'data_management.import', 'data_management.import_coursera', 'data_management.coursera', 'data_management.import_history', 'data_management.record_history') THEN
      INSERT INTO public.rbac_permissions (resource_id, subject_type, subject_id, can_view, can_edit, can_delete)
      VALUES (r, 'role', 'Operations', true, NOT (r IN ('dashboard', 'reports', 'crm.reports', 'crm.all_data', 'data_management.import_history', 'data_management.record_history')), false)
      ON CONFLICT (resource_id, subject_type, subject_id) DO NOTHING;
    END IF;

    -- Viewer Role: Read-only access to main dashboards and reports
    IF r IN ('dashboard', 'reports', 'crm.workspace', 'crm.all_data', 'crm.reports', 'learning_center.dashboard') THEN
      INSERT INTO public.rbac_permissions (resource_id, subject_type, subject_id, can_view, can_edit, can_delete)
      VALUES (r, 'role', 'Viewer', true, false, false)
      ON CONFLICT (resource_id, subject_type, subject_id) DO NOTHING;
    END IF;

    -- Member Role: Read-only access to standard dashboard & learning center
    IF r IN ('dashboard', 'learning_center.dashboard') THEN
      INSERT INTO public.rbac_permissions (resource_id, subject_type, subject_id, can_view, can_edit, can_delete)
      VALUES (r, 'role', 'Member', true, false, false)
      ON CONFLICT (resource_id, subject_type, subject_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;
