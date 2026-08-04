import { createClient } from '@/lib/supabase/server';
import { UserRole } from './roles';

export type PageCluster = 
  | 'dashboard'
  | 'reports'
  | 'crm'
  | 'data_management'
  | 'manage_users'
  | 'manage_alumni_network'
  | 'master_data'
  | 'rbac';

export async function checkAccess(role: UserRole, cluster: PageCluster): Promise<boolean> {
  // Hardcoded Super Admin check to bypass DB failures
  if (role === 'Super Admin') return true;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('role_permissions')
    .select(cluster)
    .eq('role', role)
    .single();

  if (error || !data) {
    // Fail safe, default to false if no record
    // However, if the table doesn't exist yet, we don't want to completely break the app for Admins
    if (role === 'Admin') return true; 
    
    // If the table hasn't been created yet, let's provide a graceful fallback for other roles
    if (error?.code === '42P01') { // 42P01 is PostgreSQL 'undefined_table'
      const fallback: Record<string, boolean> = {
        'Manager': cluster !== 'data_management' && cluster !== 'manage_users' && cluster !== 'master_data' && cluster !== 'rbac',
        'Program': cluster !== 'data_management' && cluster !== 'manage_users' && cluster !== 'master_data' && cluster !== 'rbac',
        'Operations': cluster !== 'data_management' && cluster !== 'manage_users' && cluster !== 'master_data' && cluster !== 'rbac',
        'Viewer': cluster === 'dashboard',
        'Member': cluster === 'dashboard',
      };
      return fallback[role] ?? false;
    }

    return false;
  }
  return Boolean((data as any)[cluster]);
}
