import { NextResponse } from 'next/server';

import { requirePruneAccess } from '@/lib/coursera-prune-auth';
import { getExecution, getExecutionResult } from '@/lib/coursera-prune-store';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/coursera/prune-inactive/runs/{id}
 *   Outcome of a prune so far: removed, failed, and spared members.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requirePruneAccess('view');
  if (access.denied) return access.denied;

  const { id } = await params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ success: false, error: 'Invalid run id' }, { status: 400 });
  }

  try {
    const run = await getExecution(id);
    if (!run) return NextResponse.json({ success: false, error: 'Prune not found.' }, { status: 404 });
    return NextResponse.json({ success: true, data: await getExecutionResult(run) });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not load this prune.' }, { status: 500 });
  }
}
