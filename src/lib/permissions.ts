import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { getUserRole } from './roles';
import { ActionType, getResourcesByCluster, PERMISSION_RESOURCES } from './resource-tree';

/**
 * Permission resolution is two-tiered:
 *   1. Individual user override (`subject_type = 'user'`)
 *   2. Role default            (`subject_type = 'role'`)
 *
 * Team-based permissions were removed — a user's team is an organisational
 * label only and never grants or revokes access.
 */
export async function checkAccess(userId: string | null, resourceId: string, action: ActionType): Promise<boolean> {
  if (!userId) return false;

  // 1. Get role
  const role = await getUserRole();

  // Super Admin bypass
  if (role === 'Super Admin') return true;

  const supabase = await createClient();

  // Query permissions for the user and their role for this resource
  const { data, error } = await supabase
    .from('rbac_permissions')
    .select('*')
    .eq('resource_id', resourceId)
    .in('subject_id', [userId, role]);

  if (error || !data) {
    // Graceful fallback for Admins during migration if tables don't exist
    if (role === 'Admin') return true;
    return false;
  }

  const indData = data.find(d => d.subject_type === 'user' && d.subject_id === userId);
  const roleData = data.find(d => d.subject_type === 'role' && d.subject_id === role);

  const actionCol = `can_${action}` as keyof typeof indData;

  // 2. Check individual overrides first
  if (indData && indData[actionCol] !== undefined) {
    // Note: If you implement expires_at in rbac_permissions, check it here
    return indData[actionCol];
  }

  // 3. Check role default
  if (roleData && roleData[actionCol] !== undefined) {
    return roleData[actionCol];
  }

  if (role === 'Admin') return true;
  
  return false;
}

export async function getUserPermissions(userId: string | null, cluster: string): Promise<Record<string, Record<ActionType, boolean>>> {
  if (!userId) return {};
  const role = await getUserRole();
  const isAdmin = role === 'Super Admin'; // Admin no longer bypasses all if granular is setup, except via graceful fallback below or explicitly

  const resources = getResourcesByCluster(cluster);
  if (!resources || resources.length === 0) return {};

  const map: Record<string, Record<string, boolean>> = {};
  for (const r of resources) {
    map[r.id] = { view: false, edit: false, delete: false };
    if (isAdmin) {
      r.actions.forEach((a: string) => map[r.id][a] = true);
    }
  }

  if (isAdmin) return map as any;

  const resourceIds = resources.map(r => r.id);

  const supabase = await createClient();
  const { data } = await supabase
    .from('rbac_permissions')
    .select('*')
    .in('resource_id', resourceIds)
    .in('subject_id', [userId, role]);

  if (!data) return map as any;

  const indData = data.filter(d => d.subject_type === 'user' && d.subject_id === userId);
  const roleData = data.filter(d => d.subject_type === 'role' && d.subject_id === role);

  // Apply role defaults
  for (const r of roleData) {
    if (map[r.resource_id]) {
      map[r.resource_id].view = r.can_view;
      map[r.resource_id].edit = r.can_edit;
      map[r.resource_id].delete = r.can_delete;
    }
  }

  // Apply individual overrides
  for (const r of indData) {
    if (map[r.resource_id]) {
      map[r.resource_id].view = r.can_view;
      map[r.resource_id].edit = r.can_edit;
      map[r.resource_id].delete = r.can_delete;
    }
  }

  // Graceful fallback for Admins
  if (role === 'Admin' && data.length === 0) {
    for (const r of resources) {
      r.actions.forEach((a: string) => map[r.id][a] = true);
    }
  }

  return map as any;
}

export async function checkClusterAccess(userId: string | null, cluster: string): Promise<boolean> {
  if (!userId) return false;
  const role = await getUserRole();
  if (role === 'Super Admin' || role === 'Admin') return true;

  const supabase = await createClient();

  const resources = getResourcesByCluster(cluster);
  if (!resources || resources.length === 0) return false;
  const resourceIds = resources.map(r => r.id);

  // Check if there are ANY permissions granting view for this user or role in this cluster
  const { data } = await supabase
    .from('rbac_permissions')
    .select('id')
    .in('resource_id', resourceIds)
    .in('subject_id', [userId, role])
    .eq('can_view', true)
    .limit(1);

  if (data && data.length > 0) return true;

  return false;
}

/**
 * True when the user can perform `action` on at least one of `resourceIds`.
 * Used by container pages that render several individually-permissioned
 * sections (e.g. the Alumni CRM settings panels).
 */
export async function checkAnyAccess(userId: string | null, resourceIds: string[], action: ActionType): Promise<boolean> {
  if (!userId || resourceIds.length === 0) return false;
  const role = await getUserRole();
  if (role === 'Super Admin') return true;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rbac_permissions')
    .select('*')
    .in('resource_id', resourceIds)
    .in('subject_id', [userId, role]);

  if (error || !data) return role === 'Admin';

  const actionCol = `can_${action}`;

  for (const resourceId of resourceIds) {
    const rows = data.filter(d => d.resource_id === resourceId);
    const indData = rows.find(d => d.subject_type === 'user' && d.subject_id === userId);
    const roleData = rows.find(d => d.subject_type === 'role' && d.subject_id === role);

    if (indData) {
      if (indData[actionCol]) return true;
      continue; // explicit user override wins, even when it denies
    }
    if (roleData?.[actionCol]) return true;
  }

  if (role === 'Admin' && data.length === 0) return true;

  return false;
}

export type ResourcePermissions = Record<ActionType, boolean>;
export type PermissionMap = Record<string, ResourcePermissions>;

/**
 * The user's effective permissions for every registered resource, resolved in
 * a single query. Passed into the client tree so navigation entries, hub
 * cards, and action buttons can hide or disable themselves instead of letting
 * someone click through to a page that will only deny them.
 */
export async function getAllPermissions(userId: string | null): Promise<PermissionMap> {
  const map: PermissionMap = {};
  for (const r of PERMISSION_RESOURCES) {
    map[r.id] = { view: false, edit: false, delete: false };
  }

  if (!userId) return map;

  const role = await getUserRole();

  const grantAll = () => {
    for (const r of PERMISSION_RESOURCES) {
      r.actions.forEach(a => { map[r.id][a] = true; });
    }
    return map;
  };

  if (role === 'Super Admin') return grantAll();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rbac_permissions')
    .select('*')
    .in('subject_id', [userId, role]);

  // Graceful fallback for Admins while the matrix is still being populated
  if (error || !data || data.length === 0) {
    return role === 'Admin' ? grantAll() : map;
  }

  const apply = (rows: typeof data) => {
    for (const row of rows) {
      if (!map[row.resource_id]) continue; // resource no longer registered
      map[row.resource_id] = {
        view: !!row.can_view,
        edit: !!row.can_edit,
        delete: !!row.can_delete,
      };
    }
  };

  // Role defaults first, then individual overrides on top.
  apply(data.filter(d => d.subject_type === 'role' && d.subject_id === role));
  apply(data.filter(d => d.subject_type === 'user' && d.subject_id === userId));

  return map;
}

/**
 * The signed-in user's permission map, memoised for the current request.
 *
 * The dashboard layout, every page guard, and the hub pages all read from this,
 * so a request resolves permissions once no matter how many gates it passes
 * through.
 */
export const getCurrentUserPermissions = cache(async (): Promise<PermissionMap> => {
  const { userId } = await auth();
  return getAllPermissions(userId);
});
