/**
 * Avatar URL helper and sanitizer for NGConnect.
 * 
 * Invariants:
 * 1. avatar_url / avatarUrl must NEVER contain a data URI or base64 image (data:image/...).
 * 2. Reject data URIs, blob URIs, javascript: URIs, or non-http(s) strings.
 * 3. Prefer valid HTTP(S) URLs (Google picture, Supabase storage public URL).
 * 4. Authentication and profile processing must NEVER crash on malformed avatar values.
 */

/**
 * Extracts a safe HTTP(S) avatar image URL from user metadata or profile object.
 * Returns null if no valid, safe URL is found.
 */
export function getSafeAvatarUrl(metadata?: Record<string, any> | null): string | null {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  // Priority order for candidate avatar properties
  const candidates = [
    metadata.picture,      // Standard Google OAuth profile picture
    metadata.avatar_url,    // Supabase standard user metadata
    metadata.avatarUrl,     // Application custom metadata key
    metadata.imageUrl,     // Generic image URL
    metadata.avatar,        // Legacy context key
    metadata.image,         // Generic fallback
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (!trimmed) continue;

      // Reject data URIs or base64 payloads
      if (trimmed.toLowerCase().startsWith('data:image/') || trimmed.toLowerCase().startsWith('data:')) {
        continue;
      }

      // Reject client blob or javascript schemes
      if (trimmed.toLowerCase().startsWith('blob:') || trimmed.toLowerCase().startsWith('javascript:')) {
        continue;
      }

      // Accept valid web HTTP/HTTPS URLs (or absolute paths for local assets)
      if (/^(https?:\/\/|\/)/i.test(trimmed)) {
        // Enforce maximum safe URL length to prevent DOS / cookie bloat
        if (trimmed.length <= 2048) {
          return trimmed;
        }
      }
    }
  }

  return null;
}

/**
 * Checks whether a given string is a dangerous/malformed avatar candidate
 * (such as a base64 data URI, blob URI, or oversized string).
 */
export function isMalformedAvatarValue(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  const lower = val.trim().toLowerCase();
  return lower.startsWith('data:') || lower.startsWith('blob:') || lower.startsWith('javascript:') || val.length > 2048;
}

/**
 * Returns a cleaned copy of user_metadata with all base64 and dangerous
 * avatar payloads removed or replaced with safe HTTP(S) URLs.
 */
export function sanitizeUserMetadata<T extends Record<string, any>>(metadata?: T | null): T {
  if (!metadata || typeof metadata !== 'object') {
    return ({} as T);
  }

  const safeAvatar = getSafeAvatarUrl(metadata);
  const cleaned: Record<string, any> = { ...metadata };

  // 1. Sanitize avatar_url
  if (isMalformedAvatarValue(cleaned.avatar_url)) {
    if (safeAvatar) {
      cleaned.avatar_url = safeAvatar;
    } else {
      delete cleaned.avatar_url;
    }
  } else if (!cleaned.avatar_url && safeAvatar) {
    cleaned.avatar_url = safeAvatar;
  }

  // 2. Sanitize avatarUrl
  if (isMalformedAvatarValue(cleaned.avatarUrl)) {
    if (safeAvatar) {
      cleaned.avatarUrl = safeAvatar;
    } else {
      delete cleaned.avatarUrl;
    }
  } else if (!cleaned.avatarUrl && safeAvatar) {
    cleaned.avatarUrl = safeAvatar;
  }

  // 3. Sanitize picture
  if (isMalformedAvatarValue(cleaned.picture)) {
    if (safeAvatar) {
      cleaned.picture = safeAvatar;
    } else {
      delete cleaned.picture;
    }
  }

  // 4. Sanitize any other potential base64 fields that might have leaked into metadata
  for (const key of Object.keys(cleaned)) {
    if (isMalformedAvatarValue(cleaned[key])) {
      delete cleaned[key];
    }
  }

  return cleaned as T;
}
