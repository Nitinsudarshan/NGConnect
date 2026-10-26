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
 * This module only PLANS. Removal happens in the route after confirmation.
 */

import {
  getCourseraProgramMembers,
  batchFetchCourseraUserEnrollmentActivity,
  CourseraProgramMember,
} from '@/lib/coursera-api';

const DAY_MS = 24 * 60 * 60 * 1000;

export type PruneCriteria =
  | { mode: 'inactive_days'; days: number }
  | { mode: 'free_seats'; seats: number };

export interface PruneOptions {
  /** Skip anyone who joined the program within this many days (default 14). */
  graceDays?: number;
  /** Emails that must never be removed (staff, test accounts, etc.). */
  protectedEmails?: string[];
}

export interface PruneCandidate {
  email: string;
  externalId: string;
  fullName: string;
  coursesCount: number;
  lastSeenAt: string | null;
  lastSeenSource: 'activity' | 'enrollment' | 'joined' | 'never';
  daysInactive: number | null; // null = never active, no dates at all
  rank: number; // 1 = most inactive
}

export interface PrunePlan {
  criteria: PruneCriteria;
  generatedAt: string;
  totalMembers: number;
  eligibleMembers: number; // after grace period + protected list
  skipped: { inGracePeriod: number; protected: number; activityLookupFailed: number };
  candidates: PruneCandidate[];
}

export async function buildPrunePlan(
  criteria: PruneCriteria,
  options: PruneOptions = {}
): Promise<PrunePlan> {
  const now = Date.now();
  const graceDays = options.graceDays ?? 14;
  const protectedSet = new Set((options.protectedEmails || []).map(e => e.toLowerCase().trim()));

  const members = await getCourseraProgramMembers();

  const skipped = { inGracePeriod: 0, protected: 0, activityLookupFailed: 0 };
  const eligible: CourseraProgramMember[] = [];

  for (const m of members) {
    if (protectedSet.has(m.email) || protectedSet.has(m.externalId.toLowerCase())) {
      skipped.protected++;
      continue;
    }
    if (m.joinedAt && now - m.joinedAt < graceDays * DAY_MS) {
      skipped.inGracePeriod++;
      continue;
    }
    eligible.push(m);
  }

  // enrollmentReports is keyed by externalId (which NGConnect sets to email)
  const activity = await batchFetchCourseraUserEnrollmentActivity(eligible.map(m => m.externalId));

  const scored = eligible.map(m => {
    const act = activity.get(m.externalId.toLowerCase().trim());
    if (!act) skipped.activityLookupFailed++;

    let lastSeen: number | null = null;
    let source: PruneCandidate['lastSeenSource'] = 'never';
    if (act?.latestActivity) {
      lastSeen = act.latestActivity;
      source = 'activity';
    } else if (act?.earliestEnrollment) {
      lastSeen = act.earliestEnrollment;
      source = 'enrollment';
    } else if (m.joinedAt) {
      lastSeen = m.joinedAt;
      source = 'joined';
    }

    return { member: m, act, lastSeen, source };
  });

  // Members whose activity lookup failed are excluded — we won't remove
  // someone just because the API hiccupped.
  const rankable = scored.filter(s => s.act);

  // Most inactive first: no date at all, then oldest last-seen.
  rankable.sort((a, b) => {
    if (a.lastSeen === null && b.lastSeen === null) return 0;
    if (a.lastSeen === null) return -1;
    if (b.lastSeen === null) return 1;
    return a.lastSeen - b.lastSeen;
  });

  const ranked: PruneCandidate[] = rankable.map((s, i) => ({
    email: s.member.email,
    externalId: s.member.externalId,
    fullName: s.member.fullName,
    coursesCount: s.act?.coursesCount ?? 0,
    lastSeenAt: s.lastSeen ? new Date(s.lastSeen).toISOString() : null,
    lastSeenSource: s.source,
    daysInactive: s.lastSeen ? Math.floor((now - s.lastSeen) / DAY_MS) : null,
    rank: i + 1,
  }));

  let candidates: PruneCandidate[];
  if (criteria.mode === 'inactive_days') {
    candidates = ranked.filter(c => c.daysInactive === null || c.daysInactive > criteria.days);
  } else {
    candidates = ranked.slice(0, criteria.seats);
  }

  return {
    criteria,
    generatedAt: new Date(now).toISOString(),
    totalMembers: members.length,
    eligibleMembers: eligible.length,
    skipped,
    candidates,
  };
}
