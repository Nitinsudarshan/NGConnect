import { AUTH_BUDGET, AuthSizeStatus, getPayloadSizeBytes } from './auth-guard';

export interface CookieHeaderDiagnostics {
  totalCookieHeaderBytes: number;
  authCookieCount: number;
  supabaseCookieCount: number;
  totalAuthCookieBytes: number;
  status: AuthSizeStatus;
  cookies: Array<{
    name: string;
    sizeBytes: number;
    isSupabaseAuth: boolean;
  }>;
}

/**
 * Safely inspects the incoming request Cookie header and calculates sizes
 * without reading or logging token contents.
 */
export function inspectCookieHeader(cookieHeaderStr?: string | null): CookieHeaderDiagnostics {
  if (!cookieHeaderStr) {
    return {
      totalCookieHeaderBytes: 0,
      authCookieCount: 0,
      supabaseCookieCount: 0,
      totalAuthCookieBytes: 0,
      status: 'HEALTHY',
      cookies: [],
    };
  }

  const totalCookieHeaderBytes = Buffer.byteLength(cookieHeaderStr, 'utf8');
  const cookiePairs = cookieHeaderStr.split(';');

  const cookies: Array<{ name: string; sizeBytes: number; isSupabaseAuth: boolean }> = [];
  let authCookieCount = 0;
  let supabaseCookieCount = 0;
  let totalAuthCookieBytes = 0;

  for (const pair of cookiePairs) {
    const trimmed = pair.trim();
    if (!trimmed) continue;

    const eqIdx = trimmed.indexOf('=');
    const name = eqIdx > -1 ? trimmed.substring(0, eqIdx).trim() : trimmed;
    const val = eqIdx > -1 ? trimmed.substring(eqIdx + 1).trim() : '';

    const sizeBytes = Buffer.byteLength(trimmed, 'utf8');
    const isSupabaseAuth = name.startsWith('sb-') && name.includes('-auth-token');
    const isOtherAuth = name.includes('auth') || name.includes('session') || name.includes('token') || name.includes('dev-role');

    if (isSupabaseAuth) {
      supabaseCookieCount++;
      authCookieCount++;
      totalAuthCookieBytes += sizeBytes;
    } else if (isOtherAuth) {
      authCookieCount++;
      totalAuthCookieBytes += sizeBytes;
    }

    cookies.push({
      name,
      sizeBytes,
      isSupabaseAuth,
    });
  }

  let status: AuthSizeStatus = 'HEALTHY';
  if (totalCookieHeaderBytes >= AUTH_BUDGET.CRITICAL_THRESHOLD_BYTES) {
    status = 'CRITICAL';
  } else if (totalCookieHeaderBytes >= AUTH_BUDGET.WARNING_THRESHOLD_BYTES) {
    status = 'WARNING';
  }

  return {
    totalCookieHeaderBytes,
    authCookieCount,
    supabaseCookieCount,
    totalAuthCookieBytes,
    status,
    cookies,
  };
}

/**
 * Emits a structured operational log event for auth cookie size events.
 * Never outputs sensitive cookie values or tokens.
 */
export function logAuthSizeEvent(
  eventType: 'AUTH_COOKIE_SIZE_WARNING' | 'AUTH_COOKIE_SIZE_CRITICAL' | 'AUTH_HEADER_SIZE_WARNING' | 'AUTH_METADATA_REJECTED' | 'AVATAR_DATA_URI_REJECTED',
  context: {
    route?: string;
    userId?: string;
    sizeBytes?: number;
    cookieCount?: number;
    details?: string;
  }
) {
  const payload = {
    timestamp: new Date().toISOString(),
    event: eventType,
    route: context.route || 'unknown',
    userId: context.userId || 'anonymous',
    sizeBytes: context.sizeBytes || 0,
    cookieCount: context.cookieCount || 0,
    details: context.details || '',
  };

  if (eventType === 'AUTH_COOKIE_SIZE_CRITICAL' || eventType === 'AUTH_METADATA_REJECTED') {
    console.error(`[AUTH_DIAGNOSTICS] ${JSON.stringify(payload)}`);
  } else {
    console.warn(`[AUTH_DIAGNOSTICS] ${JSON.stringify(payload)}`);
  }
}
