import type { LastSeenSource, PruneCriteria } from '@/types/coursera-prune';

export const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Members whose last activity is before `cutoffMs` (or who never started).
 * Mirrors the planner's inactive_days filter, using the stored scan.
 */
export const countInactiveSince = (lastSeen: Array<number | null>, cutoffMs: number) =>
  lastSeen.filter(t => t === null || t < cutoffMs).length;

export const countNeverActive = (lastSeen: Array<number | null>) => lastSeen.filter(t => t === null).length;

/** yyyy-mm-dd for `<input type="date">`, in local time. */
export const toDateInputValue = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 10);
};

/** Parses a yyyy-mm-dd input value as local midnight. */
export const fromDateInputValue = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Whole days between `date` and now. */
export const daysAgo = (date: Date) => Math.floor((Date.now() - date.getTime()) / DAY_MS);

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const formatNumber = (n: number) => n.toLocaleString();

export const SOURCE_LABELS: Record<LastSeenSource, string> = {
  activity: 'Course activity',
  enrollment: 'Enrolled only',
  joined: 'Joined only',
  never: 'Never started',
};

export const describeCriteria = (criteria: PruneCriteria) =>
  criteria.mode === 'inactive_days'
    ? `Inactive for more than ${criteria.days} days`
    : `${criteria.seats} most inactive members`;
