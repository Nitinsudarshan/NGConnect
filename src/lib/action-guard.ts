import { auth } from '@/lib/auth';
import { getCurrentUserPermissions, isReadOnlyRole } from '@/lib/permissions';
import { getUserRole } from '@/lib/roles';
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

/**
 * Denies the read-only tier (Member) while leaving every staff role untouched.
 *
 * For staff-only reads that are not destructive enough to warrant a resource
 * of their own — internal config lists, staff directories — but that the
 * public-facing Member tier has no business calling.
 */
export async function denyActionForMembers(what: string): Promise<ActionDenied | null> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: 'Unauthenticated' };

  const role = await getUserRole();
  if (isReadOnlyRole(role)) {
    return { success: false, error: `${what} is not available to member accounts.` };
  }
  return null;
}
