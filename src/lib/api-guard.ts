import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getCurrentUserPermissions } from '@/lib/permissions';
import { getResource, type ActionType } from '@/lib/resource-tree';

/**
 * Route handler guard.
 *
 * Returns a 401/403 response when the caller may not perform `action` on
 * `resourceId`, and `null` when they may:
 *
 *   const denied = await denyApiUnlessAccess('data_management.coursera_enroll', 'edit');
 *   if (denied) return denied;
 *
 * Route handlers must be checked against the same resource as the page that
 * calls them — a page the RBAC matrix opens up is useless if its API still
 * demands a hardcoded role.
 */
export async function denyApiUnlessAccess(
  resourceId: string,
  action: ActionType = 'view',
): Promise<NextResponse | null> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const permissions = await getCurrentUserPermissions();
  if (permissions[resourceId]?.[action]) return null;

  const label = getResource(resourceId)?.label ?? resourceId;
  return NextResponse.json(
    { error: `Forbidden: your role does not have ${action} access to ${label}.` },
    { status: 403 },
  );
}

/** True when the caller may perform `action` on `resourceId`. */
export async function hasApiAccess(resourceId: string, action: ActionType = 'view'): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const permissions = await getCurrentUserPermissions();
  return !!permissions[resourceId]?.[action];
}
