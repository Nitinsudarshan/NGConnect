import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import { batchCheckCourseraUsersLive, batchFetchCourseraUserEnrollmentActivity } from '@/lib/coursera-api';

export const maxDuration = 120;

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MAX_EMAILS_PER_REQUEST = 5000;

function formatDateTimeForReport(dateVal: string | number | Date | null | undefined): string {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  } catch {
    return '—';
  }
}

export async function POST(request: NextRequest) {
  // 1. Session & Role Verification
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = user.app_metadata?.role;
  if (role !== 'Admin' && role !== 'Super Admin') {
    return NextResponse.json({ error: 'Forbidden: Insufficient privileges.' }, { status: 403 });
  }

  // 2. Abuse Protection: Rate Limiting (15 requests/minute per user)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateLimitKey = `verify-users:${user.id}:${clientIp}`;
  const rateLimit = checkRateLimit(rateLimitKey, 15, 60 * 1000);

  if (!rateLimit.allowed) {
    const retrySec = Math.ceil(rateLimit.resetTimeMs / 1000);
    return NextResponse.json(
      { error: `Too many verification requests. Please wait ${retrySec} seconds.` },
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

  // 3. Request Payload Validation
  let body: {
    emails?: string[];
    month?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawEmails = body.emails ?? [];
  const selectedMonth = body.month && body.month !== 'all' ? body.month : null;

  if (rawEmails.length > MAX_EMAILS_PER_REQUEST) {
    return NextResponse.json(
      { error: `Too many email addresses submitted. Maximum allowed is ${MAX_EMAILS_PER_REQUEST}.` },
      { status: 400 }
    );
  }

  // Strict email sanitization
  const sanitizedEmails = Array.from(
    new Set(
      rawEmails
        .map(e => String(e).trim().toLowerCase())
        .filter(e => e.length > 0 && e.length <= 254 && EMAIL_REGEX.test(e))
    )
  );

  if (sanitizedEmails.length === 0) {
    return NextResponse.json({ error: 'No valid email addresses provided to verify.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const CHUNK_SIZE = 500;

  // 4. Step 1: Check Database Snapshots & Learner Months
  const allSnapshotEmails = new Set<string>();
  const monthSnapshotEmails = new Set<string>();
  const emailToName = new Map<string, string>();
  const emailToEnrollment = new Map<string, string>();
  const emailToLastActivity = new Map<string, string>();

  for (let i = 0; i < sanitizedEmails.length; i += CHUNK_SIZE) {
    const chunk = sanitizedEmails.slice(i, i + CHUNK_SIZE);
    const { data: snaps, error: snapErr } = await supabase
      .from('coursera_snapshots')
      .select('email, name, enrollment_time, last_activity_time, snapshot_month')
      .in('email', chunk);

    if (snapErr) {
      return NextResponse.json({ error: snapErr.message }, { status: 500 });
    }

    if (snaps) {
      for (const s of snaps) {
        allSnapshotEmails.add(s.email);
        if (s.name && !emailToName.has(s.email)) {
          emailToName.set(s.email, s.name);
        }
        if (s.enrollment_time) {
          const current = emailToEnrollment.get(s.email);
          if (!current || new Date(s.enrollment_time) < new Date(current)) {
            emailToEnrollment.set(s.email, s.enrollment_time);
          }
        }
        if (s.last_activity_time) {
          const current = emailToLastActivity.get(s.email);
          if (!current || new Date(s.last_activity_time) > new Date(current)) {
            emailToLastActivity.set(s.email, s.last_activity_time);
          }
        }
        if (selectedMonth && s.snapshot_month === selectedMonth) {
          monthSnapshotEmails.add(s.email);
        }
      }
    }
  }

  // Check coursera_learner_month for additional coverage
  const learnerMonthEmails = new Set<string>();
  for (let i = 0; i < sanitizedEmails.length; i += CHUNK_SIZE) {
    const chunk = sanitizedEmails.slice(i, i + CHUNK_SIZE);
    const { data: lmRows } = await supabase
      .from('coursera_learner_month')
      .select('email, name, month')
      .in('email', chunk);

    if (lmRows) {
      for (const lm of lmRows) {
        allSnapshotEmails.add(lm.email);
        if (lm.name && !emailToName.has(lm.email)) {
          emailToName.set(lm.email, lm.name);
        }
        if (selectedMonth && lm.month === selectedMonth) {
          learnerMonthEmails.add(lm.email);
        }
      }
    }
  }

  // 5. Step 2: For any emails not found in DB, check Coursera Enterprise Live API
  const missingFromDb = sanitizedEmails.filter(e => !allSnapshotEmails.has(e));
  let liveApiUserMap = new Map<string, { fullName: string; id: string } | null>();
  let liveActivityMap = new Map<string, { coursesCount: number; earliestEnrollment: number | null; latestActivity: number | null }>();

  if (missingFromDb.length > 0) {
    try {
      liveApiUserMap = await batchCheckCourseraUsersLive(missingFromDb);
      const liveEmails = missingFromDb.filter(e => liveApiUserMap.get(e));
      if (liveEmails.length > 0) {
        liveActivityMap = await batchFetchCourseraUserEnrollmentActivity(liveEmails);
      }
    } catch (err) {
      console.warn('[verify-users] Live Coursera API check failed gracefully:', err);
    }
  }

  // 6. Categorize Results
  const found: Array<{
    email: string;
    name: string | null;
    inSelectedMonth: boolean;
    source: 'Snapshots' | 'Coursera Enterprise (Live API)';
    enrollmentDate: string;
    lastActivityDate: string;
  }> = [];

  const notFound: Array<{
    email: string;
    reason: string;
  }> = [];

  for (const email of sanitizedEmails) {
    const existsInDb = allSnapshotEmails.has(email);

    if (existsInDb) {
      const inMonth = selectedMonth
        ? monthSnapshotEmails.has(email) || learnerMonthEmails.has(email)
        : true;

      found.push({
        email,
        name: emailToName.get(email) ?? null,
        inSelectedMonth: inMonth,
        source: 'Snapshots',
        enrollmentDate: formatDateTimeForReport(emailToEnrollment.get(email)),
        lastActivityDate: formatDateTimeForReport(emailToLastActivity.get(email)),
      });
    } else {
      // Check live API result
      const liveUser = liveApiUserMap.get(email);
      if (liveUser) {
        const liveAct = liveActivityMap.get(email);
        found.push({
          email,
          name: liveUser.fullName || null,
          inSelectedMonth: false, // Active on Coursera, but no activity recorded for this specific snapshot month
          source: 'Coursera Enterprise (Live API)',
          enrollmentDate: formatDateTimeForReport(liveAct?.earliestEnrollment),
          lastActivityDate: formatDateTimeForReport(liveAct?.latestActivity),
        });
      } else {
        notFound.push({
          email,
          reason: 'No account found in system snapshots or live Coursera Enterprise roster',
        });
      }
    }
  }

  return NextResponse.json({
    total: sanitizedEmails.length,
    foundCount: found.length,
    notFoundCount: notFound.length,
    found,
    notFound,
    selectedMonth,
  }, {
    headers: {
      'X-RateLimit-Limit': String(rateLimit.limit),
      'X-RateLimit-Remaining': String(rateLimit.remaining),
    },
  });
}
