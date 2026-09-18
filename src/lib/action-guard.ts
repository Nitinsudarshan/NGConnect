import { auth } from '@/lib/auth';
import { getCurrentUserPermissions } from '@/lib/permissions';
import { getResource, type ActionType } from '@/lib/resource-tree';

export type ActionDenied = { success: false; error: string };

/**
 * Server action guard.
 *
 * Returns a `{ success: false, error }` result when the caller may not perform
 * `action` on `resourceId`, and `null` when they may:
 *
 *   const denied = await denyActionUnlessAccess('learning_center.sessions', 'edit');
 *   if (denied) return denied;
 *
 * Server actions are public endpoints — hiding the button that calls one is a
 * UI courtesy, not access control, so every mutating action is checked against
 * the same resource as the screen that offers it.
 */
export async function denyActionUnlessAccess(
  resourceId: string,
  action: ActionType = 'view',
): Promise<ActionDenied | null> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: 'Unauthenticated' };

  const permissions = await getCurrentUserPermissions();
  if (permissions[resourceId]?.[action]) return null;

  const label = getResource(resourceId)?.label ?? resourceId;
  return { success: false, error: `Your role does not have ${action} access to ${label}.` };
}
