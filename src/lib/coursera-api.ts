/**
 * Coursera for Business Enterprise API Client (Hardened)
 *
 * Protections & Abuse Prevention:
 * - In-flight Request Coalescing: concurrent calls share a single fetch promise
 * - Circuit Breaker: trips on repeated 429 / 5xx to protect external API quota
 * - Token & Roster Caching with TTL & expiration margins
 * - Rate Limiting & Inter-page Request Throttling
 * - Strict Sanitization of input queries
 */

export interface CourseraEnterpriseUser {
  id: string;
  email: string;
  fullName: string;
  externalId?: string;
  membershipProgramIds?: string[];
  invitationProgramIds?: string[];
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

interface CachedRoster {
  roster: Map<string, CourseraEnterpriseUser>;
  fetchedAt: number;
}

// ── In-Memory Caches ──────────────────────────────────────────────────────────
let cachedToken: CachedToken | null = null;
let cachedRoster: CachedRoster | null = null;
const ROSTER_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

// ── In-Flight Request Coalescing ──────────────────────────────────────────────
let inFlightRosterPromise: Promise<Map<string, CourseraEnterpriseUser>> | null = null;

// ── Circuit Breaker State ─────────────────────────────────────────────────────
interface CircuitBreaker {
  state: 'CLOSED' | 'OPEN';
  consecutiveFailures: number;
  openUntil: number;
}

const circuitBreaker: CircuitBreaker = {
  state: 'CLOSED',
  consecutiveFailures: 0,
  openUntil: 0,
};

const FAILURE_THRESHOLD = 3;
const COOLDOWN_DURATION_MS = 60 * 1000; // 1 minute cooldown

function recordApiSuccess() {
  circuitBreaker.consecutiveFailures = 0;
  circuitBreaker.state = 'CLOSED';
}

function recordApiFailure(statusCode?: number) {
  circuitBreaker.consecutiveFailures += 1;
  // If throttled (429) or repeated server errors (5xx)
  if (statusCode === 429 || circuitBreaker.consecutiveFailures >= FAILURE_THRESHOLD) {
    circuitBreaker.state = 'OPEN';
    circuitBreaker.openUntil = Date.now() + COOLDOWN_DURATION_MS;
    console.warn(`[Coursera API] Circuit Breaker OPENED until ${new Date(circuitBreaker.openUntil).toISOString()} due to ${statusCode || 'failures'}`);
  }
}

function isCircuitOpen(): boolean {
  if (circuitBreaker.state === 'OPEN') {
    if (Date.now() > circuitBreaker.openUntil) {
      // Half-open: allow next attempt
      circuitBreaker.state = 'CLOSED';
      circuitBreaker.consecutiveFailures = 0;
      return false;
    }
    return true;
  }
  return false;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Obtain a valid Coursera OAuth access token using client credentials flow.
 */
export async function getCourseraAccessToken(): Promise<string | null> {
  const clientId = process.env.COURSERA_CLIENT_ID;
  const clientSecret = process.env.COURSERA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  // Use cached token if valid for at least 60 more seconds
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  if (isCircuitOpen()) {
    console.warn('[Coursera API] Circuit breaker is OPEN. Skipping OAuth token request.');
    return null;
  }

  try {
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch('https://api.coursera.com/oauth2/client_credentials/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      recordApiFailure(res.status);
      console.error('[Coursera API] OAuth token request failed:', res.status);
      return null;
    }

    const data = await res.json();
    const expiresIn = Number(data.expires_in) || 1800;

    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    recordApiSuccess();
    return cachedToken.token;
  } catch (err) {
    recordApiFailure();
    console.error('[Coursera API] getCourseraAccessToken error:', err);
    return null;
  }
}

/**
 * Fetches the entire enterprise user directory with:
 * 1. Cache checking
 * 2. In-flight request coalescing
 * 3. Circuit breaker protection
 * 4. Paging throttle (50ms between pages)
 */
export async function getCourseraEnterpriseRoster(forceRefresh = false): Promise<Map<string, CourseraEnterpriseUser>> {
  // Check fresh cache
  if (!forceRefresh && cachedRoster && Date.now() - cachedRoster.fetchedAt < ROSTER_TTL_MS) {
    return cachedRoster.roster;
  }

  // If already in flight, return the ongoing promise to prevent duplicate API requests
  if (inFlightRosterPromise) {
    return inFlightRosterPromise;
  }

  // If circuit breaker is open, fall back to cached data if available
  if (isCircuitOpen()) {
    console.warn('[Coursera API] Circuit is OPEN. Returning stale cache if available.');
    return cachedRoster ? cachedRoster.roster : new Map();
  }

  inFlightRosterPromise = (async () => {
    const orgId = process.env.COURSERA_ORG_ID;
    if (!orgId) {
      return cachedRoster ? cachedRoster.roster : new Map();
    }

    const token = await getCourseraAccessToken();
    if (!token) {
      return cachedRoster ? cachedRoster.roster : new Map();
    }

    const rosterMap = new Map<string, CourseraEnterpriseUser>();
    let start = 0;
    const limit = 1000;
    const MAX_PAGES = 10; // Safety guard: max 10,000 users per fetch cycle
    let pageCount = 0;

    try {
      while (pageCount < MAX_PAGES) {
        pageCount++;
        const url = `https://api.coursera.com/ent/api/businesses.v1/${orgId}/users?limit=${limit}&start=${start}`;
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          recordApiFailure(res.status);
          console.error('[Coursera API] Roster fetch error:', res.status);
          break;
        }

        const data = await res.json();
        const elements: CourseraEnterpriseUser[] = data.elements || [];

        for (const u of elements) {
          if (u.email) {
            rosterMap.set(u.email.toLowerCase().trim(), u);
          }
        }

        recordApiSuccess();

        if (!data.paging?.next || elements.length === 0) {
          break;
        }

        start = Number(data.paging.next);
        // Subtle delay between pagination requests to avoid hitting rate limits
        await sleep(50);
      }

      if (rosterMap.size > 0) {
        cachedRoster = {
          roster: rosterMap,
          fetchedAt: Date.now(),
        };
        return rosterMap;
      }

      return cachedRoster ? cachedRoster.roster : new Map();
    } catch (err) {
      recordApiFailure();
      console.error('[Coursera API] getCourseraEnterpriseRoster error:', err);
      return cachedRoster ? cachedRoster.roster : new Map();
    } finally {
      inFlightRosterPromise = null;
    }
  })();

  return inFlightRosterPromise;
}

/**
 * Checks whether a single email exists in Coursera Enterprise live roster.
 */
export async function checkCourseraUserLive(email: string): Promise<CourseraEnterpriseUser | null> {
  if (!email || email.length > 254) return null;
  const clean = email.toLowerCase().trim();
  const roster = await getCourseraEnterpriseRoster();
  return roster.get(clean) || null;
}

/**
 * Batch checks a list of emails against the live Coursera Enterprise roster.
 */
export async function batchCheckCourseraUsersLive(
  emails: string[]
): Promise<Map<string, CourseraEnterpriseUser | null>> {
  const result = new Map<string, CourseraEnterpriseUser | null>();
  if (!emails || emails.length === 0) return result;

  // Cap batch size to prevent CPU/memory exhaustion
  const cappedEmails = emails.slice(0, 5000);
  const roster = await getCourseraEnterpriseRoster();

  for (const raw of cappedEmails) {
    if (!raw || raw.length > 254) continue;
    const clean = raw.toLowerCase().trim();
    result.set(clean, roster.get(clean) || null);
  }

  return result;
}
