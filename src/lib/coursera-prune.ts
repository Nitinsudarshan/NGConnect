/**
 * Coursera seat reclamation planner.
 *
 * Two modes, one ranking:
 *   - inactive_days: everyone whose last activity is older than N days
 *   - free_seats:    the N most inactive members, regardless of threshold
 *
 * "Last seen" = latest course activity, falling back to earliest course
 * enrollment, then to the program join date. Members with no signal at all
 * are treated as the most inactive (they never started).
 *
 * Everything here is pure: it ranks members from a stored scan (see
 * coursera-prune-store) and decides what to do with a member after a live
 * re-check. Coursera is only called by the batched scan and prune steps.
 */

import { DEFAULT_GRACE_DAYS } from '@/lib/coursera-prune-schema';
import type { LastSeenSource, PruneCandidate, PruneCriteria, PrunePlan, PruneSkipped } from '@/types/coursera-prune';

export type { PruneCandidate, PruneCriteria, PrunePlan } from '@/types/coursera-prune';

const DAY_MS = 24 * 60 * 60 * 1000;

/** One member as recorded by a scan. Timestamps are epoch ms. */
export interface ScannedMember {
  externalId: string;
  email: string;
  fullName: string;
  joinedAt: number | null;
  /** false = Coursera never answered for this member; null = not checked yet. */
  lookupOk: boolean | null;
  latestActivityAt: number | null;
  earliestEnrollmentAt: number | null;
  coursesCount: number | null;
}

export interface RankOptions {
  /** Skip anyone who joined the program within this many days (default 14). */
  graceDays?: number;
  /** Emails that must never be removed (staff, test accounts, etc.). */
  protectedEmails?: string[];
  now?: number;
}

export interface RankedMembers {
  totalMembers: number;
  eligibleMembers: number;
  skipped: PruneSkipped;
  /** Every rankable member, most inactive first. */
  ranked: PruneCandidate[];
}

/** Last-seen time and where it came from, using the activity → enrolment → joined fallback. */
export function lastSeenOf(
  latestActivityAt: number | null,
  earliestEnrollmentAt: number | null,
  joinedAt: number | null
): { lastSeen: number | null; source: LastSeenSource } {
  if (latestActivityAt) return { lastSeen: latestActivityAt, source: 'activity' };
  if (earliestEnrollmentAt) return { lastSeen: earliestEnrollmentAt, source: 'enrollment' };
  if (joinedAt) return { lastSeen: joinedAt, source: 'joined' };
  return { lastSeen: null, source: 'never' };
}

/**
 * Ranks scanned members most-inactive first, after removing protected
 * accounts, members still in their grace period, and members whose activity
 * could not be read. Shared by the overview cards and the planner.
 */
export function rankScannedMembers(members: ScannedMember[], options: RankOptions = {}): RankedMembers {
  const now = options.now ?? Date.now();
  const graceDays = options.graceDays ?? DEFAULT_GRACE_DAYS;
  const protectedSet = new Set((options.protectedEmails || []).map(e => e.toLowerCase().trim()));

  const skipped: PruneSkipped = { inGracePeriod: 0, protected: 0, activityLookupFailed: 0 };
  let eligibleMembers = 0;
  const scored: Array<{ m: ScannedMember; lastSeen: number | null; source: LastSeenSource }> = [];

  for (const m of members) {
    if (protectedSet.has(m.email) || protectedSet.has(m.externalId.toLowerCase())) {
      skipped.protected++;
      continue;
    }
    if (m.joinedAt && now - m.joinedAt < graceDays * DAY_MS) {
      skipped.inGracePeriod++;
      continue;
    }
    eligibleMembers++;
    // Members whose activity lookup failed are excluded — we won't remove
    // someone just because the API hiccupped.
    if (m.lookupOk !== true) {
      skipped.activityLookupFailed++;
      continue;
    }
    scored.push({ m, ...lastSeenOf(m.latestActivityAt, m.earliestEnrollmentAt, m.joinedAt) });
  }

  // Most inactive first: no date at all, then oldest last-seen.
  scored.sort((a, b) => {
    if (a.lastSeen === null && b.lastSeen === null) return 0;
    if (a.lastSeen === null) return -1;
    if (b.lastSeen === null) return 1;
    return a.lastSeen - b.lastSeen;
  });

  const ranked: PruneCandidate[] = scored.map((s, i) => ({
    email: s.m.email,
    externalId: s.m.externalId,
    fullName: s.m.fullName,
    coursesCount: s.m.coursesCount ?? 0,
    lastSeenAt: s.lastSeen ? new Date(s.lastSeen).toISOString() : null,
    lastSeenSource: s.source,
    daysInactive: s.lastSeen ? Math.floor((now - s.lastSeen) / DAY_MS) : null,
    rank: i + 1,
  }));

  return { totalMembers: members.length, eligibleMembers, skipped, ranked };
}

/**
 * Builds the list of members a prune with `criteria` would remove, from a scan.
 */
export function buildPlanFromScan(
  criteria: PruneCriteria,
  members: ScannedMember[],
  options: RankOptions = {}
): PrunePlan {
  const now = options.now ?? Date.now();
  const { totalMembers, eligibleMembers, skipped, ranked } = rankScannedMembers(members, { ...options, now });

  const candidates =
    criteria.mode === 'inactive_days'
      ? ranked.filter(c => c.daysInactive === null || c.daysInactive > criteria.days)
      : ranked.slice(0, criteria.seats);

  return { criteria, generatedAt: new Date(now).toISOString(), totalMembers, eligibleMembers, skipped, candidates };
}

export type RecheckDecision = { action: 'remove' } | { action: 'spare'; reason: string };

/**
 * Decides, after a live re-check just before removal, whether a member from a
 * saved prune list is still removed. Anyone with activity newer than the list
 * recorded is spared, and in days mode anyone now under the threshold.
 */
export function decideAfterRecheck(
  candidate: Pick<PruneCandidate, 'lastSeenAt' | 'lastSeenSource'>,
  live: { latestActivity: number | null; earliestEnrollment: number | null },
  criteria: PruneCriteria,
  now = Date.now()
): RecheckDecision {
  const previous = candidate.lastSeenAt ? Date.parse(candidate.lastSeenAt) : null;
  // The join date isn't re-read live; keep the list's value when that was the only signal.
  const joinedAt = candidate.lastSeenSource === 'joined' ? previous : null;
  const { lastSeen } = lastSeenOf(live.latestActivity, live.earliestEnrollment, joinedAt);

  if (lastSeen !== null && (previous === null || lastSeen > previous)) {
    return { action: 'spare', reason: 'Active since the list was made' };
  }
  if (criteria.mode === 'inactive_days' && lastSeen !== null && Math.floor((now - lastSeen) / DAY_MS) <= criteria.days) {
    return { action: 'spare', reason: `Active within the last ${criteria.days} days` };
  }
  return { action: 'remove' };
}
