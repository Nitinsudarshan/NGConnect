/**
 * Shared shapes for Coursera seat reclamation ("prune inactive").
 * Imported by both the server (planner, routes) and the prune UI, so this file
 * must stay free of server-only imports.
 */

export type PruneMode = 'inactive_days' | 'free_seats';

export type PruneCriteria =
  | { mode: 'inactive_days'; days: number }
  | { mode: 'free_seats'; seats: number };

export type LastSeenSource = 'activity' | 'enrollment' | 'joined' | 'never';

export interface PruneCandidate {
  email: string;
  externalId: string;
  fullName: string;
  coursesCount: number;
  lastSeenAt: string | null;
  lastSeenSource: LastSeenSource;
  daysInactive: number | null; // null = never active, no dates at all
  rank: number; // 1 = most inactive
}

export interface PruneSkipped {
  inGracePeriod: number;
  protected: number;
  activityLookupFailed: number;
}

export interface PrunePlan {
  criteria: PruneCriteria;
  generatedAt: string;
  totalMembers: number;
  eligibleMembers: number; // after grace period + protected list
  skipped: PruneSkipped;
  candidates: PruneCandidate[];
}

export type RunStatus = 'running' | 'done' | 'failed';

/**
 * A saved prune list: a preview built from a completed scan. It can be
 * reopened and pruned from until `expiresAt`, once.
 */
export interface PrunePreview {
  previewId: string;
  createdAt: string;
  createdByEmail: string | null;
  graceDays: number;
  /** When the scan this list was built from finished. */
  scannedAt: string;
  expiresAt: string;
  /** Set once a prune has been started from this list. */
  executedRunId: string | null;
  plan: PrunePlan;
}

/**
 * Program-wide inactivity snapshot used by the overview cards.
 * `lastSeen` holds one epoch-ms value per rankable member (null = never active);
 * no emails are included so the payload stays small and PII-free.
 */
export interface InactivityScan {
  scanId: string;
  scannedAt: string;
  graceDays: number;
  totalMembers: number;
  eligibleMembers: number;
  skipped: PruneSkipped;
  lastSeen: Array<number | null>;
}

/** Progress of a refresh (scan) that checks members a batch at a time. */
export interface ScanProgress {
  scanId: string;
  status: RunStatus;
  startedAt: string;
  total: number;
  checked: number;
  /** Set when the scan cannot continue right now (Coursera cooldown, another tab working). */
  waitMs?: number;
  done: boolean;
}

export interface PrunedAccount {
  email: string;
  fullName: string | null;
  lastSeenAt: string | null;
  lastSeenSource: LastSeenSource | null;
  daysInactive: number | null;
  coursesCount: number | null;
  message: string;
}

/** Progress of a prune that removes members a batch at a time. */
export interface PruneRunProgress {
  runId: string;
  status: RunStatus;
  total: number;
  processed: number;
  removed: number;
  failed: number;
  spared: number;
  waitMs?: number;
  done: boolean;
}

export interface PruneExecutionResult {
  runId: string;
  criteria: PruneCriteria;
  hardDelete: boolean;
  summary: {
    requested: number;
    attempted: number;
    succeeded: number;
    failed: number;
    spared: number;
  };
  removedAccounts: PrunedAccount[];
  failedAccounts: PrunedAccount[];
  sparedEmails: string[];
  downloadUrl: string;
  logWarning: string | null;
}

export type PruneRunKind = 'scan' | 'preview' | 'execute';

export interface PruneRunSummary {
  id: string;
  kind: PruneRunKind;
  status: RunStatus | null;
  createdAt: string;
  createdBy: string | null;
  createdByEmail: string | null;
  mode: PruneMode | null;
  threshold: number | null;
  graceDays: number | null;
  hardDelete: boolean | null;
  totalMembers: number | null;
  candidateCount: number | null;
  succeeded: number | null;
  failed: number | null;
  spared: number | null;
  previewId: string | null;
  executedRunId: string | null;
  /** Previews only: the list can no longer be pruned from after this. */
  expiresAt: string | null;
}

export interface ProtectedAccount {
  email: string;
  note: string | null;
  addedAt: string;
  addedByEmail: string | null;
}

/** Standard route-handler envelope (see rules/api-conventions.md). */
export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
