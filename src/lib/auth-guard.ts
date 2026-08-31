import { ALLOWED_USER_METADATA_KEYS, ALLOWED_APP_METADATA_KEYS } from './auth-contract';
import { getSafeAvatarUrl, isMalformedAvatarValue } from './avatar';

/**
 * Budget thresholds for Auth Payloads, JWTs, and Auth Metadata writes.
 * 
 * Target size in NGConnect:
 * - NORMAL: < 3072 B (3.0 KB)
 * - WARNING: >= 3072 B (3.0 KB)
 * - CRITICAL: >= 3891 B (3.8 KB)
 * - HARD BLOCK: >= 4096 B (4.0 KB single chunk/write limit)
 */
export const AUTH_BUDGET = {
  NORMAL_MAX_BYTES: 3072,     // 3 KB
  WARNING_THRESHOLD_BYTES: 3072,
  CRITICAL_THRESHOLD_BYTES: 3891, // 3.8 KB
  HARD_BLOCK_BYTES: 4096,     // 4 KB
} as const;

export type AuthSizeStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'BLOCKED';

export interface AuthSizeCheckResult {
  sizeBytes: number;
  status: AuthSizeStatus;
  isBlocked: boolean;
  message?: string;
}

/**
 * Calculates UTF-8 byte length of a string or JSON-serializable object.
 */
export function getPayloadSizeBytes(payload: unknown): number {
  if (payload === null || payload === undefined) return 0;
  if (typeof payload === 'string') {
    return Buffer.byteLength(payload, 'utf8');
  }
  try {
    const jsonStr = JSON.stringify(payload);
    return Buffer.byteLength(jsonStr, 'utf8');
  } catch {
    return 0;
  }
}

/**
 * Evaluates the payload size against the application auth budget.
 */
export function evaluateAuthPayloadSize(payload: unknown): AuthSizeCheckResult {
  const sizeBytes = getPayloadSizeBytes(payload);

  if (sizeBytes >= AUTH_BUDGET.HARD_BLOCK_BYTES) {
    return {
      sizeBytes,
      status: 'BLOCKED',
      isBlocked: true,
      message: `Auth payload size (${sizeBytes} B) exceeds hard block limit of ${AUTH_BUDGET.HARD_BLOCK_BYTES} B.`,
    };
  }

  if (sizeBytes >= AUTH_BUDGET.CRITICAL_THRESHOLD_BYTES) {
    return {
      sizeBytes,
      status: 'CRITICAL',
      isBlocked: false,
      message: `Auth payload size (${sizeBytes} B) is in critical threshold (>= ${AUTH_BUDGET.CRITICAL_THRESHOLD_BYTES} B).`,
    };
  }

  if (sizeBytes >= AUTH_BUDGET.WARNING_THRESHOLD_BYTES) {
    return {
      sizeBytes,
      status: 'WARNING',
      isBlocked: false,
      message: `Auth payload size (${sizeBytes} B) exceeds warning threshold (>= ${AUTH_BUDGET.WARNING_THRESHOLD_BYTES} B).`,
    };
  }

  return {
    sizeBytes,
    status: 'HEALTHY',
    isBlocked: false,
  };
}

/**
 * Sanitizes user_metadata:
 * 1. Strips non-allowlisted application profile keys (bio, skills, phone, etc.).
 * 2. Enforces safe avatar URLs (rejects data:image/ base64, blob:, javascript:).
 * 3. Enforces max string lengths on text fields (<= 2048 chars).
 * 4. Strips nested objects or arrays unless explicitly allowed (custom_claims).
 */
export function sanitizeUserAuthMetadata(rawMetadata?: Record<string, any> | null): Record<string, any> {
  if (!rawMetadata || typeof rawMetadata !== 'object') {
    return {};
  }

  const allowedSet = new Set<string>(ALLOWED_USER_METADATA_KEYS);
  const cleaned: Record<string, any> = {};

  for (const [key, val] of Object.entries(rawMetadata)) {
    if (!allowedSet.has(key)) {
      // Disallow non-auth keys (e.g. bio, skills, campus, batch, etc.)
      continue;
    }

    if (val === null || val === undefined) {
      continue;
    }

    // Avatar sanitization
    if (key === 'avatar_url' || key === 'avatarUrl' || key === 'picture') {
      const safeUrl = getSafeAvatarUrl({ [key]: val });
      if (safeUrl) {
        cleaned[key] = safeUrl;
      }
      continue;
    }

    // String fields length enforcement
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (isMalformedAvatarValue(trimmed)) {
        continue;
      }
      if (trimmed.length <= 2048) {
        cleaned[key] = trimmed;
      }
      continue;
    }

    // Booleans & numbers
    if (typeof val === 'boolean' || typeof val === 'number') {
      cleaned[key] = val;
      continue;
    }

    // Objects (e.g., custom_claims)
    if (key === 'custom_claims' && typeof val === 'object' && !Array.isArray(val)) {
      cleaned[key] = val;
    }
  }

  // Ensure avatar consistency: if avatar_url is missing but picture is present, sync safe URL
  const safeAvatar = getSafeAvatarUrl(cleaned);
  if (safeAvatar) {
    cleaned.avatar_url = safeAvatar;
    cleaned.avatarUrl = safeAvatar;
  }

  return cleaned;
}

/**
 * Sanitizes app_metadata:
 * Retains only allowlisted authorization claims (role, team, is_alumni, provider, providers).
 */
export function sanitizeAppAuthMetadata(rawMetadata?: Record<string, any> | null): Record<string, any> {
  if (!rawMetadata || typeof rawMetadata !== 'object') {
    return {};
  }

  const allowedSet = new Set<string>(ALLOWED_APP_METADATA_KEYS);
  const cleaned: Record<string, any> = {};

  for (const [key, val] of Object.entries(rawMetadata)) {
    if (allowedSet.has(key) && val !== null && val !== undefined) {
      cleaned[key] = val;
    }
  }

  return cleaned;
}
