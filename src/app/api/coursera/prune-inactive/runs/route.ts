import { NextResponse } from 'next/server';

import { requirePruneAccess } from '@/lib/coursera-prune-auth';
import { listRuns } from '@/lib/coursera-prune-store';

/**
 * GET /api/coursera/prune-inactive/runs
 *   The 50 most recent previews and executions, newest first.
 */
export async function GET() {
  const access = await requirePruneAccess('view');
  if (access.denied) return access.denied;

  try {
    return NextResponse.json({ success: true, data: await listRuns(['preview', 'execute']) });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not load prune history.' }, { status: 500 });
  }
}
