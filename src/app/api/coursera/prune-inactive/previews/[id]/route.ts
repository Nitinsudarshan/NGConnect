import { NextResponse } from 'next/server';

import { requirePruneAccess } from '@/lib/coursera-prune-auth';
import { getPreview, toPrunePreview } from '@/lib/coursera-prune-store';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/coursera/prune-inactive/previews/{id}
 *   A saved prune list, to reopen and prune from.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requirePruneAccess('view');
  if (access.denied) return access.denied;

  const { id } = await params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ success: false, error: 'Invalid list id' }, { status: 400 });
  }

  try {
    const preview = await getPreview(id);
    if (!preview) return NextResponse.json({ success: false, error: 'Prune list not found.' }, { status: 404 });
    return NextResponse.json({ success: true, data: toPrunePreview(preview) });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not load this prune list.' }, { status: 500 });
  }
}
