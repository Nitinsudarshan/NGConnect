'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { isTrueAdmin, getSupabaseUserEmail } from '@/lib/roles';

type RolePermissionData = {
  role: string;
  dashboard: boolean;
  reports: boolean;
  crm: boolean;
  data_management: boolean;
  manage_users: boolean;
  manage_alumni_network: boolean;
  master_data: boolean;
  rbac: boolean;
};

// Legacy, kept temporarily just in case.
export async function saveRbacChanges(snapshot: RolePermissionData[]) {
  const isAdmin = await isTrueAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  const userEmail = await getSupabaseUserEmail() || 'unknown';
  const supabase = createAdminClient();

  // Update all rows in role_permissions (one by one or using an upsert)
  const upsertData = snapshot.map(row => ({
    ...row,
    updated_at: new Date().toISOString()
  }));

  const { error: updateError } = await supabase
    .from('role_permissions')
    .upsert(upsertData, { onConflict: 'role' });

  if (updateError) {
    console.error('Error batch updating permissions:', updateError);
    return { success: false, error: updateError.message };
  }

  // Create an audit log
  const { error: logError } = await supabase
    .from('rbac_audit_logs')
    .insert({
      changed_by: userEmail,
      snapshot: snapshot,
    });

  if (logError) {
    console.error('Error inserting audit log:', logError);
    return { success: true, warning: 'Changes saved, but failed to write audit log.' };
  }

  return { success: true };
}

export type GranularPermissionInput = {
  subject_type: 'role' | 'team' | 'user';
  subject_id: string;
  resource_id: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

// New save function for granular RBAC
export async function saveGranularRbacChanges(
  subjectType: 'role' | 'team' | 'user',
  permissions: GranularPermissionInput[]
) {
  const isAdmin = await isTrueAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  const userEmail = await getSupabaseUserEmail() || 'unknown';
  const supabase = createAdminClient();

  // We delete existing permissions for the affected subjects and re-insert them.
  // Or upsert them if they have a unique constraint. We added a unique constraint on (subject_type, subject_id, resource_id) in the migration.
  
  const upsertData = permissions.map(p => ({
    subject_type: p.subject_type,
    subject_id: p.subject_id,
    resource_id: p.resource_id,
    can_view: p.can_view,
    can_edit: p.can_edit,
    can_delete: p.can_delete,
    updated_at: new Date().toISOString(),
  }));

  // Perform an upsert
  const { error: updateError } = await supabase
    .from('rbac_permissions')
    .upsert(upsertData, { onConflict: 'subject_type, subject_id, resource_id' });

  if (updateError) {
    console.error('Error batch updating granular permissions:', updateError);
    return { success: false, error: updateError.message };
  }

  // Record audit log
  const { error: logError } = await supabase
    .from('rbac_audit_logs')
    .insert({
      changed_by: userEmail,
      snapshot: { type: 'granular_update', subjectType, count: permissions.length, data: permissions },
    });

  if (logError) {
    console.error('Error inserting audit log:', logError);
    return { success: true, warning: 'Changes saved, but failed to write audit log.' };
  }

  return { success: true };
}

// Rollback to a specific audit log
export async function rollbackGranularRbac(logId: string, snapshot: any) {
  const isAdmin = await isTrueAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  const userEmail = await getSupabaseUserEmail() || 'unknown';
  const supabase = createAdminClient();

  if (snapshot.type !== 'granular_update' || !snapshot.data) {
    return { success: false, error: 'Invalid snapshot format for rollback' };
  }

  const permissions: GranularPermissionInput[] = snapshot.data;
  const subjectType = snapshot.subjectType;

  const upsertData = permissions.map(p => ({
    subject_type: p.subject_type,
    subject_id: p.subject_id,
    resource_id: p.resource_id,
    can_view: p.can_view,
    can_edit: p.can_edit,
    can_delete: p.can_delete,
    updated_at: new Date().toISOString(),
  }));

  const { error: updateError } = await supabase
    .from('rbac_permissions')
    .upsert(upsertData, { onConflict: 'subject_type, subject_id, resource_id' });

  if (updateError) {
    console.error('Error rolling back granular permissions:', updateError);
    return { success: false, error: updateError.message };
  }

  // Add a new log entry for this rollback action
  await supabase
    .from('rbac_audit_logs')
    .insert({
      changed_by: `${userEmail} (Rollback to log ${logId})`,
      snapshot: { type: 'granular_update', subjectType, count: permissions.length, data: permissions, isRollback: true },
    });

  return { success: true };
}

