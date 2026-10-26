import { createAdminClient } from '@/lib/supabase/admin';
import { writeAuditEntry } from '@/lib/audit';
import { PREVIEW_TTL_MINUTES } from '@/lib/coursera-prune-schema';
import type { ProgramActivityScan } from '@/lib/coursera-prune';
import type {
  InactivityScan,
  PruneCandidate,
  PruneCriteria,
  PrunePlan,
  PruneRunKind,
  PruneRunSummary,
  ProtectedAccount,
  PruneMode,
} from '@/types/coursera-prune';

/**
 * Persistence for Coursera seat reclamation. Every table here has RLS enabled
 * with no policies, so all access goes through the service-role client and the
 * route handlers' RBAC checks. Server-only.
 */

export interface Actor {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
}

export interface StoredPreview {
  id: string;
  createdAt: string;
  createdBy: string | null;
  criteria: PruneCriteria;
  graceDays: number;
  executedRunId: string | null;
  candidates: PruneCandidate[];
}

export interface RemovalLogRow {
  run_id: string;
  removed_by: string;
  mode: PruneMode;
  threshold: number;
  email: string;
  external_id: string;
  full_name: string | null;
  last_seen_at: string | null;
  last_seen_source: string | null;
  days_inactive: number | null;
  courses_count: number | null;
  soft_delete: boolean;
  success: boolean;
  message: string;
}

export interface RemovalFilters {
  runId?: string | null;
  from?: string | null;
  to?: string | null;
  includeFailed?: boolean;
}

const RUN_COLUMNS =
  'id, kind, created_at, created_by, created_by_email, mode, threshold, grace_days, soft_delete, total_members, candidate_count, succeeded, failed, spared, preview_id, executed_run_id';

interface RunRow {
  id: string;
  kind: PruneRunKind;
  created_at: string;
  created_by: string | null;
  created_by_email: string | null;
  mode: PruneMode | null;
  threshold: number | null;
  grace_days: number | null;
  soft_delete: boolean | null;
  total_members: number | null;
  candidate_count: number | null;
  succeeded: number | null;
  failed: number | null;
  spared: number | null;
  preview_id: string | null;
  executed_run_id: string | null;
}

const thresholdOf = (criteria: PruneCriteria) =>
  criteria.mode === 'inactive_days' ? criteria.days : criteria.seats;

const criteriaOf = (mode: PruneMode, threshold: number): PruneCriteria =>
  mode === 'inactive_days' ? { mode, days: threshold } : { mode, seats: threshold };

/** Thrown when a store call fails; routes log it and return a generic 500. */
export class PruneStoreError extends Error {}

const fail = (context: string, error: { message: string }): never => {
  console.error(`[coursera-prune-store] ${context}:`, error.message);
  throw new PruneStoreError(context);
};

// ── Protected accounts ─────────────────────────────────────────────────────

export async function listProtectedAccounts(): Promise<ProtectedAccount[]> {
  const { data, error } = await createAdminClient()
    .from('coursera_prune_protected')
    .select('email, note, added_at, added_by_email')
    .order('added_at', { ascending: false });
  if (error) fail('list protected accounts', error);
  return (data ?? []).map(r => ({
    email: r.email,
    note: r.note,
    addedAt: r.added_at,
    addedByEmail: r.added_by_email,
  }));
}

export async function getProtectedEmails(): Promise<string[]> {
  return (await listProtectedAccounts()).map(a => a.email);
}

export async function addProtectedAccounts(emails: string[], note: string | undefined, actor: Actor): Promise<void> {
  const rows = [...new Set(emails)].map(email => ({
    email,
    note: note || null,
    added_by: actor.id,
    added_by_email: actor.email,
  }));
  const { error } = await createAdminClient()
    .from('coursera_prune_protected')
    .upsert(rows, { onConflict: 'email', ignoreDuplicates: true });
  if (error) fail('add protected accounts', error);
}

export async function removeProtectedAccount(email: string): Promise<void> {
  const { error } = await createAdminClient().from('coursera_prune_protected').delete().eq('email', email);
  if (error) fail('remove protected account', error);
}

// ── Scans (overview) ───────────────────────────────────────────────────────

export async function saveScan(scan: ProgramActivityScan, graceDays: number, actor: Actor): Promise<InactivityScan> {
  const lastSeen = scan.ranked.map(c => (c.lastSeenAt ? Date.parse(c.lastSeenAt) : null));
  const { data, error } = await createAdminClient()
    .from('coursera_prune_runs')
    .insert({
      kind: 'scan',
      created_by: actor.id,
      created_by_email: actor.email,
      grace_days: graceDays,
      total_members: scan.totalMembers,
      eligible_members: scan.eligibleMembers,
      candidate_count: scan.ranked.length,
      details: { skipped: scan.skipped, lastSeen },
    })
    .select('id, created_at')
    .single();
  if (error) fail('save scan', error);

  return {
    scanId: data!.id,
    scannedAt: data!.created_at,
    graceDays,
    totalMembers: scan.totalMembers,
    eligibleMembers: scan.eligibleMembers,
    skipped: scan.skipped,
    lastSeen,
  };
}

/** Most recent overview scan, or null if none has been run yet. */
export async function getLatestScan(): Promise<InactivityScan | null> {
  const { data, error } = await createAdminClient()
    .from('coursera_prune_runs')
    .select('id, created_at, grace_days, total_members, eligible_members, details')
    .eq('kind', 'scan')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) fail('load latest scan', error);
  if (!data) return null;

  return {
    scanId: data.id,
    scannedAt: data.created_at,
    graceDays: data.grace_days ?? 0,
    totalMembers: data.total_members ?? 0,
    eligibleMembers: data.eligible_members ?? 0,
    skipped: data.details?.skipped ?? { inGracePeriod: 0, protected: 0, activityLookupFailed: 0 },
    lastSeen: Array.isArray(data.details?.lastSeen) ? data.details.lastSeen : [],
  };
}

// ── Previews ───────────────────────────────────────────────────────────────

/** Logs a preview with its full candidate list; execution must reference it. */
export async function savePreview(plan: PrunePlan, graceDays: number, actor: Actor): Promise<{ id: string; createdAt: string }> {
  const { data, error } = await createAdminClient()
    .from('coursera_prune_runs')
    .insert({
      kind: 'preview',
      created_by: actor.id,
      created_by_email: actor.email,
      mode: plan.criteria.mode,
      threshold: thresholdOf(plan.criteria),
      grace_days: graceDays,
      total_members: plan.totalMembers,
      eligible_members: plan.eligibleMembers,
      candidate_count: plan.candidates.length,
      details: { skipped: plan.skipped, candidates: plan.candidates },
    })
    .select('id, created_at')
    .single();
  if (error) fail('save preview', error);
  return { id: data!.id, createdAt: data!.created_at };
}

export async function getPreview(previewId: string): Promise<StoredPreview | null> {
  const { data, error } = await createAdminClient()
    .from('coursera_prune_runs')
    .select('id, created_at, created_by, mode, threshold, grace_days, executed_run_id, details')
    .eq('id', previewId)
    .eq('kind', 'preview')
    .maybeSingle();
  if (error) fail('load preview', error);
  if (!data || !data.mode || data.threshold === null) return null;

  return {
    id: data.id,
    createdAt: data.created_at,
    createdBy: data.created_by,
    criteria: criteriaOf(data.mode, data.threshold),
    graceDays: data.grace_days ?? 0,
    executedRunId: data.executed_run_id,
    candidates: Array.isArray(data.details?.candidates) ? data.details.candidates : [],
  };
}

export const previewExpiresAt = (createdAt: string) =>
  new Date(Date.parse(createdAt) + PREVIEW_TTL_MINUTES * 60 * 1000);

// ── Executions ─────────────────────────────────────────────────────────────

/**
 * Creates the execution run and atomically marks the preview as used.
 * Returns null if the preview was already executed (double-click, replay,
 * second tab), in which case nothing must be removed.
 */
export async function claimPreviewForExecution(
  preview: StoredPreview,
  hardDelete: boolean,
  actor: Actor
): Promise<string | null> {
  const db = createAdminClient();

  const { data: run, error } = await db
    .from('coursera_prune_runs')
    .insert({
      kind: 'execute',
      created_by: actor.id,
      created_by_email: actor.email,
      mode: preview.criteria.mode,
      threshold: thresholdOf(preview.criteria),
      grace_days: preview.graceDays,
      soft_delete: !hardDelete,
      preview_id: preview.id,
    })
    .select('id')
    .single();
  if (error) fail('create execution run', error);

  const { data: claimed, error: claimError } = await db
    .from('coursera_prune_runs')
    .update({ executed_run_id: run!.id })
    .eq('id', preview.id)
    .is('executed_run_id', null)
    .select('id');
  if (claimError) fail('claim preview', claimError);

  if (!claimed || claimed.length === 0) {
    await db.from('coursera_prune_runs').delete().eq('id', run!.id);
    return null;
  }
  return run!.id;
}

export async function completeExecution(
  runId: string,
  summary: { totalMembers: number; attempted: number; succeeded: number; failed: number; spared: number; sparedEmails: string[]; logWarning: string | null }
): Promise<void> {
  const { error } = await createAdminClient()
    .from('coursera_prune_runs')
    .update({
      total_members: summary.totalMembers,
      candidate_count: summary.attempted,
      succeeded: summary.succeeded,
      failed: summary.failed,
      spared: summary.spared,
      details: { sparedEmails: summary.sparedEmails, logWarning: summary.logWarning },
    })
    .eq('id', runId);
  if (error) console.error('[coursera-prune-store] complete execution:', error.message);
}

/** Returns an error message instead of throwing: a logging failure must not hide what was removed. */
export async function insertRemovalRows(rows: RemovalLogRow[]): Promise<string | null> {
  if (rows.length === 0) return null;
  const { error } = await createAdminClient().from('coursera_removal_log').insert(rows);
  if (error) {
    console.error('[coursera-prune-store] write removal log:', error.message);
    return 'The removal log could not be saved. Download the list below before leaving this page.';
  }
  return null;
}

/** App-wide audit entry for an execution, so prunes show up next to other destructive changes. */
export async function writePruneAuditEntry(
  runId: string,
  criteria: PruneCriteria,
  hardDelete: boolean,
  counts: { succeeded: number; failed: number },
  actor: Actor
): Promise<void> {
  await writeAuditEntry(createAdminClient(), {
    table_name: 'coursera_program_memberships',
    record_id: runId,
    field_name: hardDelete ? 'prune_inactive_hard_delete' : 'prune_inactive_soft_delete',
    old_value: null,
    new_value: JSON.stringify({ ...criteria, hardDelete, removed: counts.succeeded, failed: counts.failed }),
    action_type: 'DELETE',
    changed_by_user_id: actor.id,
    changed_by_name: actor.name ?? actor.email,
    changed_by_role: actor.role,
  });
}

// ── History & removal log ──────────────────────────────────────────────────

export async function listRuns(kinds: PruneRunKind[], limit = 50): Promise<PruneRunSummary[]> {
  const { data, error } = await createAdminClient()
    .from('coursera_prune_runs')
    .select(RUN_COLUMNS)
    .in('kind', kinds)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) fail('list runs', error);

  return ((data ?? []) as RunRow[]).map(r => ({
    id: r.id,
    kind: r.kind,
    createdAt: r.created_at,
    createdBy: r.created_by,
    createdByEmail: r.created_by_email,
    mode: r.mode,
    threshold: r.threshold,
    graceDays: r.grace_days,
    hardDelete: r.soft_delete === null ? null : !r.soft_delete,
    totalMembers: r.total_members,
    candidateCount: r.candidate_count,
    succeeded: r.succeeded,
    failed: r.failed,
    spared: r.spared,
    previewId: r.preview_id,
    executedRunId: r.executed_run_id,
  }));
}

export async function listRemovals(filters: RemovalFilters) {
  let query = createAdminClient()
    .from('coursera_removal_log')
    .select(
      'run_id, removed_at, mode, threshold, email, external_id, full_name, last_seen_at, last_seen_source, days_inactive, courses_count, soft_delete, success, message'
    )
    .order('removed_at', { ascending: false })
    .limit(5000);

  if (filters.runId) query = query.eq('run_id', filters.runId);
  if (filters.from) query = query.gte('removed_at', `${filters.from}T00:00:00Z`);
  if (filters.to) query = query.lte('removed_at', `${filters.to}T23:59:59Z`);
  if (!filters.includeFailed) query = query.eq('success', true);

  const { data, error } = await query;
  if (error) fail('list removals', error);
  return data ?? [];
}
