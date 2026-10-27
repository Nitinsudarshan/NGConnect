import { NextResponse } from 'next/server';

import { requirePruneAccess } from '@/lib/coursera-prune-auth';
import { getLatestScan, getRunningScan } from '@/lib/coursera-prune-store';

/**
 * GET /api/coursera/prune-inactive/overview
 *   { latest, running }: the latest finished refresh (overview cards) and any
 *   refresh still in progress, so the page can show or resume it.
 *   Reads stored data only — no Coursera calls.
 */
export async function GET() {
  const access = await requirePruneAccess('view');
  if (access.denied) return access.denied;

  try {
    const [latest, running] = await Promise.all([getLatestScan(), getRunningScan()]);
    return NextResponse.json({ success: true, data: { latest, running } });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not load the overview.' }, { status: 500 });
  }
}
