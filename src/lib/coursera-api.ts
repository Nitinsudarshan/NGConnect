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

// ── Pending Invitations Roster ───────────────────────────────────────────────

export interface CourseraPendingInvitation {
  id: string;
  email: string;
  fullName: string;
  externalId?: string;
  createdAt?: number;
}

let cachedInvitations: { invitations: Map<string, CourseraPendingInvitation>; fetchedAt: number } | null = null;
const INVITATIONS_TTL_MS = 5 * 60 * 1000; // 5 minutes cache
let inFlightInvitationsPromise: Promise<Map<string, CourseraPendingInvitation>> | null = null;

/**
 * Fetches all pending invitations for the configured Coursera program with caching & request coalescing.
 */
export async function getCourseraPendingInvitations(): Promise<Map<string, CourseraPendingInvitation>> {
  if (cachedInvitations && Date.now() - cachedInvitations.fetchedAt < INVITATIONS_TTL_MS) {
    return cachedInvitations.invitations;
  }

  if (inFlightInvitationsPromise) {
    return inFlightInvitationsPromise;
  }

  inFlightInvitationsPromise = (async () => {
    const orgId = process.env.COURSERA_ORG_ID;
    const progId = process.env.COURSERA_PROGRAM_ID || 'WsV-YttFEeq-fw5R5-S6kw';
    if (!orgId || !progId) {
      return cachedInvitations ? cachedInvitations.invitations : new Map();
    }

    const token = await getCourseraAccessToken();
    if (!token) {
      return cachedInvitations ? cachedInvitations.invitations : new Map();
    }

    const invMap = new Map<string, CourseraPendingInvitation>();
    let start = 0;
    const limit = 100;
    const MAX_PAGES = 10;
    let page = 0;

    try {
      while (page < MAX_PAGES) {
        page++;
        const url = `https://api.coursera.com/ent/api/businesses.v1/${orgId}/programs/${progId}/invitations?limit=${limit}&start=${start}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          break;
        }

        const data = await res.json();
        const elements = data.elements || [];
        for (const el of elements) {
          if (el.email) {
            invMap.set(el.email.toLowerCase().trim(), {
              id: el.id,
              email: el.email.toLowerCase().trim(),
              fullName: el.fullName || '',
              externalId: el.externalId,
              createdAt: el.createdAt,
            });
          }
        }

        if (!data.paging?.next || elements.length === 0) {
          break;
        }
        start = Number(data.paging.next);
        await sleep(50);
      }

      if (invMap.size > 0) {
        cachedInvitations = {
          invitations: invMap,
          fetchedAt: Date.now(),
        };
        return invMap;
      }
      return cachedInvitations ? cachedInvitations.invitations : new Map();
    } catch (err) {
      console.error('[Coursera API] getCourseraPendingInvitations error:', err);
      return cachedInvitations ? cachedInvitations.invitations : new Map();
    } finally {
      inFlightInvitationsPromise = null;
    }
  })();

  return inFlightInvitationsPromise;
}

/**
 * Batch checks a list of emails against Coursera pending invitations.
 */
export async function batchCheckCourseraInvitationsLive(
  emails: string[]
): Promise<Map<string, CourseraPendingInvitation | null>> {
  const result = new Map<string, CourseraPendingInvitation | null>();
  if (!emails || emails.length === 0) return result;

  const invMap = await getCourseraPendingInvitations();
  for (const raw of emails) {
    if (!raw || raw.length > 254) continue;
    const clean = raw.toLowerCase().trim();
    result.set(clean, invMap.get(clean) || null);
  }
  return result;
}

// ── Live Learner Enrollment & Activity Dates ─────────────────────────────────

export interface CourseraUserActivity {
  email: string;
  coursesCount: number;
  earliestEnrollment: number | null;
  latestActivity: number | null;
}

const userActivityCache = new Map<string, { activity: CourseraUserActivity; fetchedAt: number }>();
const ACTIVITY_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches real course enrollment date and last activity timestamp for an enterprise user
 * using Coursera's live enrollmentReports endpoint.
 */
export async function fetchCourseraUserEnrollmentActivity(
  email: string
): Promise<CourseraUserActivity | null> {
  if (!email || email.length > 254) return null;
  const cleanEmail = email.toLowerCase().trim();

  // Check in-memory cache
  const cached = userActivityCache.get(cleanEmail);
  if (cached && Date.now() - cached.fetchedAt < ACTIVITY_TTL_MS) {
    return cached.activity;
  }

  if (isCircuitOpen()) {
    return cached ? cached.activity : null;
  }

  const orgId = process.env.COURSERA_ORG_ID;
  if (!orgId) return null;

  const token = await getCourseraAccessToken();
  if (!token) return null;

  try {
    const url = `https://api.coursera.com/ent/api/businesses.v1/${orgId}/enrollmentReports?externalId=${encodeURIComponent(cleanEmail)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      recordApiFailure(res.status);
      return null;
    }

    const data = await res.json();
    const elements: Array<{ enrolledAt?: number; lastActivityAt?: number }> = data.elements || [];

    let earliestEnrollment: number | null = null;
    let latestActivity: number | null = null;

    for (const item of elements) {
      if (item.enrolledAt) {
        if (!earliestEnrollment || item.enrolledAt < earliestEnrollment) {
          earliestEnrollment = item.enrolledAt;
        }
      }
      if (item.lastActivityAt) {
        if (!latestActivity || item.lastActivityAt > latestActivity) {
          latestActivity = item.lastActivityAt;
        }
      }
    }

    const activity: CourseraUserActivity = {
      email: cleanEmail,
      coursesCount: elements.length,
      earliestEnrollment,
      latestActivity,
    };

    userActivityCache.set(cleanEmail, { activity, fetchedAt: Date.now() });
    recordApiSuccess();
    return activity;
  } catch (err) {
    recordApiFailure();
    console.error('[Coursera API] fetchCourseraUserEnrollmentActivity error:', err);
    return null;
  }
}

/**
 * Batch fetches enrollment and activity dates for multiple emails with concurrency limiting.
 */
export async function batchFetchCourseraUserEnrollmentActivity(
  emails: string[]
): Promise<Map<string, CourseraUserActivity>> {
  const result = new Map<string, CourseraUserActivity>();
  if (!emails || emails.length === 0) return result;

  const uniqueEmails = Array.from(new Set(emails.map(e => e.toLowerCase().trim()).filter(Boolean)));
  const CONCURRENCY = 5;

  for (let i = 0; i < uniqueEmails.length; i += CONCURRENCY) {
    const slice = uniqueEmails.slice(i, i + CONCURRENCY);
    const promises = slice.map(email => fetchCourseraUserEnrollmentActivity(email));
    const activities = await Promise.all(promises);

    for (let j = 0; j < slice.length; j++) {
      const act = activities[j];
      if (act) {
        result.set(slice[j], act);
      }
    }

    if (i + CONCURRENCY < uniqueEmails.length) {
      await sleep(25); // Small delay to avoid burst throttling
    }
  }

  return result;
}

// ── Coursera Program Invitations & Memberships ───────────────────────────────

export interface CourseraEnrollmentResult {
  email: string;
  success: boolean;
  action: 'invite' | 'enroll';
  message: string;
  errorCode?: string;
  statusCategory?: 'success' | 'already_invited' | 'already_enrolled' | 'error';
  courseraId?: string;
}

function parseCourseraErrorMessage(errText: string, status: number): {
  message: string;
  errorCode?: string;
  statusCategory: 'already_invited' | 'already_enrolled' | 'error';
} {
  try {
    const json = JSON.parse(errText);
    const code = json.errorCode || json.code;
    const rawMsg = json.message || json.error_description;

    if (code === 'PROGRAM_INVITEE_ERROR_EXISTING_INVITATION_FOR_EMAIL') {
      return {
        message: 'Learner already has a pending invitation waiting to be accepted.',
        errorCode: code,
        statusCategory: 'already_invited',
      };
    }
    if (
      code === 'PROGRAM_MEMBER_ERROR_EXISTING_MEMBERSHIP_FOR_EMAIL' ||
      code === 'PROGRAM_MEMBER_ERROR_EXISTING_USER'
    ) {
      return {
        message: 'Learner is already an active enrolled member of this program.',
        errorCode: code,
        statusCategory: 'already_enrolled',
      };
    }
    if (code === 'EXTERNAL_ID_ALREADY_EXISTS') {
      return {
        message: 'A learner with this external ID already exists in Coursera directory.',
        errorCode: code,
        statusCategory: 'error',
      };
    }
    if (rawMsg) {
      return {
        message: rawMsg,
        errorCode: code,
        statusCategory: 'error',
      };
    }
  } catch {
    // not JSON
  }

  if (status === 429) {
    return {
      message: 'Coursera rate limit reached. Please wait a moment and retry.',
      statusCategory: 'error',
    };
  }

  return {
    message: `Coursera API returned error (${status}): ${errText.slice(0, 150)}`,
    statusCategory: 'error',
  };
}

/**
 * Sends an invitation to a learner for the Coursera Enterprise program.
 */
export async function inviteCourseraUser(user: {
  email: string;
  fullName: string;
}): Promise<CourseraEnrollmentResult> {
  const orgId = process.env.COURSERA_ORG_ID;
  const progId = process.env.COURSERA_PROGRAM_ID || 'WsV-YttFEeq-fw5R5-S6kw';
  const cleanEmail = user.email.toLowerCase().trim();
  const cleanName = user.fullName.trim() || cleanEmail.split('@')[0];

  if (!orgId || !progId) {
    return { email: cleanEmail, success: false, action: 'invite', message: 'Coursera Org/Program ID not configured.' };
  }

  const token = await getCourseraAccessToken();
  if (!token) {
    return { email: cleanEmail, success: false, action: 'invite', message: 'Failed to acquire Coursera OAuth token.' };
  }

  try {
    const url = `https://api.coursera.com/ent/api/businesses.v1/${orgId}/programs/${progId}/invitations`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        fullName: cleanName,
        externalId: cleanEmail,
      }),
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        email: cleanEmail,
        success: true,
        action: 'invite',
        statusCategory: 'success',
        message: 'Invitation sent successfully via Coursera.',
        courseraId: data.id,
      };
    }

    const errText = await res.text();
    const parsed = parseCourseraErrorMessage(errText, res.status);
    return {
      email: cleanEmail,
      success: false,
      action: 'invite',
      message: parsed.message,
      errorCode: parsed.errorCode,
      statusCategory: parsed.statusCategory,
    };
  } catch (err: any) {
    return {
      email: cleanEmail,
      success: false,
      action: 'invite',
      statusCategory: 'error',
      message: `Network error: ${err.message || 'unknown'}`,
    };
  }
}

/**
 * Provisions a direct membership in the enterprise learning program.
 */
export async function enrollCourseraUser(user: {
  email: string;
  fullName: string;
}): Promise<CourseraEnrollmentResult> {
  const orgId = process.env.COURSERA_ORG_ID;
  const progId = process.env.COURSERA_PROGRAM_ID || 'WsV-YttFEeq-fw5R5-S6kw';
  const cleanEmail = user.email.toLowerCase().trim();
  const cleanName = user.fullName.trim() || cleanEmail.split('@')[0];

  if (!orgId || !progId) {
    return { email: cleanEmail, success: false, action: 'enroll', message: 'Coursera Org/Program ID not configured.' };
  }

  const token = await getCourseraAccessToken();
  if (!token) {
    return { email: cleanEmail, success: false, action: 'enroll', message: 'Failed to acquire Coursera OAuth token.' };
  }

  try {
    const url = `https://api.coursera.com/ent/api/businesses.v1/${orgId}/programs/${progId}/memberships`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        fullName: cleanName,
        externalId: cleanEmail,
      }),
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        email: cleanEmail,
        success: true,
        action: 'enroll',
        statusCategory: 'success',
        message: 'Learner enrolled directly into Coursera Enterprise Program.',
        courseraId: data.id,
      };
    }

    const errText = await res.text();
    const parsed = parseCourseraErrorMessage(errText, res.status);
    return {
      email: cleanEmail,
      success: false,
      action: 'enroll',
      message: parsed.message,
      errorCode: parsed.errorCode,
      statusCategory: parsed.statusCategory,
    };
  } catch (err: any) {
    return {
      email: cleanEmail,
      success: false,
      action: 'enroll',
      statusCategory: 'error',
      message: `Network error: ${err.message || 'unknown'}`,
    };
  }
}

/**
 * Batch sends invitations to learners with concurrency limiting and throttling.
 */
export async function batchInviteCourseraUsers(
  users: Array<{ email: string; fullName: string }>
): Promise<CourseraEnrollmentResult[]> {
  const results: CourseraEnrollmentResult[] = [];
  const CONCURRENCY = 5;

  for (let i = 0; i < users.length; i += CONCURRENCY) {
    const chunk = users.slice(i, i + CONCURRENCY);
    const chunkRes = await Promise.all(chunk.map(u => inviteCourseraUser(u)));
    results.push(...chunkRes);
    if (i + CONCURRENCY < users.length) {
      await sleep(100); // 100ms throttle
    }
  }

  return results;
}

/**
 * Batch enrolls learners with concurrency limiting and throttling.
 */
export async function batchEnrollCourseraUsers(
  users: Array<{ email: string; fullName: string }>
): Promise<CourseraEnrollmentResult[]> {
  const results: CourseraEnrollmentResult[] = [];
  const CONCURRENCY = 5;

  for (let i = 0; i < users.length; i += CONCURRENCY) {
    const chunk = users.slice(i, i + CONCURRENCY);
    const chunkRes = await Promise.all(chunk.map(u => enrollCourseraUser(u)));
    results.push(...chunkRes);
    if (i + CONCURRENCY < users.length) {
      await sleep(100); // 100ms throttle
    }
  }

  return results;
}
