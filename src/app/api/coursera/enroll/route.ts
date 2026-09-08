import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import {
  batchInviteCourseraUsers,
  batchEnrollCourseraUsers,
  CourseraEnrollmentResult,
} from '@/lib/coursera-api';

export const maxDuration = 120;

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MAX_USERS_PER_REQUEST = 500;

export async function POST(request: NextRequest) {
  // 1. Session & Role Verification
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = user.app_metadata?.role;
  if (role !== 'Admin' && role !== 'Super Admin') {
    return NextResponse.json({ error: 'Forbidden: Admin or Super Admin privileges required.' }, { status: 403 });
  }

  // 2. Abuse Protection: Rate Limiting (10 requests per minute per user)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateLimitKey = `coursera-enroll:${user.id}:${clientIp}`;
  const rateLimit = checkRateLimit(rateLimitKey, 10, 60 * 1000);

  if (!rateLimit.allowed) {
    const retrySec = Math.ceil(rateLimit.resetTimeMs / 1000);
    return NextResponse.json(
      { error: `Too many enrollment requests. Please wait ${retrySec} seconds before retrying.` },
      {
        status: 429,
        headers: {
          'Retry-After': String(retrySec),
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // 3. Payload Validation
  let body: {
    action?: 'invite' | 'enroll';
    users?: Array<{ email: string; fullName?: string }>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const { action, users = [] } = body;

  if (!action || (action !== 'invite' && action !== 'enroll')) {
    return NextResponse.json({ error: 'Invalid action. Must be "invite" or "enroll".' }, { status: 400 });
  }

  if (!Array.isArray(users) || users.length === 0) {
    return NextResponse.json({ error: 'No users provided for enrollment/invitation.' }, { status: 400 });
  }

  if (users.length > MAX_USERS_PER_REQUEST) {
    return NextResponse.json(
      { error: `Maximum ${MAX_USERS_PER_REQUEST} users allowed per operation.` },
      { status: 400 }
    );
  }

  // Sanitize users
  const sanitizedUsers: Array<{ email: string; fullName: string }> = [];
  const seenEmails = new Set<string>();

  for (const u of users) {
    const cleanEmail = String(u.email || '').trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail) || seenEmails.has(cleanEmail)) {
      continue;
    }
    seenEmails.add(cleanEmail);

    let cleanName = String(u.fullName || '').trim();
    if (!cleanName) {
      // Fallback to name derived from email
      cleanName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    sanitizedUsers.push({
      email: cleanEmail,
      fullName: cleanName,
    });
  }

  if (sanitizedUsers.length === 0) {
    return NextResponse.json({ error: 'No valid user emails provided.' }, { status: 400 });
  }

  // 4. Execute operation
  try {
    let results: CourseraEnrollmentResult[] = [];
    if (action === 'invite') {
      results = await batchInviteCourseraUsers(sanitizedUsers);
    } else {
      results = await batchEnrollCourseraUsers(sanitizedUsers);
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      action,
      summary: {
        total: results.length,
        succeeded,
        failed,
      },
      results,
    }, {
      headers: {
        'X-RateLimit-Limit': String(rateLimit.limit),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    });
  } catch (err: any) {
    console.error('[Coursera Enroll Route] Operation error:', err);
    return NextResponse.json({
      error: `Coursera API operation failed: ${err.message || 'Unknown error'}`,
    }, { status: 500 });
  }
}
