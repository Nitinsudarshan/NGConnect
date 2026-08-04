'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { isTrueAdmin, getSupabaseUserEmail } from '@/lib/roles';
import { PageCluster } from '@/lib/permissions';

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

// Batch update permissions and save an audit log
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
    // Not failing the whole operation if just logging fails, but returning a warning
    return { success: true, warning: 'Changes saved, but failed to write audit log.' };
  }

  return { success: true };
}

// Rollback to a specific audit log
export async function rollbackRbac(logId: string, snapshot: RolePermissionData[]) {
  const isAdmin = await isTrueAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  const userEmail = await getSupabaseUserEmail() || 'unknown';
  const supabase = createAdminClient();

  // Upsert the historical snapshot
  const upsertData = snapshot.map(row => ({
    ...row,
    updated_at: new Date().toISOString()
  }));

  const { error: updateError } = await supabase
    .from('role_permissions')
    .upsert(upsertData, { onConflict: 'role' });

  if (updateError) {
    console.error('Error rolling back permissions:', updateError);
    return { success: false, error: updateError.message };
  }

  // Add a new log entry for this rollback action
  await supabase
    .from('rbac_audit_logs')
    .insert({
      changed_by: `${userEmail} (Rollback to log ${logId})`,
      snapshot: snapshot,
    });

  return { success: true };
}

