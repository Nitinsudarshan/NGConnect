import { NextResponse } from 'next/server';

import { fetchCourseraUserEnrollmentActivity, getCourseraCooldownMs } from '@/lib/coursera-api';
import { SCAN_BATCH_SIZE } from '@/lib/coursera-prune-schema';
import { requirePruneAccess } from '@/lib/coursera-prune-auth';
import {
  claimStepLock,
  finalizeScan,
  getScanProgress,
  nextUncheckedMembers,
  recordMemberChecks,
  releaseStepLock,
  updateScanCount,
  type MemberCheck,
} from '@/lib/coursera-prune-store';

export const maxDuration = 60;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONCURRENCY = 5;
/** How long the browser waits before retrying when another request holds the batch. */
const BUSY_WAIT_MS = 2000;

/**
 * POST /api/coursera/prune-inactive/scans/{id}/step
 *   Checks the next batch of members' activity live and saves it. The browser
 *   calls this until `done`. When Coursera is rate-limiting, nothing is
 *   recorded for the affected members and `waitMs` says when to call again.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requirePruneAccess('view');
  if (access.denied) return access.denied;

  const { id } = await params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ success: false, error: 'Invalid scan id' }, { status: 400 });
  }

  try {
    const progress = await getScanProgress(id);
    if (!progress) return NextResponse.json({ success: false, error: 'Refresh not found.' }, { status: 404 });
    if (progress.status !== 'running') {
      return NextResponse.json({ success: true, data: { ...progress, done: true } });
    }

    const cooldown = getCourseraCooldownMs();
    if (cooldown > 0) return NextResponse.json({ success: true, data: { ...progress, waitMs: cooldown } });

    if (!(await claimStepLock(id))) {
      return NextResponse.json({ success: true, data: { ...progress, waitMs: BUSY_WAIT_MS } });
    }

    try {
      const batch = await nextUncheckedMembers(id, SCAN_BATCH_SIZE);
      const checks: MemberCheck[] = [];

      for (let i = 0; i < batch.length; i += CONCURRENCY) {
        const chunk = batch.slice(i, i + CONCURRENCY);
        const results = await Promise.all(chunk.map(m => fetchCourseraUserEnrollmentActivity(m.externalId)));
        // A miss during a Coursera cooldown says nothing about the member: leave it for the next call.
        const isCoolingDown = getCourseraCooldownMs() > 0;
        chunk.forEach((member, j) => {
          const act = results[j];
          if (act) {
            checks.push({
              member,
              ok: true,
              latestActivity: act.latestActivity,
              earliestEnrollment: act.earliestEnrollment,
              coursesCount: act.coursesCount,
            });
          } else if (!isCoolingDown) {
            checks.push({ member, ok: false });
          }
        });
        if (isCoolingDown) break;
      }

      await recordMemberChecks(id, checks);
      const remaining = await updateScanCount(id, progress.total);
      if (remaining === 0) await finalizeScan(id);

      const updated = (await getScanProgress(id)) ?? progress;
      const waitMs = getCourseraCooldownMs();
      return NextResponse.json({ success: true, data: { ...updated, ...(waitMs > 0 ? { waitMs } : {}) } });
    } finally {
      await releaseStepLock(id);
    }
  } catch (err: unknown) {
    console.error('[coursera/prune-inactive/scans/step] error:', err);
    return NextResponse.json({ success: false, error: 'Could not check this batch. It will be retried.' }, { status: 500 });
  }
}
