import React from 'react';

import { getCurrentUserPermissions } from '@/lib/permissions';
import { AccessDenied } from '@/components/access-denied';
import type { ActionType } from '@/lib/resource-tree';

type DenyOptions = {
  /** Where the "back" button points. Defaults to the dashboard. */
  backHref?: string;
  backLabel?: string;
  description?: string;
};

/**
 * Page guard for server components.
 *
 * Returns an <AccessDenied /> element when the current user may not perform
 * `action` on `resourceId`, and `null` when they may:
 *
 *   const denied = await denyUnlessAccess('data_management.coursera');
 *   if (denied) return denied;
 *
 * Restricted entry points are already hidden from the sidebar and hub cards,
 * so this only fires on direct links and bookmarks — where an explicit message
 * is far more useful than a silent bounce to the dashboard.
 */
export async function denyUnlessAccess(
  resourceId: string,
  action: ActionType = 'view',
  options: DenyOptions = {},
): Promise<React.ReactElement | null> {
  const permissions = await getCurrentUserPermissions();
  if (permissions[resourceId]?.[action]) return null;
  return <AccessDenied resourceId={resourceId} {...options} />;
}

/** As `denyUnlessAccess`, but passes when any one of `resourceIds` is granted. */
export async function denyUnlessAnyAccess(
  resourceIds: string[],
  action: ActionType = 'view',
  options: DenyOptions = {},
): Promise<React.ReactElement | null> {
  const permissions = await getCurrentUserPermissions();
  if (resourceIds.some(id => permissions[id]?.[action])) return null;
  return <AccessDenied resourceId={resourceIds[0]} {...options} />;
}
