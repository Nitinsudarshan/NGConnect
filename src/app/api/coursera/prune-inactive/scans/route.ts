import { NextResponse } from 'next/server';

import { checkRateLimit } from '@/lib/rate-limiter';
import { getCourseraProgramMembers } from '@/lib/coursera-api';
import { requirePruneAccess, tooManyRequests } from '@/lib/coursera-prune-auth';
import { getRunningScan, startScan } from '@/lib/coursera-prune-store';

export const maxDuration = 120;

/**
 * POST /api/coursera/prune-inactive/scans
 *   Starts a refresh: reads the program's member list from Coursera (one call
 *   per 100 members) and stores it. Each member's activity is then checked by
 *   POST /scans/{id}/step, a batch per request. If a refresh is already
 *   running, that one is returned so it can be resumed instead.
 */
export async function POST() {
  const access = await requirePruneAccess('view');
  if (access.denied) return access.denied;

  try {
    const running = await getRunningScan();
    if (running) return NextResponse.json({ success: true, data: running });

    const rateLimit = checkRateLimit(`coursera-prune-scan:${access.actor.id}`, 3, 10 * 60 * 1000);
    if (!rateLimit.allowed) return tooManyRequests(rateLimit.resetTimeMs, 'refreshes');

    const members = await getCourseraProgramMembers();
    if (members.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Coursera returned no program members. Check credentials / program ID, or wait a minute if Coursera is rate-limiting.' },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: true, data: await startScan(members, access.actor) });
  } catch (err: unknown) {
    console.error('[coursera/prune-inactive/scans] start error:', err);
    return NextResponse.json({ success: false, error: 'Could not start the refresh. Try again shortly.' }, { status: 502 });
  }
}
