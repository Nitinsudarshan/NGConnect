import { NextResponse } from 'next/server';

import { checkRateLimit } from '@/lib/rate-limiter';
import { scanProgramActivity } from '@/lib/coursera-prune';
import { DEFAULT_GRACE_DAYS } from '@/lib/coursera-prune-schema';
import { requirePruneAccess, tooManyRequests } from '@/lib/coursera-prune-auth';
import { getLatestScan, getProtectedEmails, saveScan } from '@/lib/coursera-prune-store';

export const maxDuration = 300;

/**
 * GET /api/coursera/prune-inactive/overview
 *   Latest stored inactivity scan (fast, no Coursera calls). data is null if none yet.
 */
export async function GET() {
  const access = await requirePruneAccess('view');
  if (access.denied) return access.denied;

  try {
    return NextResponse.json({ success: true, data: await getLatestScan() });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not load the latest scan.' }, { status: 500 });
  }
}

/**
 * POST /api/coursera/prune-inactive/overview
 *   Re-reads every member's activity live from Coursera and stores the scan.
 *   Slow (one Coursera call per member), so it is rate-limited per user.
 */
export async function POST() {
  const access = await requirePruneAccess('view');
  if (access.denied) return access.denied;

  const rateLimit = checkRateLimit(`coursera-prune-scan:${access.actor.id}`, 2, 5 * 60 * 1000);
  if (!rateLimit.allowed) return tooManyRequests(rateLimit.resetTimeMs, 'refreshes');

  try {
    const protectedEmails = await getProtectedEmails();
    const scan = await scanProgramActivity({ graceDays: DEFAULT_GRACE_DAYS, protectedEmails });
    if (scan.totalMembers === 0) {
      return NextResponse.json(
        { success: false, error: 'Coursera returned no program members. Check credentials / program ID.' },
        { status: 502 }
      );
    }
    const saved = await saveScan(scan, DEFAULT_GRACE_DAYS, access.actor);
    return NextResponse.json({ success: true, data: saved });
  } catch (err: unknown) {
    console.error('[coursera/prune-inactive/overview] scan error:', err);
    return NextResponse.json({ success: false, error: 'Could not refresh from Coursera. Try again shortly.' }, { status: 502 });
  }
}
