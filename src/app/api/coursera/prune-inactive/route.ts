import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import { denyApiUnlessAccess } from '@/lib/api-guard';
import { buildPrunePlan, PruneCriteria } from '@/lib/coursera-prune';
import { batchRemoveCourseraMembers } from '@/lib/coursera-api';

export const maxDuration = 300;

const MAX_REMOVALS_PER_REQUEST = 500;

/**
 * POST /api/coursera/prune-inactive
 *
 * Step 1 — preview (default, nothing is removed):
 *   { "mode": "inactive_days", "days": 60 }
 *   { "mode": "free_seats", "seats": 150 }
 *
 * Step 2 — execute (pass back the emails you reviewed):
 *   { "mode": "free_seats", "seats": 150, "dryRun": false, "confirmEmails": [...] }
 *
 * On execute, the plan is rebuilt live and only emails that are BOTH in
 * confirmEmails AND still in the fresh plan are removed. Anyone who became
 * active between preview and confirm is automatically spared.
 *
 * Optional: graceDays (default 14), protectedEmails [], softDelete (default true).
 */
export async function POST(request: NextRequest) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const denied = await denyApiUnlessAccess('data_management.coursera_enroll', 'edit');
  if (denied) return denied;

  const rateLimit = checkRateLimit(`coursera-prune:${user.id}`, 5, 60 * 1000);
  if (!rateLimit.allowed) {
    const retrySec = Math.ceil(rateLimit.resetTimeMs / 1000);
    return NextResponse.json(
      { error: `Too many prune requests. Wait ${retrySec}s.` },
      { status: 429, headers: { 'Retry-After': String(retrySec) } }
    );
  }

  let body: {
    mode?: 'inactive_days' | 'free_seats';
    days?: number;
    seats?: number;
    graceDays?: number;
    protectedEmails?: string[];
    dryRun?: boolean;
    confirmEmails?: string[];
    softDelete?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  // ── Validate criteria ──
  let criteria: PruneCriteria;
  if (body.mode === 'inactive_days') {
    const days = Number(body.days);
    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      return NextResponse.json({ error: '"days" must be an integer between 1 and 3650.' }, { status: 400 });
    }
    criteria = { mode: 'inactive_days', days };
  } else if (body.mode === 'free_seats') {
    const seats = Number(body.seats);
    if (!Number.isInteger(seats) || seats < 1 || seats > MAX_REMOVALS_PER_REQUEST) {
      return NextResponse.json(
        { error: `"seats" must be an integer between 1 and ${MAX_REMOVALS_PER_REQUEST}.` },
        { status: 400 }
      );
    }
    criteria = { mode: 'free_seats', seats };
  } else {
    return NextResponse.json({ error: '"mode" must be "inactive_days" or "free_seats".' }, { status: 400 });
  }

  const graceDays = body.graceDays === undefined ? 14 : Number(body.graceDays);
  if (!Number.isInteger(graceDays) || graceDays < 0 || graceDays > 365) {
    return NextResponse.json({ error: '"graceDays" must be an integer between 0 and 365.' }, { status: 400 });
  }

  const protectedEmails = Array.isArray(body.protectedEmails)
    ? body.protectedEmails.map(e => String(e).toLowerCase().trim()).filter(Boolean)
    : [];

  const dryRun = body.dryRun !== false;
  const softDelete = body.softDelete !== false;

  // ── Build plan (live from Coursera) ──
  let plan;
  try {
    plan = await buildPrunePlan(criteria, { graceDays, protectedEmails });
  } catch (err: any) {
    console.error('[coursera/prune-inactive] plan error:', err);
    return NextResponse.json({ error: `Could not read program members: ${err.message}` }, { status: 502 });
  }

  if (plan.totalMembers === 0) {
    return NextResponse.json(
      { error: 'Coursera returned no program members. Check credentials / program ID before retrying.' },
      { status: 502 }
    );
  }

  if (dryRun) {
    return NextResponse.json({ dryRun: true, plan });
  }

  // ── Execute ──
  if (!Array.isArray(body.confirmEmails) || body.confirmEmails.length === 0) {
    return NextResponse.json(
      { error: 'Execution requires "confirmEmails" — the list you reviewed in the preview.' },
      { status: 400 }
    );
  }
  if (body.confirmEmails.length > MAX_REMOVALS_PER_REQUEST) {
    return NextResponse.json(
      { error: `Maximum ${MAX_REMOVALS_PER_REQUEST} removals per request.` },
      { status: 400 }
    );
  }

  const confirmed = new Set(body.confirmEmails.map(e => String(e).toLowerCase().trim()));
  const toRemove = plan.candidates.filter(c => confirmed.has(c.email));
  const sparedEmails = [...confirmed].filter(e => !toRemove.some(c => c.email === e));

  const results = await batchRemoveCourseraMembers(
    toRemove.map(c => ({ email: c.email, externalId: c.externalId })),
    softDelete
  );

  const succeeded = results.filter(r => r.success).length;

  console.info(
    `[coursera/prune-inactive] user=${user.id} mode=${criteria.mode} removed=${succeeded}/${results.length} spared=${sparedEmails.length} softDelete=${softDelete}`
  );

  return NextResponse.json({
    dryRun: false,
    criteria,
    softDelete,
    summary: {
      requested: confirmed.size,
      attempted: results.length,
      succeeded,
      failed: results.length - succeeded,
      spared: sparedEmails.length,
    },
    sparedEmails, // confirmed but no longer in the plan (became active, protected, etc.)
    results,
  });
}
