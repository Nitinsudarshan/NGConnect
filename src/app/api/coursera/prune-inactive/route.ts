import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { checkRateLimit } from '@/lib/rate-limiter';
import { buildPrunePlan } from '@/lib/coursera-prune';
import { batchRemoveCourseraMembers } from '@/lib/coursera-api';
import { executeRequestSchema, previewRequestSchema } from '@/lib/coursera-prune-schema';
import { requirePruneAccess, tooManyRequests } from '@/lib/coursera-prune-auth';
import {
  claimPreviewForExecution,
  completeExecution,
  getPreview,
  getProtectedEmails,
  insertRemovalRows,
  previewExpiresAt,
  PruneStoreError,
  savePreview,
  writePruneAuditEntry,
  type Actor,
  type RemovalLogRow,
} from '@/lib/coursera-prune-store';
import type { PruneCriteria, PruneExecutionResult, PrunePreview, PrunedAccount } from '@/types/coursera-prune';

export const maxDuration = 300;

/**
 * POST /api/coursera/prune-inactive
 *
 * Step 1 — preview (default, nothing is removed; the preview is logged):
 *   { "mode": "inactive_days", "days": 180 }        days >= 90
 *   { "mode": "free_seats", "seats": 150 }
 *   Optional: graceDays (default 14). Returns { previewId, plan }.
 *
 * Step 2 — execute, within 30 minutes, by the same user who ran the preview:
 *   { "action": "execute", "previewId": "...", "confirmEmails": [...], "hardDelete": false }
 *
 * On execute the plan is rebuilt live from the preview's criteria, and only
 * emails that are in confirmEmails AND in the preview AND still in the fresh
 * plan are removed. Anyone who became active or was protected since the
 * preview is spared. Each preview can be executed once. hardDelete requires
 * the `delete` permission on the prune resource.
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
      return NextResponse.json({ success: false, error: 'Could not save to the prune log. Nothing was removed.' }, { status: 500 });
    }
    throw err;
  }
}

const firstIssue = (error: z.ZodError) => error.issues[0]?.message ?? 'Invalid request.';

async function loadPlan(criteria: PruneCriteria, graceDays: number) {
  try {
    const protectedEmails = await getProtectedEmails();
    const plan = await buildPrunePlan(criteria, { graceDays, protectedEmails });
    if (plan.totalMembers === 0) {
      return { error: 'Coursera returned no program members. Check credentials / program ID before retrying.' };
    }
    return { plan };
  } catch (err: unknown) {
    if (err instanceof PruneStoreError) throw err;
    console.error('[coursera/prune-inactive] plan error:', err);
    return { error: 'Could not read program members from Coursera. Try again shortly.' };
  }
}

async function preview(body: unknown, actor: Actor) {
  const parsed = previewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: firstIssue(parsed.error) }, { status: 400 });
  }

  const rateLimit = checkRateLimit(`coursera-prune-preview:${actor.id}`, 5, 60 * 1000);
  if (!rateLimit.allowed) return tooManyRequests(rateLimit.resetTimeMs, 'previews');

  const input = parsed.data;
  const criteria: PruneCriteria =
    input.mode === 'inactive_days' ? { mode: 'inactive_days', days: input.days } : { mode: 'free_seats', seats: input.seats };

  const { plan, error } = await loadPlan(criteria, input.graceDays);
  if (!plan) return NextResponse.json({ success: false, error }, { status: 502 });

  const saved = await savePreview(plan, input.graceDays, actor);
  const data: PrunePreview = {
    previewId: saved.id,
    graceDays: input.graceDays,
    expiresAt: previewExpiresAt(saved.createdAt).toISOString(),
    plan,
  };
  return NextResponse.json({ success: true, data });
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
    return NextResponse.json({ success: false, error: 'Preview not found. Run a new preview.' }, { status: 404 });
  }
  if (stored.createdBy !== actor.id) {
    return NextResponse.json({ success: false, error: 'You can only prune from a preview you ran yourself.' }, { status: 403 });
  }
  if (stored.executedRunId) {
    return NextResponse.json({ success: false, error: 'This preview has already been used. Run a new preview.' }, { status: 409 });
  }
  if (previewExpiresAt(stored.createdAt).getTime() < Date.now()) {
    return NextResponse.json({ success: false, error: 'This preview has expired. Run a new preview.' }, { status: 410 });
  }

  const confirmed = new Set(confirmEmails);
  const previewEmails = new Set(stored.candidates.map(c => c.email));
  const notInPreview = [...confirmed].filter(e => !previewEmails.has(e));
  if (notInPreview.length > 0) {
    return NextResponse.json(
      { success: false, error: `${notInPreview.length} selected account(s) were not in the preview. Run a new preview.` },
      { status: 400 }
    );
  }

  const { plan, error } = await loadPlan(stored.criteria, stored.graceDays);
  if (!plan) return NextResponse.json({ success: false, error }, { status: 502 });

  const runId = await claimPreviewForExecution(stored, hardDelete, actor);
  if (!runId) {
    return NextResponse.json({ success: false, error: 'This preview has already been used. Run a new preview.' }, { status: 409 });
  }

  const toRemove = plan.candidates.filter(c => confirmed.has(c.email));
  const removing = new Set(toRemove.map(c => c.email));
  const sparedEmails = [...confirmed].filter(e => !removing.has(e));

  const results = await batchRemoveCourseraMembers(
    toRemove.map(c => ({ email: c.email, externalId: c.externalId })),
    !hardDelete
  );
  const succeeded = results.filter(r => r.success).length;
  const criteria = stored.criteria;
  const threshold = criteria.mode === 'inactive_days' ? criteria.days : criteria.seats;

  // Join removal results back to candidate details for the report
  const byEmail = new Map(toRemove.map(c => [c.email, c]));
  const rows: RemovalLogRow[] = results.map(r => {
    const c = byEmail.get(r.email);
    return {
      run_id: runId,
      removed_by: actor.id,
      mode: criteria.mode,
      threshold,
      email: r.email,
      external_id: r.externalId,
      full_name: c?.fullName || null,
      last_seen_at: c?.lastSeenAt || null,
      last_seen_source: c?.lastSeenSource || null,
      days_inactive: c?.daysInactive ?? null,
      courses_count: c?.coursesCount ?? null,
      soft_delete: !hardDelete,
      success: r.success,
      message: r.message,
    };
  });

  const logWarning = await insertRemovalRows(rows);
  await writePruneAuditEntry(runId, criteria, hardDelete, { succeeded, failed: results.length - succeeded }, actor);
  await completeExecution(runId, {
    totalMembers: plan.totalMembers,
    attempted: results.length,
    succeeded,
    failed: results.length - succeeded,
    spared: sparedEmails.length,
    sparedEmails,
    logWarning,
  });

  console.info(
    `[coursera/prune-inactive] run=${runId} user=${actor.id} mode=${criteria.mode} removed=${succeeded}/${results.length} spared=${sparedEmails.length} hardDelete=${hardDelete}`
  );

  const toReport = (r: RemovalLogRow): PrunedAccount => ({
    email: r.email,
    fullName: r.full_name,
    lastSeenAt: r.last_seen_at,
    lastSeenSource: r.last_seen_source as PrunedAccount['lastSeenSource'],
    daysInactive: r.days_inactive,
    coursesCount: r.courses_count,
    message: r.message,
  });

  const data: PruneExecutionResult = {
    runId,
    criteria,
    hardDelete,
    summary: {
      requested: confirmed.size,
      attempted: results.length,
      succeeded,
      failed: results.length - succeeded,
      spared: sparedEmails.length,
    },
    removedAccounts: rows.filter(r => r.success).map(toReport),
    failedAccounts: rows.filter(r => !r.success).map(toReport),
    sparedEmails, // confirmed but no longer in the plan (became active, protected, etc.)
    downloadUrl: `/api/coursera/prune-inactive/removals?runId=${runId}&format=csv`,
    logWarning,
  };
  return NextResponse.json({ success: true, data });
}
