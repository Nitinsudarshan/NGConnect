/**
 * High-Performance In-Memory Sliding-Window Rate Limiter
 *
 * Protects endpoints from abuse, credential stuffing, and brute-force hammering.
 * Automatically cleans up expired windows to prevent memory leaks.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL_MS = 60 * 1000; // clean up every 60s
let lastCleanup = Date.now();

function cleanupStore() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store.entries()) {
    // Keep timestamps from the last 10 minutes max
    entry.timestamps = entry.timestamps.filter(ts => now - ts < 10 * 60 * 1000);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
}

/**
 * Check if an action by `identifier` is within the allowed `limit` for `windowMs`.
 *
 * @param identifier Unique key, e.g. `ip:user_id:action`
 * @param limit Maximum allowed requests within the window
 * @param windowMs Window duration in milliseconds (default: 60,000ms = 1 minute)
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 20,
  windowMs: number = 60 * 1000
): RateLimitResult {
  cleanupStore();

  const now = Date.now();
  let entry = store.get(identifier);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(identifier, entry);
  }

  // Filter timestamps within current sliding window
  entry.timestamps = entry.timestamps.filter(ts => now - ts < windowMs);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    const resetTimeMs = oldest + windowMs - now;
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetTimeMs: Math.max(0, resetTimeMs),
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    limit,
    remaining: limit - entry.timestamps.length,
    resetTimeMs: windowMs,
  };
}
