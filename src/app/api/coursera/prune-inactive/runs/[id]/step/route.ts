import { NextResponse } from 'next/server';

import { batchRemoveCourseraMembers, fetchCourseraUserEnrollmentActivity, getCourseraCooldownMs } from '@/lib/coursera-api';
import { decideAfterRecheck } from '@/lib/coursera-prune';
import { PRUNE_BATCH_SIZE } from '@/lib/coursera-prune-schema';
import { requirePruneAccess } from '@/lib/coursera-prune-auth';
import {
  claimStepLock,
  getExecution,
  getHandledEmails,
  getPreview,
  getProtectedEmails,
  insertRemovalRows,
  refreshExecutionProgress,
  releaseStepLock,
  writePruneAuditEntry,
  type RemovalLogRow,
  type RemovalOutcome,
  type StoredExecution,
} from '@/lib/coursera-prune-store';
import type { PruneCandidate } from '@/types/coursera-prune';

export const maxDuration = 60;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONCURRENCY = 5;
const BUSY_WAIT_MS = 2000;

/**
 * POST /api/coursera/prune-inactive/runs/{id}/step
 *   Handles the next few selected members of a prune: re-checks each live
 *   with Coursera, spares anyone active since the list was made (or now
 *   protected), removes the rest, and logs every member before returning.
 *   The browser calls this until `done`; a stopped prune resumes here.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requirePruneAccess('edit');
  if (access.denied) return access.denied;

  const { id } = await params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ success: false, error: 'Invalid run id' }, { status: 400 });
  }

  try {
    const run = await getExecution(id);
    if (!run) return NextResponse.json({ success: false, error: 'Prune not found.' }, { status: 404 });
    if (run.hardDelete && !access.can('delete')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: this is a permanent-delete prune and needs the delete permission.' },
        { status: 403 }
      );
    }
    if (run.status !== 'running') {
      return NextResponse.json({ success: true, data: await refreshExecutionProgress(run, false) });
    }

    const cooldown = getCourseraCooldownMs();
    if (cooldown > 0) {
      return NextResponse.json({ success: true, data: { ...(await refreshExecutionProgress(run, false)), waitMs: cooldown } });
    }

    if (!(await claimStepLock(id))) {
      return NextResponse.json({ success: true, data: { ...(await refreshExecutionProgress(run, false)), waitMs: BUSY_WAIT_MS } });
    }

    try {
      const handled = await getHandledEmails(run.id);
      const pending = run.selected.filter(e => !handled.has(e));

      if (pending.length === 0) {
        const progress = await refreshExecutionProgress(run, true);
        await writePruneAuditEntry(run.id, 'finished', run.criteria, run.hardDelete, {
          removed: progress.removed,
          failed: progress.failed,
          spared: progress.spared,
        }, access.actor);
        return NextResponse.json({ success: true, data: progress });
      }

      await processBatch(run, pending.slice(0, PRUNE_BATCH_SIZE), access.actor.id);

      const progress = await refreshExecutionProgress(run, false);
      const waitMs = getCourseraCooldownMs();
      return NextResponse.json({ success: true, data: { ...progress, ...(waitMs > 0 ? { waitMs } : {}) } });
    } finally {
      await releaseStepLock(id);
    }
  } catch (err: unknown) {
    console.error('[coursera/prune-inactive/runs/step] error:', err);
    return NextResponse.json(
      { success: false, error: 'This batch could not be completed. Resume the prune to retry it.' },
      { status: 500 }
    );
  }
}

async function processBatch(run: StoredExecution, emails: string[], userId: string) {
  const preview = await getPreview(run.previewId);
  const byEmail = new Map((preview?.candidates ?? []).map(c => [c.email, c]));
  const protectedSet = new Set(await getProtectedEmails());
  const threshold = run.criteria.mode === 'inactive_days' ? run.criteria.days : run.criteria.seats;

  const row = (email: string, c: PruneCandidate | undefined, outcome: RemovalOutcome, message: string): RemovalLogRow => ({
    run_id: run.id,
    removed_by: userId,
    mode: run.criteria.mode,
    threshold,
    email,
    external_id: c?.externalId ?? email,
    full_name: c?.fullName || null,
    last_seen_at: c?.lastSeenAt ?? null,
    last_seen_source: c?.lastSeenSource ?? null,
    days_inactive: c?.daysInactive ?? null,
    courses_count: c?.coursesCount ?? null,
    soft_delete: !run.hardDelete,
    success: outcome === 'removed',
    outcome,
    message,
  });

  const rows: RemovalLogRow[] = [];
  const toRemove: PruneCandidate[] = [];

  // 1. Re-check each member live; spare anyone who no longer qualifies.
  for (let i = 0; i < emails.length; i += CONCURRENCY) {
    const chunk = emails.slice(i, i + CONCURRENCY);
    const checked = await Promise.all(
      chunk.map(async email => {
        const c = byEmail.get(email);
        if (!c) return { email, c, verdict: 'missing' as const };
        if (protectedSet.has(email) || protectedSet.has(c.externalId.toLowerCase())) {
          return { email, c, verdict: 'protected' as const };
        }
        const act = await fetchCourseraUserEnrollmentActivity(c.externalId);
        return { email, c, act, verdict: 'checked' as const };
      })
    );
    // A miss during a Coursera cooldown says nothing about the member: leave it for the next call.
    const isCoolingDown = getCourseraCooldownMs() > 0;

    for (const r of checked) {
      if (r.verdict === 'missing') rows.push(row(r.email, undefined, 'failed', 'Not found in the saved list; not removed.'));
      else if (r.verdict === 'protected') rows.push(row(r.email, r.c, 'spared', 'Protected account'));
      else if (!r.act) {
        if (!isCoolingDown) rows.push(row(r.email, r.c, 'failed', 'Could not check activity with Coursera; not removed.'));
      } else {
        const decision = decideAfterRecheck(r.c, r.act, run.criteria);
        if (decision.action === 'spare') rows.push(row(r.email, r.c, 'spared', decision.reason));
        else toRemove.push(r.c);
      }
    }
    if (isCoolingDown) break;
  }

  // 2. Remove the rest.
  const results = await batchRemoveCourseraMembers(
    toRemove.map(c => ({ email: c.email, externalId: c.externalId })),
    !run.hardDelete
  );
  const removing = new Map(toRemove.map(c => [c.email, c]));
  for (const r of results) {
    // Refused during a cooldown without reaching Coursera: retry on the next call.
    if (!r.success && r.message.startsWith('Circuit breaker open')) continue;
    // Everyone in the list was a member when it was made, so "not found" means an
    // earlier attempt removed them but stopped before logging it.
    if (!r.success && r.message.startsWith('Coursera returned 404')) {
      rows.push(row(r.email, removing.get(r.email), 'removed', 'Already removed from the program.'));
      continue;
    }
    rows.push(row(r.email, removing.get(r.email), r.success ? 'removed' : 'failed', r.message));
  }

  // 3. Log the batch before returning, so a stopped prune never loses track of a removal.
  await insertRemovalRows(rows);
}
