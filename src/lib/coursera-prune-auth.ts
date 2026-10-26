import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserPermissions } from '@/lib/permissions';
import { getUserRole } from '@/lib/roles';
import type { ActionType } from '@/lib/resource-tree';
import type { Actor } from '@/lib/coursera-prune-store';

/** RBAC resource for the prune tool. view = page, edit = preview/prune, delete = hard delete. */
export const PRUNE_RESOURCE = 'data_management.coursera_prune';

type PruneAccess =
  | { actor: Actor; can: (action: ActionType) => boolean; denied?: undefined }
  | { denied: NextResponse; actor?: undefined; can?: undefined };

/**
 * Authenticates the caller and checks `action` on the prune resource.
 * Returns the acting user (for audit rows) or a ready-made 401/403 response.
 */
export async function requirePruneAccess(action: ActionType): Promise<PruneAccess> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { denied: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }

  const permissions = await getCurrentUserPermissions();
  const can = (a: ActionType) => !!permissions[PRUNE_RESOURCE]?.[a];
  if (!can(action)) {
    return {
      denied: NextResponse.json(
        { success: false, error: `Forbidden: your role does not have ${action} access to Coursera Prune Inactive.` },
        { status: 403 }
      ),
    };
  }

  const role = await getUserRole(user);
  const name = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null;
  return { actor: { id: user.id, email: user.email ?? null, name, role }, can };
}

/** 429 response in the standard envelope. */
export function tooManyRequests(resetTimeMs: number, what: string): NextResponse {
  const retrySec = Math.ceil(resetTimeMs / 1000);
  return NextResponse.json(
    { success: false, error: `Too many ${what}. Wait ${retrySec}s and try again.` },
    { status: 429, headers: { 'Retry-After': String(retrySec) } }
  );
}
