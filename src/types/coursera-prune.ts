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

/** Result of a prune preview: the plan plus the id that execution must reference. */
export interface PrunePreview {
  previewId: string;
  graceDays: number;
  expiresAt: string;
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

export interface PrunedAccount {
  email: string;
  fullName: string | null;
  lastSeenAt: string | null;
  lastSeenSource: LastSeenSource | null;
  daysInactive: number | null;
  coursesCount: number | null;
  message: string;
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
