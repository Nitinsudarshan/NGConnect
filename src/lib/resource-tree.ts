export type ActionType = 'view' | 'edit' | 'delete';

export interface PermissionResource {
  id: string;          // e.g., 'crm.settings.pipeline_stages'
  label: string;       // Human readable name
  cluster: string;     // Top-level grouping (dashboard, reports, crm, learning_center, data_management, manage)
  group?: string;      // Optional sub-group for UI (e.g. 'Pipeline Config')
  actions: ActionType[];
}

export const PERMISSION_RESOURCES: PermissionResource[] = [
  // ---------------- DASHBOARD ----------------
  { id: 'dashboard', label: 'Dashboard', cluster: 'dashboard', actions: ['view'] },

  // ---------------- REPORTS ----------------
  { id: 'reports', label: 'Reports (org-wide)', cluster: 'reports', actions: ['view'] },

  // ---------------- CRM (Alumni Growth) ----------------
  { id: 'crm.workspace', label: 'Workspace / Queue', cluster: 'crm', actions: ['view', 'edit'] },
  { id: 'crm.all_data', label: 'All Data', cluster: 'crm', actions: ['view'] },
  { id: 'crm.pipelines.pay_forward', label: 'Pay-Forward Pipeline', cluster: 'crm', actions: ['view', 'edit'] },
  { id: 'crm.pipelines.mentoring', label: 'Mentoring Pipeline', cluster: 'crm', actions: ['view', 'edit'] },
  { id: 'crm.pipelines.placement', label: 'Placement Pipeline', cluster: 'crm', actions: ['view', 'edit'] },
  { id: 'crm.follow_ups', label: 'Follow-ups', cluster: 'crm', actions: ['view', 'edit'] },
  { id: 'crm.reports', label: 'CRM Reports', cluster: 'crm', actions: ['view'] },
  // CRM Settings
  { id: 'crm.settings.pay_forward_rules', label: 'Pay-Forward Rules', cluster: 'crm', group: 'Outreach Rules', actions: ['view', 'edit'] },
  { id: 'crm.settings.active_member_criteria', label: 'Active Member Criteria', cluster: 'crm', group: 'Outreach Rules', actions: ['view', 'edit'] },
  { id: 'crm.settings.profile_scoring', label: 'Profile Scoring', cluster: 'crm', group: 'Outreach Rules', actions: ['view', 'edit'] },
  { id: 'crm.settings.pipelines_config', label: 'Pipelines', cluster: 'crm', group: 'Pipeline Config', actions: ['view', 'edit'] },
  { id: 'crm.settings.pipeline_stages', label: 'Pipeline Stages', cluster: 'crm', group: 'Pipeline Config', actions: ['view', 'edit', 'delete'] },
  { id: 'crm.settings.interaction_outcomes', label: 'Interaction Outcomes', cluster: 'crm', group: 'Pipeline Config', actions: ['view', 'edit', 'delete'] },
  { id: 'crm.settings.contribution_types', label: 'Contribution Types', cluster: 'crm', group: 'Pipeline Config', actions: ['view', 'edit', 'delete'] },
  { id: 'crm.settings.outcome_mapping', label: 'Outcome Mapping', cluster: 'crm', group: 'Pipeline Config', actions: ['view', 'edit', 'delete'] },
  { id: 'crm.settings.mentors_directory', label: 'Mentors Directory', cluster: 'crm', group: 'People', actions: ['view', 'edit', 'delete'] },
  { id: 'crm.settings.edit_log', label: 'Edit Log', cluster: 'crm', group: 'Audit', actions: ['view'] },

  // ---------------- LEARNING CENTER ----------------
  { id: 'learning_center.dashboard', label: 'Learning Center Dashboard', cluster: 'learning_center', actions: ['view'] },
  { id: 'learning_center.sessions', label: 'Sessions', cluster: 'learning_center', actions: ['view', 'edit', 'delete'] },
  { id: 'learning_center.recordings', label: 'Recordings', cluster: 'learning_center', actions: ['view', 'edit'] },
  { id: 'learning_center.content_hub', label: 'Content Hub', cluster: 'learning_center', actions: ['view', 'edit'] },
  // Learning Center Settings
  { id: 'learning_center.settings.manage_mentors', label: 'Manage Mentors', cluster: 'learning_center', group: 'Master Data', actions: ['view', 'edit', 'delete'] },
  { id: 'learning_center.settings.audience', label: 'Audience', cluster: 'learning_center', group: 'Master Data', actions: ['view', 'edit', 'delete'] },
  { id: 'learning_center.settings.session_types', label: 'Session Types', cluster: 'learning_center', group: 'Session Config', actions: ['view', 'edit', 'delete'] },
  { id: 'learning_center.settings.session_categories', label: 'Session Categories', cluster: 'learning_center', group: 'Session Config', actions: ['view', 'edit', 'delete'] },
  { id: 'learning_center.settings.integrations', label: 'Integrations', cluster: 'learning_center', group: 'Integrations', actions: ['view', 'edit'] },
  { id: 'learning_center.settings.edit_log', label: 'Edit Log', cluster: 'learning_center', group: 'Audit', actions: ['view'] },

  // ---------------- DATA MANAGEMENT ----------------
  { id: 'data_management.import', label: 'Import', cluster: 'data_management', actions: ['view', 'edit'] },
  { id: 'data_management.import_coursera', label: 'Import Coursera', cluster: 'data_management', actions: ['view', 'edit'] },
  { id: 'data_management.rollback', label: 'Rollback', cluster: 'data_management', actions: ['view', 'edit'] },
  { id: 'data_management.audit_logs', label: 'Audit Logs', cluster: 'data_management', actions: ['view'] },
  { id: 'data_management.import_history', label: 'Import History', cluster: 'data_management', actions: ['view'] },
  { id: 'data_management.record_history', label: 'Record History', cluster: 'data_management', actions: ['view'] },
  { id: 'data_management.coursera', label: 'Coursera Data', cluster: 'data_management', actions: ['view', 'edit'] },

  // ---------------- MANAGE ----------------
  { id: 'manage.users', label: 'Manage Users', cluster: 'manage', actions: ['view', 'edit', 'delete'] },
  { id: 'manage.alumni_network', label: 'Manage Alumni Network', cluster: 'manage', actions: ['view', 'edit', 'delete'] },
  { id: 'manage.master_data', label: 'Master Data', cluster: 'manage', actions: ['view', 'edit', 'delete'] },
  { id: 'manage.rbac', label: 'RBAC', cluster: 'manage', actions: ['view', 'edit'] },
  { id: 'manage.help', label: 'Help Docs Hub', cluster: 'manage', actions: ['view', 'edit'] },
];

export const RESOURCE_CLUSTERS = [
  { id: 'crm', label: 'Alumni CRM' },
  { id: 'learning_center', label: 'Learning Center' },
  { id: 'data_management', label: 'Data Management' },
  { id: 'manage', label: 'Manage' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'reports', label: 'Reports' },
];

export function getResourcesByCluster(cluster: string) {
  return PERMISSION_RESOURCES.filter(r => r.cluster === cluster);
}

export function getResource(id: string) {
  return PERMISSION_RESOURCES.find(r => r.id === id);
}
