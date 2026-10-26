import type {
  ApiResult,
  InactivityScan,
  ProtectedAccount,
  PruneCriteria,
  PruneExecutionResult,
  PrunePreview,
  PruneRunProgress,
  PruneRunSummary,
  ScanProgress,
} from '@/types/coursera-prune';

/**
 * Browser-side calls to the prune-inactive API. Each resolves to the `data`
 * payload or throws an Error carrying the server's message.
 */

const BASE = '/api/coursera/prune-inactive';

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      cache: 'no-store',
    });
  } catch {
    throw new Error('Network error. Check your connection and try again.');
  }

  let json: ApiResult<T> | null = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON body (e.g. a platform timeout page)
  }

  if (!res.ok || !json?.success) {
    if (res.status === 504) throw new Error('Coursera took too long to respond. Try again in a minute.');
    throw new Error(json?.error || `Request failed (${res.status}).`);
  }
  return json.data as T;
}

export interface OverviewData {
  latest: InactivityScan | null;
  running: ScanProgress | null;
}

export const fetchOverview = () => call<OverviewData>(`${BASE}/overview`);

/** Starts a refresh, or returns the one already running so it can be resumed. */
export const startScan = () => call<ScanProgress>(`${BASE}/scans`, { method: 'POST' });

export const stepScan = (scanId: string) => call<ScanProgress>(`${BASE}/scans/${scanId}/step`, { method: 'POST' });

export const requestPreview = (criteria: PruneCriteria, graceDays: number) =>
  call<PrunePreview>(BASE, { method: 'POST', body: JSON.stringify({ action: 'preview', ...criteria, graceDays }) });

export const fetchPreview = (previewId: string) => call<PrunePreview>(`${BASE}/previews/${previewId}`);

export const startPrune = (previewId: string, confirmEmails: string[], hardDelete: boolean) =>
  call<PruneRunProgress>(BASE, {
    method: 'POST',
    body: JSON.stringify({ action: 'execute', previewId, confirmEmails, hardDelete }),
  });

export const stepPrune = (runId: string) => call<PruneRunProgress>(`${BASE}/runs/${runId}/step`, { method: 'POST' });

export const fetchPruneResult = (runId: string) => call<PruneExecutionResult>(`${BASE}/runs/${runId}`);

export const fetchRuns = () => call<PruneRunSummary[]>(`${BASE}/runs`);

export const fetchProtected = () => call<ProtectedAccount[]>(`${BASE}/protected`);

export const addProtected = (emails: string[], note?: string) =>
  call<ProtectedAccount[]>(`${BASE}/protected`, { method: 'POST', body: JSON.stringify({ emails, note }) });

export const removeProtected = (email: string) =>
  call<ProtectedAccount[]>(`${BASE}/protected`, { method: 'DELETE', body: JSON.stringify({ email }) });

export const removalsCsvUrl = (runId: string) => `${BASE}/removals?runId=${runId}&format=csv`;
