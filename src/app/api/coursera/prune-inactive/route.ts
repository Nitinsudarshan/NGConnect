import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { checkRateLimit } from '@/lib/rate-limiter';
import { buildPlanFromScan } from '@/lib/coursera-prune';
import { executeRequestSchema, previewRequestSchema } from '@/lib/coursera-prune-schema';
import { requirePruneAccess, tooManyRequests } from '@/lib/coursera-prune-auth';
import {
  getLatestCompletedScan,
  getPreview,
  getProtectedEmails,
  loadScanMembers,
  previewExpiresAt,
  PruneStoreError,
  savePreview,
  startExecution,
  toPrunePreview,
  writePruneAuditEntry,
  type Actor,
} from '@/lib/coursera-prune-store';
import type { PruneCriteria, PruneRunProgress } from '@/types/coursera-prune';

export const maxDuration = 60;

/**
 * POST /api/coursera/prune-inactive
 *
 * Preview (default; nothing is removed). Built from the latest finished
 * refresh, with no Coursera calls, and saved as a prune list:
 *   { "mode": "inactive_days", "days": 180 }        days >= 90
 *   { "mode": "free_seats", "seats": 150 }
 *   Optional: graceDays (default 14). Returns the saved list (PrunePreview).
 *
 * Start a prune from a saved list (valid 7 days, usable once):
 *   { "action": "execute", "previewId": "...", "confirmEmails": [...], "hardDelete": false }
 *   Returns the run's progress. The browser then calls
 *   POST /runs/{runId}/step until done; each step re-checks a few members live
 *   with Coursera, spares anyone active since the list was made, removes the
 *   rest, and logs every member as it goes. hardDelete needs the `delete`
 *   permission on the prune resource.
 */
export async function POST(request: NextRequest) {
  const access = await requirePruneAccess('edit');
  if (access.denied) return access.denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON request body' }, { status: 400 });
  }

  const isExecute = typeof body === 'object' && body !== null && (body as { action?: unknown }).action === 'execute';

  try {
    return isExecute
      ? await execute(body, access.actor, access.can('delete'))
      : await preview(body, access.actor);
  } catch (err: unknown) {
    if (err instanceof PruneStoreError) {
      return NextResponse.json({ success: false, error: 'Could not read or save the prune log. Nothing was removed.' }, { status: 500 });
    }
    throw err;
  }
}

const firstIssue = (error: z.ZodError) => error.issues[0]?.message ?? 'Invalid request.';

async function preview(body: unknown, actor: Actor) {
  const parsed = previewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: firstIssue(parsed.error) }, { status: 400 });
  }

  const rateLimit = checkRateLimit(`coursera-prune-preview:${actor.id}`, 10, 60 * 1000);
  if (!rateLimit.allowed) return tooManyRequests(rateLimit.resetTimeMs, 'previews');

  const scan = await getLatestCompletedScan();
  if (!scan) {
    return NextResponse.json(
      { success: false, error: 'No refreshed data yet. Use "Refresh from Coursera" on the overview first.' },
      { status: 409 }
    );
  }

  const input = parsed.data;
  const criteria: PruneCriteria =
    input.mode === 'inactive_days' ? { mode: 'inactive_days', days: input.days } : { mode: 'free_seats', seats: input.seats };

  const [members, protectedEmails] = await Promise.all([loadScanMembers(scan.id), getProtectedEmails()]);
  const plan = buildPlanFromScan(criteria, members, { graceDays: input.graceDays, protectedEmails });
  const saved = await savePreview(plan, input.graceDays, scan, actor);

  return NextResponse.json({ success: true, data: toPrunePreview(saved) });
}

async function execute(body: unknown, actor: Actor, canHardDelete: boolean) {
  const parsed = executeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: firstIssue(parsed.error) }, { status: 400 });
  }
  const { previewId, confirmEmails, hardDelete } = parsed.data;

  if (hardDelete && !canHardDelete) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: permanent deletion needs the delete permission on Coursera Prune Inactive.' },
      { status: 403 }
    );
  }

  const rateLimit = checkRateLimit(`coursera-prune-execute:${actor.id}`, 3, 60 * 1000);
  if (!rateLimit.allowed) return tooManyRequests(rateLimit.resetTimeMs, 'prune requests');

  const stored = await getPreview(previewId);
  if (!stored) {
    return NextResponse.json({ success: false, error: 'Prune list not found. Run a new preview.' }, { status: 404 });
  }
  if (stored.executedRunId) {
    return NextResponse.json(
      { success: false, error: 'This list has already been used. Resume that prune from the prune log, or run a new preview.' },
      { status: 409 }
    );
  }
  if (previewExpiresAt(stored.createdAt).getTime() < Date.now()) {
    return NextResponse.json({ success: false, error: 'This list has expired. Run a new preview.' }, { status: 410 });
  }

  const confirmed = [...new Set(confirmEmails)];
  const listEmails = new Set(stored.candidates.map(c => c.email));
  const notInList = confirmed.filter(e => !listEmails.has(e));
  if (notInList.length > 0) {
    return NextResponse.json(
      { success: false, error: `${notInList.length} selected account(s) are not in this list. Run a new preview.` },
      { status: 400 }
    );
  }

  // Keep the list's ranking order so the least active are handled first.
  const selected = stored.candidates.filter(c => confirmed.includes(c.email)).map(c => c.email);
  const runId = await startExecution(stored, selected, hardDelete, actor);
  if (!runId) {
    return NextResponse.json(
      { success: false, error: 'This list has already been used. Resume that prune from the prune log.' },
      { status: 409 }
    );
  }

  await writePruneAuditEntry(runId, 'started', stored.criteria, hardDelete, { selected: selected.length }, actor);
  console.info(`[coursera/prune-inactive] run=${runId} started by user=${actor.id} selected=${selected.length} hardDelete=${hardDelete}`);

  const data: PruneRunProgress = {
    runId,
    status: 'running',
    total: selected.length,
    processed: 0,
    removed: 0,
    failed: 0,
    spared: 0,
    done: false,
  };
  return NextResponse.json({ success: true, data });
}
