-- ============================================================
-- Migration: 20260918000001_rbac_full_route_coverage.sql
-- Seed the permission rows for newly registered resources
-- ============================================================
-- Every page in the app is now gated by an entry in
-- `src/lib/resource-tree.ts`. Because the engine is fail-closed, a newly
-- registered resource grants nobody anything until a row exists here.
--
-- These inserts reproduce the access each role had before the routes were
-- registered, with one deliberate change: the Program role gains read access
-- to the Coursera dashboard, activity logs, and export report, which were
-- previously hardcoded to Admin only.
--
-- Safe to re-run: every insert is ON CONFLICT DO NOTHING, so permissions an
-- administrator has since changed in the RBAC matrix are never overwritten.
-- ============================================================

DO $$
DECLARE
  grant_row RECORD;
BEGIN
  FOR grant_row IN
    SELECT * FROM (VALUES
      -- resource_id, role, can_view, can_edit, can_delete

      -- Alumni CRM: member requests portal (Coursera access requests and
      -- Pay-Forward submissions). `edit` is what approves a request and
      -- allocates the Coursera licence, so it goes to Super Admin, Admin, and
      -- Program; Manager and Operations keep the read access they had.
      ('crm.requests',                          'Super Admin', true,  true,  true ),
      ('crm.requests',                          'Admin',       true,  true,  true ),
      ('crm.requests',                          'Program',     true,  true,  false),
      ('crm.requests',                          'Manager',     true,  false, false),
      ('crm.requests',                          'Operations',  true,  false, false),

      -- Alumni CRM: the 360° alumni profile (was: ungated for any signed-in user)
      ('crm.alumni_profile',                    'Super Admin', true,  true,  true ),
      ('crm.alumni_profile',                    'Admin',       true,  true,  true ),
      ('crm.alumni_profile',                    'Manager',     true,  true,  false),
      ('crm.alumni_profile',                    'Program',     true,  true,  false),
      ('crm.alumni_profile',                    'Operations',  true,  true,  false),
      ('crm.alumni_profile',                    'Viewer',      true,  false, false),

      -- Learning Center reports (was: learning_center.dashboard OR reports)
      ('learning_center.reports',               'Super Admin', true,  false, false),
      ('learning_center.reports',               'Admin',       true,  false, false),
      ('learning_center.reports',               'Manager',     true,  false, false),
      ('learning_center.reports',               'Program',     true,  false, false),
      ('learning_center.reports',               'Viewer',      true,  false, false),

      -- Learning Center read access for roles that saw it in the sidebar before
      ('learning_center.recordings',            'Member',      true,  false, false),
      ('learning_center.content_hub',           'Member',      true,  false, false),
      ('learning_center.recordings',            'Viewer',      true,  false, false),
      ('learning_center.content_hub',           'Viewer',      true,  false, false),
      ('learning_center.dashboard',             'Operations',  true,  false, false),
      ('learning_center.recordings',            'Operations',  true,  false, false),
      ('learning_center.content_hub',           'Operations',  true,  false, false),

      -- Coursera pages (were hardcoded to Super Admin / Admin)
      ('data_management.coursera_activity_logs','Super Admin', true,  false, false),
      ('data_management.coursera_activity_logs','Admin',       true,  false, false),
      ('data_management.coursera_activity_logs','Manager',     true,  false, false),
      ('data_management.coursera_activity_logs','Operations',  true,  false, false),
      ('data_management.coursera_activity_logs','Program',     true,  false, false),
      ('data_management.coursera_export',       'Super Admin', true,  false, false),
      ('data_management.coursera_export',       'Admin',       true,  false, false),
      ('data_management.coursera_export',       'Manager',     true,  false, false),
      ('data_management.coursera_export',       'Operations',  true,  false, false),
      ('data_management.coursera_export',       'Program',     true,  false, false),
      ('data_management.coursera_enroll',       'Super Admin', true,  true,  false),
      ('data_management.coursera_enroll',       'Admin',       true,  true,  false),
      ('data_management.coursera_enroll',       'Manager',     true,  true,  false),
      ('data_management.coursera_enroll',       'Operations',  true,  true,  false),
      -- Program can read the Coursera dashboard (new grant, revocable in the matrix)
      ('data_management.coursera',              'Program',     true,  false, false),

      -- Manage: reports, notifications, diagnostics (were hardcoded role checks)
      ('manage.reports',                        'Super Admin', true,  false, false),
      ('manage.reports',                        'Admin',       true,  false, false),
      ('manage.reports',                        'Manager',     true,  false, false),
      ('manage.notifications',                  'Super Admin', true,  true,  false),
      ('manage.notifications',                  'Admin',       true,  true,  false),
      ('manage.diagnostics',                    'Super Admin', true,  false, false),
      ('manage.diagnostics',                    'Admin',       true,  false, false),

      -- General: docs stay admin-only, support and feedback are for everyone
      ('general.docs',                          'Super Admin', true,  false, false),
      ('general.docs',                          'Admin',       true,  false, false),
      ('general.support',                       'Super Admin', true,  false, false),
      ('general.support',                       'Admin',       true,  false, false),
      ('general.support',                       'Manager',     true,  false, false),
      ('general.support',                       'Program',     true,  false, false),
      ('general.support',                       'Operations',  true,  false, false),
      ('general.support',                       'Viewer',      true,  false, false),
      ('general.support',                       'Member',      true,  false, false),
      ('general.feedback',                      'Super Admin', true,  false, false),
      ('general.feedback',                      'Admin',       true,  false, false),
      ('general.feedback',                      'Manager',     true,  false, false),
      ('general.feedback',                      'Program',     true,  false, false),
      ('general.feedback',                      'Operations',  true,  false, false),
      ('general.feedback',                      'Viewer',      true,  false, false),
      ('general.feedback',                      'Member',      true,  false, false)
    ) AS t(resource_id, role_name, can_view, can_edit, can_delete)
  LOOP
    INSERT INTO public.rbac_permissions (resource_id, subject_type, subject_id, can_view, can_edit, can_delete)
    VALUES (grant_row.resource_id, 'role', grant_row.role_name, grant_row.can_view, grant_row.can_edit, grant_row.can_delete)
    ON CONFLICT (resource_id, subject_type, subject_id) DO NOTHING;
  END LOOP;
END $$;
