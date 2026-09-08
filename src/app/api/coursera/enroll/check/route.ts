import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import {
  batchCheckCourseraUsersLive,
  batchCheckCourseraInvitationsLive,
  batchFetchCourseraUserEnrollmentActivity,
} from '@/lib/coursera-api';

export const maxDuration = 120;

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MAX_EMAILS_PER_REQUEST = 1000;

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

function deriveNameFromEmail(email: string): string {
  const namePart = email.split('@')[0];
  return namePart
    .replace(/[._-]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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
    return NextResponse.json({ error: 'Forbidden: Admin privileges required.' }, { status: 403 });
  }

  // 2. Abuse Protection: Rate Limiting (20 requests per minute per user)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateLimitKey = `coursera-checker:${user.id}:${clientIp}`;
  const rateLimit = checkRateLimit(rateLimitKey, 20, 60 * 1000);

  if (!rateLimit.allowed) {
    const retrySec = Math.ceil(rateLimit.resetTimeMs / 1000);
    return NextResponse.json(
      { error: `Too many check requests. Please wait ${retrySec} seconds.` },
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

  // 3. Payload Extraction & Normalization
  let body: {
    items?: Array<{ email: string; fullName?: string }> | string[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const rawItems = body.items || [];
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json({ error: 'No items provided for checking.' }, { status: 400 });
  }

  if (rawItems.length > MAX_EMAILS_PER_REQUEST) {
    return NextResponse.json(
      { error: `Maximum ${MAX_EMAILS_PER_REQUEST} items allowed per check.` },
      { status: 400 }
    );
  }

  // Map input emails and user-supplied names
  const emailToInputName = new Map<string, string>();
  const sanitizedEmails: string[] = [];

  for (const item of rawItems) {
    let email = '';
    let name = '';
    if (typeof item === 'string') {
      email = item.trim().toLowerCase();
    } else if (item && typeof item === 'object') {
      email = String(item.email || '').trim().toLowerCase();
      name = String(item.fullName || '').trim();
    }

    if (EMAIL_REGEX.test(email) && !emailToInputName.has(email)) {
      sanitizedEmails.push(email);
      emailToInputName.set(email, name);
    }
  }

  if (sanitizedEmails.length === 0) {
    return NextResponse.json({ error: 'No valid email addresses found in the request.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const CHUNK_SIZE = 500;

  // 4. Step 1: Check Database Snapshots & Learner Months
  const snapshotEmails = new Set<string>();
  const dbNameToSource = new Map<string, { name: string; source: 'snapshot' | 'profile' | 'alumni' }>();
  const emailToEnrollment = new Map<string, string>();
  const emailToLastActivity = new Map<string, string>();

  for (let i = 0; i < sanitizedEmails.length; i += CHUNK_SIZE) {
    const chunk = sanitizedEmails.slice(i, i + CHUNK_SIZE);
    
    // Check coursera_snapshots
    const { data: snaps } = await supabase
      .from('coursera_snapshots')
      .select('email, name, enrollment_time, last_activity_time')
      .in('email', chunk);

    if (snaps) {
      for (const s of snaps) {
        snapshotEmails.add(s.email);
        if (s.name && !dbNameToSource.has(s.email)) {
          dbNameToSource.set(s.email, { name: s.name, source: 'snapshot' });
        }
        if (s.enrollment_time) {
          const cur = emailToEnrollment.get(s.email);
          if (!cur || new Date(s.enrollment_time) < new Date(cur)) {
            emailToEnrollment.set(s.email, s.enrollment_time);
          }
        }
        if (s.last_activity_time) {
          const cur = emailToLastActivity.get(s.email);
          if (!cur || new Date(s.last_activity_time) > new Date(cur)) {
            emailToLastActivity.set(s.email, s.last_activity_time);
          }
        }
      }
    }

    // Check coursera_learner_month
    const { data: lmRows } = await supabase
      .from('coursera_learner_month')
      .select('email, name')
      .in('email', chunk);

    if (lmRows) {
      for (const lm of lmRows) {
        snapshotEmails.add(lm.email);
        if (lm.name && !dbNameToSource.has(lm.email)) {
          dbNameToSource.set(lm.email, { name: lm.name, source: 'snapshot' });
        }
      }
    }
  }

  // 5. Check alumni_profile and profiles for names if still missing
  const emailsNeedingNames = sanitizedEmails.filter(
    e => !emailToInputName.get(e) && !dbNameToSource.has(e)
  );

  for (let i = 0; i < emailsNeedingNames.length; i += CHUNK_SIZE) {
    const chunk = emailsNeedingNames.slice(i, i + CHUNK_SIZE);
    
    // Check alumni_profile
    const { data: alumniProfiles } = await supabase
      .from('alumni_profile')
      .select('email, full_name')
      .in('email', chunk);

    if (alumniProfiles) {
      for (const ap of alumniProfiles) {
        if (ap.full_name && !dbNameToSource.has(ap.email)) {
          dbNameToSource.set(ap.email, { name: ap.full_name, source: 'alumni' });
        }
      }
    }

    // Check profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('email, full_name')
      .in('email', chunk);

    if (profiles) {
      for (const p of profiles) {
        if (p.full_name && !dbNameToSource.has(p.email)) {
          dbNameToSource.set(p.email, { name: p.full_name, source: 'profile' });
        }
      }
    }
  }

  // 6. Step 2: Query Live Coursera Enterprise API for roster and pending invitations
  // If not found in snapshots, query live API
  const missingFromSnapshots = sanitizedEmails.filter(e => !snapshotEmails.has(e));
  let liveApiUserMap = new Map<string, { fullName: string; id: string } | null>();
  let liveActivityMap = new Map<string, { coursesCount: number; earliestEnrollment: number | null; latestActivity: number | null }>();
  let liveInvitationsMap = new Map<string, { id: string; email: string; fullName: string; createdAt?: number } | null>();

  if (missingFromSnapshots.length > 0) {
    try {
      const [userRosterMap, invitationsMap] = await Promise.all([
        batchCheckCourseraUsersLive(missingFromSnapshots),
        batchCheckCourseraInvitationsLive(missingFromSnapshots),
      ]);
      liveApiUserMap = userRosterMap;
      liveInvitationsMap = invitationsMap;

      const activeLiveEmails = missingFromSnapshots.filter(e => liveApiUserMap.get(e));
      if (activeLiveEmails.length > 0) {
        liveActivityMap = await batchFetchCourseraUserEnrollmentActivity(activeLiveEmails);
      }
    } catch (err) {
      console.warn('[coursera-checker] Live Coursera API check failed gracefully:', err);
    }
  }

  // 7. Synthesize status and final details for each user
  interface CheckerResultItem {
    email: string;
    fullName: string;
    nameSource: 'uploaded' | 'snapshot' | 'database' | 'coursera' | 'derived';
    status: 'enrolled' | 'invited' | 'not_enrolled';
    source: 'Snapshots' | 'Coursera Enterprise (Live API)' | 'Coursera Enterprise (Invite Pending)' | 'None';
    enrollmentDate: string;
    lastActivityDate: string;
    courseraId?: string;
  }

  const results: CheckerResultItem[] = [];

  for (const email of sanitizedEmails) {
    const inputName = emailToInputName.get(email);
    const dbNameInfo = dbNameToSource.get(email);
    const existsInSnapshots = snapshotEmails.has(email);
    const liveUser = liveApiUserMap.get(email);
    const liveInv = liveInvitationsMap.get(email);

    // Resolve name
    let finalName = '';
    let nameSource: CheckerResultItem['nameSource'] = 'derived';

    if (inputName) {
      finalName = inputName;
      nameSource = 'uploaded';
    } else if (dbNameInfo?.name) {
      finalName = dbNameInfo.name;
      nameSource = dbNameInfo.source === 'snapshot' ? 'snapshot' : 'database';
    } else if (liveUser?.fullName) {
      finalName = liveUser.fullName;
      nameSource = 'coursera';
    } else if (liveInv?.fullName) {
      finalName = liveInv.fullName;
      nameSource = 'coursera';
    } else {
      finalName = deriveNameFromEmail(email);
      nameSource = 'derived';
    }

    if (existsInSnapshots) {
      results.push({
        email,
        fullName: finalName,
        nameSource,
        status: 'enrolled',
        source: 'Snapshots',
        enrollmentDate: formatDateTimeForReport(emailToEnrollment.get(email)),
        lastActivityDate: formatDateTimeForReport(emailToLastActivity.get(email)),
      });
    } else if (liveUser) {
      const liveAct = liveActivityMap.get(email);
      results.push({
        email,
        fullName: finalName,
        nameSource,
        status: 'enrolled',
        source: 'Coursera Enterprise (Live API)',
        enrollmentDate: formatDateTimeForReport(liveAct?.earliestEnrollment),
        lastActivityDate: formatDateTimeForReport(liveAct?.latestActivity),
        courseraId: liveUser.id,
      });
    } else if (liveInv) {
      results.push({
        email,
        fullName: finalName,
        nameSource,
        status: 'invited',
        source: 'Coursera Enterprise (Invite Pending)',
        enrollmentDate: formatDateTimeForReport(liveInv.createdAt),
        lastActivityDate: '—',
        courseraId: liveInv.id,
      });
    } else {
      results.push({
        email,
        fullName: finalName,
        nameSource,
        status: 'not_enrolled',
        source: 'None',
        enrollmentDate: '—',
        lastActivityDate: '—',
      });
    }
  }

  const enrolledCount = results.filter(r => r.status === 'enrolled').length;
  const invitedCount = results.filter(r => r.status === 'invited').length;
  const notEnrolledCount = results.filter(r => r.status === 'not_enrolled').length;

  return NextResponse.json({
    total: results.length,
    enrolledCount,
    invitedCount,
    notEnrolledCount,
    results,
  }, {
    headers: {
      'X-RateLimit-Limit': String(rateLimit.limit),
      'X-RateLimit-Remaining': String(rateLimit.remaining),
    },
  });
}
