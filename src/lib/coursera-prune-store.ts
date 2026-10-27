import { createAdminClient } from '@/lib/supabase/admin';
import { writeAuditEntry } from '@/lib/audit';
import { DEFAULT_GRACE_DAYS, PREVIEW_VALID_DAYS, SCAN_RESUME_HOURS } from '@/lib/coursera-prune-schema';
import { rankScannedMembers, type ScannedMember } from '@/lib/coursera-prune';
import type { CourseraProgramMember } from '@/lib/coursera-api';
import type {
  InactivityScan,
  LastSeenSource,
  PruneCandidate,
  PruneCriteria,
  PruneExecutionResult,
  PrunedAccount,
  PrunePlan,
  PrunePreview,
  PruneRunKind,
  PruneRunProgress,
  PruneRunSummary,
  ProtectedAccount,
  PruneMode,
  RunStatus,
  ScanProgress,
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
  createdByEmail: string | null;
  criteria: PruneCriteria;
  graceDays: number;
  executedRunId: string | null;
  scannedAt: string;
  totalMembers: number;
  eligibleMembers: number;
  skipped: PrunePlan['skipped'];
  candidates: PruneCandidate[];
}

export interface StoredExecution {
  id: string;
  status: RunStatus;
  createdBy: string | null;
  criteria: PruneCriteria;
  hardDelete: boolean;
  previewId: string;
  selected: string[];
}

export type RemovalOutcome = 'removed' | 'failed' | 'spared';

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
  outcome: RemovalOutcome;
  message: string;
}

export interface RemovalFilters {
  runId?: string | null;
  from?: string | null;
  to?: string | null;
  includeFailed?: boolean;
}

/** Thrown when a store call fails; routes log it and return a generic 500. */
export class PruneStoreError extends Error {}

const fail = (context: string, error: { message: string }): never => {
  console.error(`[coursera-prune-store] ${context}:`, error.message);
  throw new PruneStoreError(context);
};

const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE = 1000;

const thresholdOf = (criteria: PruneCriteria) =>
  criteria.mode === 'inactive_days' ? criteria.days : criteria.seats;

const criteriaOf = (mode: PruneMode, threshold: number): PruneCriteria =>
  mode === 'inactive_days' ? { mode, days: threshold } : { mode, seats: threshold };

const toMs = (iso: string | null) => (iso ? Date.parse(iso) : null);
const toIso = (ms: number | null) => (ms ? new Date(ms).toISOString() : null);

export const previewExpiresAt = (createdAt: string) => new Date(Date.parse(createdAt) + PREVIEW_VALID_DAYS * DAY_MS);

// ── Step lock ──────────────────────────────────────────────────────────────

/**
 * Takes a short lease on a scan or prune run so only one request works on it
 * at a time (two tabs, a double click). Returns false if someone else holds it.
 */
export async function claimStepLock(runId: string, seconds = 90): Promise<boolean> {
  const now = new Date().toISOString();
  const { data, error } = await createAdminClient()
    .from('coursera_prune_runs')
    .update({ step_lock_until: new Date(Date.now() + seconds * 1000).toISOString() })
    .eq('id', runId)
    .or(`step_lock_until.is.null,step_lock_until.lt.${now}`)
    .select('id');
  if (error) fail('claim step lock', error);
  return !!data && data.length > 0;
}

export async function releaseStepLock(runId: string): Promise<void> {
  const { error } = await createAdminClient().from('coursera_prune_runs').update({ step_lock_until: null }).eq('id', runId);
  if (error) console.error('[coursera-prune-store] release step lock:', error.message);
}

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

// ── Scans (refresh) ────────────────────────────────────────────────────────

interface ScanRunRow {
  id: string;
  status: RunStatus | null;
  created_at: string;
  total_members: number | null;
  checked_count: number | null;
}

const toScanProgress = (r: ScanRunRow): ScanProgress => ({
  scanId: r.id,
  status: r.status ?? 'running',
  startedAt: r.created_at,
  total: r.total_members ?? 0,
  checked: r.checked_count ?? 0,
  done: r.status === 'done',
});

/** A refresh still in progress (started within the resume window), if any. */
export async function getRunningScan(): Promise<ScanProgress | null> {
  const since = new Date(Date.now() - SCAN_RESUME_HOURS * 60 * 60 * 1000).toISOString();
  const { data, error } = await createAdminClient()
    .from('coursera_prune_runs')
    .select('id, status, created_at, total_members, checked_count')
    .eq('kind', 'scan')
    .eq('status', 'running')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) fail('load running scan', error);
  return data ? toScanProgress(data as ScanRunRow) : null;
}

export async function getScanProgress(scanId: string): Promise<ScanProgress | null> {
  const { data, error } = await createAdminClient()
    .from('coursera_prune_runs')
    .select('id, status, created_at, total_members, checked_count')
    .eq('id', scanId)
    .eq('kind', 'scan')
    .maybeSingle();
  if (error) fail('load scan', error);
  return data ? toScanProgress(data as ScanRunRow) : null;
}

/**
 * Starts a refresh: stores the program's member list; activity is checked
 * afterwards a batch at a time. Abandoned refreshes are marked failed.
 */
export async function startScan(members: CourseraProgramMember[], actor: Actor): Promise<ScanProgress> {
  const db = createAdminClient();

  const { error: staleError } = await db
    .from('coursera_prune_runs')
    .update({ status: 'failed', completed_at: new Date().toISOString() })
    .eq('kind', 'scan')
    .eq('status', 'running');
  if (staleError) fail('close stale scans', staleError);

  const { data: run, error } = await db
    .from('coursera_prune_runs')
    .insert({
      kind: 'scan',
      status: 'running',
      created_by: actor.id,
      created_by_email: actor.email,
      grace_days: DEFAULT_GRACE_DAYS,
      total_members: members.length,
      checked_count: 0,
    })
    .select('id, status, created_at, total_members, checked_count')
    .single();
  if (error) fail('create scan', error);

  // Coursera can list the same member twice across pages; keep one row each.
  const unique = new Map(members.map(m => [m.externalId, m]));
  const rows = [...unique.values()].map(m => ({
    scan_id: run!.id,
    external_id: m.externalId,
    email: m.email,
    full_name: m.fullName || null,
    joined_at: toIso(m.joinedAt),
  }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error: insertError } = await db.from('coursera_prune_scan_members').insert(rows.slice(i, i + 500));
    if (insertError) {
      await db.from('coursera_prune_runs').update({ status: 'failed' }).eq('id', run!.id);
      fail('store scan members', insertError);
    }
  }

  if (unique.size !== members.length) {
    await db.from('coursera_prune_runs').update({ total_members: unique.size }).eq('id', run!.id);
  }
  return toScanProgress({ ...(run as ScanRunRow), total_members: unique.size });
}

export interface UncheckedMember {
  externalId: string;
  email: string;
  fullName: string | null;
  joinedAt: string | null;
  attempts: number;
}

export async function nextUncheckedMembers(scanId: string, limit: number): Promise<UncheckedMember[]> {
  const { data, error } = await createAdminClient()
    .from('coursera_prune_scan_members')
    .select('external_id, email, full_name, joined_at, attempts')
    .eq('scan_id', scanId)
    .is('checked_at', null)
    .order('external_id')
    .limit(limit);
  if (error) fail('load unchecked members', error);
  return (data ?? []).map(r => ({
    externalId: r.external_id,
    email: r.email,
    fullName: r.full_name,
    joinedAt: r.joined_at,
    attempts: r.attempts,
  }));
}

export type MemberCheck =
  | { member: UncheckedMember; ok: true; latestActivity: number | null; earliestEnrollment: number | null; coursesCount: number }
  | { member: UncheckedMember; ok: false };

/** Members still unanswered after this many tries are recorded as unreadable. */
const MAX_LOOKUP_ATTEMPTS = 3;

/** Saves one batch of live checks in a single write. */
export async function recordMemberChecks(scanId: string, checks: MemberCheck[]): Promise<void> {
  if (checks.length === 0) return;
  const now = new Date().toISOString();
  const rows = checks.map(c => {
    const base = {
      scan_id: scanId,
      external_id: c.member.externalId,
      email: c.member.email,
      full_name: c.member.fullName,
      joined_at: c.member.joinedAt,
      attempts: c.member.attempts + 1,
    };
    if (c.ok) {
      return {
        ...base,
        checked_at: now,
        lookup_ok: true,
        latest_activity_at: toIso(c.latestActivity),
        earliest_enrollment_at: toIso(c.earliestEnrollment),
        courses_count: c.coursesCount,
      };
    }
    const givesUp = base.attempts >= MAX_LOOKUP_ATTEMPTS;
    return { ...base, checked_at: givesUp ? now : null, lookup_ok: givesUp ? false : null };
  });
  const { error } = await createAdminClient()
    .from('coursera_prune_scan_members')
    .upsert(rows, { onConflict: 'scan_id,external_id' });
  if (error) fail('save member checks', error);
}

/** Updates the scan's checked count; returns how many members are still unchecked. */
export async function updateScanCount(scanId: string, total: number): Promise<number> {
  const db = createAdminClient();
  const { count, error } = await db
    .from('coursera_prune_scan_members')
    .select('external_id', { count: 'exact', head: true })
    .eq('scan_id', scanId)
    .is('checked_at', null);
  if (error) fail('count unchecked members', error);
  const remaining = count ?? 0;
  const { error: updateError } = await db
    .from('coursera_prune_runs')
    .update({ checked_count: total - remaining })
    .eq('id', scanId);
  if (updateError) fail('update scan progress', updateError);
  return remaining;
}

/** Every member a scan recorded, paged past Supabase's 1,000-row limit. */
export async function loadScanMembers(scanId: string): Promise<ScannedMember[]> {
  const db = createAdminClient();
  const members: ScannedMember[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from('coursera_prune_scan_members')
      .select('external_id, email, full_name, joined_at, lookup_ok, latest_activity_at, earliest_enrollment_at, courses_count')
      .eq('scan_id', scanId)
      .order('external_id')
      .range(from, from + PAGE - 1);
    if (error) fail('load scan members', error);
    for (const r of data ?? []) {
      members.push({
        externalId: r.external_id,
        email: r.email,
        fullName: r.full_name ?? '',
        joinedAt: toMs(r.joined_at),
        lookupOk: r.lookup_ok,
        latestActivityAt: toMs(r.latest_activity_at),
        earliestEnrollmentAt: toMs(r.earliest_enrollment_at),
        coursesCount: r.courses_count,
      });
    }
    if (!data || data.length < PAGE) break;
  }
  return members;
}

/** Marks a scan done and stores the overview summary (no emails) for fast page loads. */
export async function finalizeScan(scanId: string): Promise<void> {
  const members = await loadScanMembers(scanId);
  const protectedEmails = await getProtectedEmails();
  const { eligibleMembers, skipped, ranked } = rankScannedMembers(members, { graceDays: DEFAULT_GRACE_DAYS, protectedEmails });

  const { error } = await createAdminClient()
    .from('coursera_prune_runs')
    .update({
      status: 'done',
      completed_at: new Date().toISOString(),
      total_members: members.length,
      checked_count: members.length,
      eligible_members: eligibleMembers,
      candidate_count: ranked.length,
      details: { skipped, lastSeen: ranked.map(c => toMs(c.lastSeenAt)) },
    })
    .eq('id', scanId);
  if (error) fail('finalize scan', error);
}

export interface CompletedScan {
  id: string;
  completedAt: string;
}

/** Latest finished refresh, used for previews. */
export async function getLatestCompletedScan(): Promise<CompletedScan | null> {
  const { data, error } = await createAdminClient()
    .from('coursera_prune_runs')
    .select('id, created_at, completed_at')
    .eq('kind', 'scan')
    .eq('status', 'done')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) fail('load latest completed scan', error);
  return data ? { id: data.id, completedAt: data.completed_at ?? data.created_at } : null;
}

/** Most recent finished refresh for the overview cards, or null if none yet. */
export async function getLatestScan(): Promise<InactivityScan | null> {
  const { data, error } = await createAdminClient()
    .from('coursera_prune_runs')
    .select('id, created_at, completed_at, grace_days, total_members, eligible_members, details')
    .eq('kind', 'scan')
    .eq('status', 'done')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) fail('load latest scan', error);
  if (!data) return null;

  return {
    scanId: data.id,
    scannedAt: data.completed_at ?? data.created_at,
    graceDays: data.grace_days ?? DEFAULT_GRACE_DAYS,
    totalMembers: data.total_members ?? 0,
    eligibleMembers: data.eligible_members ?? 0,
    skipped: data.details?.skipped ?? { inGracePeriod: 0, protected: 0, activityLookupFailed: 0 },
    lastSeen: Array.isArray(data.details?.lastSeen) ? data.details.lastSeen : [],
  };
}

// ── Saved prune lists (previews) ───────────────────────────────────────────

/** Saves a preview as a prune list that can be reopened and pruned from later. */
export async function savePreview(
  plan: PrunePlan,
  graceDays: number,
  scan: CompletedScan,
  actor: Actor
): Promise<StoredPreview> {
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
      details: { scanId: scan.id, scannedAt: scan.completedAt, skipped: plan.skipped, candidates: plan.candidates },
    })
    .select('id, created_at')
    .single();
  if (error) fail('save preview', error);

  return {
    id: data!.id,
    createdAt: data!.created_at,
    createdBy: actor.id,
    createdByEmail: actor.email,
    criteria: plan.criteria,
    graceDays,
    executedRunId: null,
    scannedAt: scan.completedAt,
    totalMembers: plan.totalMembers,
    eligibleMembers: plan.eligibleMembers,
    skipped: plan.skipped,
    candidates: plan.candidates,
  };
}

export async function getPreview(previewId: string): Promise<StoredPreview | null> {
  const { data, error } = await createAdminClient()
    .from('coursera_prune_runs')
    .select('id, created_at, created_by, created_by_email, mode, threshold, grace_days, executed_run_id, total_members, eligible_members, details')
    .eq('id', previewId)
    .eq('kind', 'preview')
    .maybeSingle();
  if (error) fail('load preview', error);
  if (!data || !data.mode || data.threshold === null) return null;

  return {
    id: data.id,
    createdAt: data.created_at,
    createdBy: data.created_by,
    createdByEmail: data.created_by_email,
    criteria: criteriaOf(data.mode, data.threshold),
    graceDays: data.grace_days ?? DEFAULT_GRACE_DAYS,
    executedRunId: data.executed_run_id,
    scannedAt: data.details?.scannedAt ?? data.created_at,
    totalMembers: data.total_members ?? 0,
    eligibleMembers: data.eligible_members ?? 0,
    skipped: data.details?.skipped ?? { inGracePeriod: 0, protected: 0, activityLookupFailed: 0 },
    candidates: Array.isArray(data.details?.candidates) ? data.details.candidates : [],
  };
}

/** API shape of a saved list. */
export const toPrunePreview = (p: StoredPreview): PrunePreview => ({
  previewId: p.id,
  createdAt: p.createdAt,
  createdByEmail: p.createdByEmail,
  graceDays: p.graceDays,
  scannedAt: p.scannedAt,
  expiresAt: previewExpiresAt(p.createdAt).toISOString(),
  executedRunId: p.executedRunId,
  plan: {
    criteria: p.criteria,
    generatedAt: p.createdAt,
    totalMembers: p.totalMembers,
    eligibleMembers: p.eligibleMembers,
    skipped: p.skipped,
    candidates: p.candidates,
  },
});

// ── Executions (prunes) ────────────────────────────────────────────────────

/**
 * Creates a prune run for the selected members and atomically marks the list
 * as used. Returns null if the list was already used (double click, replay,
 * second tab), in which case nothing must be removed.
 */
export async function startExecution(
  preview: StoredPreview,
  selected: string[],
  hardDelete: boolean,
  actor: Actor
): Promise<string | null> {
  const db = createAdminClient();

  const { data: run, error } = await db
    .from('coursera_prune_runs')
    .insert({
      kind: 'execute',
      status: 'running',
      created_by: actor.id,
      created_by_email: actor.email,
      mode: preview.criteria.mode,
      threshold: thresholdOf(preview.criteria),
      grace_days: preview.graceDays,
      soft_delete: !hardDelete,
      preview_id: preview.id,
      total_members: preview.totalMembers,
      candidate_count: selected.length,
      succeeded: 0,
      failed: 0,
      spared: 0,
      details: { selected },
    })
    .select('id')
    .single();
  if (error) {
    // The unique index on preview_id refuses a second run for the same list.
    if (error.code === '23505') return null;
    fail('create execution run', error);
  }

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

export async function getExecution(runId: string): Promise<StoredExecution | null> {
  const { data, error } = await createAdminClient()
    .from('coursera_prune_runs')
    .select('id, status, created_by, mode, threshold, soft_delete, preview_id, details')
    .eq('id', runId)
    .eq('kind', 'execute')
    .maybeSingle();
  if (error) fail('load execution', error);
  if (!data || !data.mode || data.threshold === null || !data.preview_id) return null;

  return {
    id: data.id,
    status: data.status ?? 'running',
    createdBy: data.created_by,
    criteria: criteriaOf(data.mode, data.threshold),
    hardDelete: data.soft_delete === false,
    previewId: data.preview_id,
    selected: Array.isArray(data.details?.selected) ? data.details.selected : [],
  };
}

/** Emails a run has already handled (removed, failed, or spared). */
export async function getHandledEmails(runId: string): Promise<Set<string>> {
  const { data, error } = await createAdminClient()
    .from('coursera_removal_log')
    .select('email')
    .eq('run_id', runId)
    .limit(5000);
  if (error) fail('load handled emails', error);
  return new Set((data ?? []).map(r => r.email));
}

/**
 * Logs one batch. Idempotent per (run, email), so a retried batch never
 * double-logs. Throws on failure: the step stops rather than remove more
 * members without a record.
 */
export async function insertRemovalRows(rows: RemovalLogRow[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await createAdminClient()
    .from('coursera_removal_log')
    .upsert(rows, { onConflict: 'run_id,email', ignoreDuplicates: true });
  if (error) fail('write removal log', error);
}

/** Recounts a run from its log and stores the totals; returns its progress. */
export async function refreshExecutionProgress(run: StoredExecution, markDone: boolean): Promise<PruneRunProgress> {
  const db = createAdminClient();
  const { data, error } = await db.from('coursera_removal_log').select('outcome, success').eq('run_id', run.id).limit(5000);
  if (error) fail('count run outcomes', error);

  let removed = 0;
  let failed = 0;
  let spared = 0;
  for (const r of data ?? []) {
    const outcome = r.outcome ?? (r.success ? 'removed' : 'failed');
    if (outcome === 'removed') removed++;
    else if (outcome === 'spared') spared++;
    else failed++;
  }

  const status: RunStatus = markDone ? 'done' : run.status;
  const { error: updateError } = await db
    .from('coursera_prune_runs')
    .update({
      succeeded: removed,
      failed,
      spared,
      ...(markDone ? { status: 'done', completed_at: new Date().toISOString() } : {}),
    })
    .eq('id', run.id);
  if (updateError) fail('update run progress', updateError);

  const processed = removed + failed + spared;
  return { runId: run.id, status, total: run.selected.length, processed, removed, failed, spared, done: status === 'done' };
}

/** App-wide audit entry, so prunes show up next to other destructive changes. */
export async function writePruneAuditEntry(
  runId: string,
  stage: 'started' | 'finished',
  criteria: PruneCriteria,
  hardDelete: boolean,
  counts: Record<string, number>,
  actor: Actor
): Promise<void> {
  await writeAuditEntry(createAdminClient(), {
    table_name: 'coursera_program_memberships',
    record_id: runId,
    field_name: `prune_inactive_${hardDelete ? 'hard' : 'soft'}_delete_${stage}`,
    old_value: null,
    new_value: JSON.stringify({ ...criteria, hardDelete, ...counts }),
    action_type: 'DELETE',
    changed_by_user_id: actor.id,
    changed_by_name: actor.name ?? actor.email,
    changed_by_role: actor.role,
  });
}

/** Full outcome of a prune, rebuilt from its log. */
export async function getExecutionResult(run: StoredExecution): Promise<PruneExecutionResult> {
  const { data, error } = await createAdminClient()
    .from('coursera_removal_log')
    .select('email, full_name, last_seen_at, last_seen_source, days_inactive, courses_count, success, outcome, message')
    .eq('run_id', run.id)
    .order('removed_at', { ascending: true })
    .limit(5000);
  if (error) fail('load run result', error);

  const toAccount = (r: NonNullable<typeof data>[number]): PrunedAccount => ({
    email: r.email,
    fullName: r.full_name,
    lastSeenAt: r.last_seen_at,
    lastSeenSource: r.last_seen_source as LastSeenSource | null,
    daysInactive: r.days_inactive,
    coursesCount: r.courses_count,
    message: r.message ?? '',
  });
  const rows = data ?? [];
  const outcomeOf = (r: (typeof rows)[number]) => r.outcome ?? (r.success ? 'removed' : 'failed');
  const removedAccounts = rows.filter(r => outcomeOf(r) === 'removed').map(toAccount);
  const failedAccounts = rows.filter(r => outcomeOf(r) === 'failed').map(toAccount);
  const sparedEmails = rows.filter(r => outcomeOf(r) === 'spared').map(r => r.email);

  return {
    runId: run.id,
    criteria: run.criteria,
    hardDelete: run.hardDelete,
    summary: {
      requested: run.selected.length,
      attempted: removedAccounts.length + failedAccounts.length,
      succeeded: removedAccounts.length,
      failed: failedAccounts.length,
      spared: sparedEmails.length,
    },
    removedAccounts,
    failedAccounts,
    sparedEmails,
    downloadUrl: `/api/coursera/prune-inactive/removals?runId=${run.id}&format=csv`,
    logWarning:
      run.selected.length > rows.length
        ? `${run.selected.length - rows.length} selected member(s) were not handled because the prune was stopped. Resume it from the prune log.`
        : null,
  };
}

// ── History & removal log ──────────────────────────────────────────────────

const RUN_COLUMNS =
  'id, kind, status, created_at, created_by, created_by_email, mode, threshold, grace_days, soft_delete, total_members, candidate_count, succeeded, failed, spared, preview_id, executed_run_id';

interface RunRow {
  id: string;
  kind: PruneRunKind;
  status: RunStatus | null;
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
    status: r.status,
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
    expiresAt: r.kind === 'preview' ? previewExpiresAt(r.created_at).toISOString() : null,
  }));
}

export async function listRemovals(filters: RemovalFilters) {
  let query = createAdminClient()
    .from('coursera_removal_log')
    .select(
      'run_id, removed_at, mode, threshold, email, external_id, full_name, last_seen_at, last_seen_source, days_inactive, courses_count, soft_delete, success, outcome, message'
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
