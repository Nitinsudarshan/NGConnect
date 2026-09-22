import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import {
  batchCheckCourseraUsersLive,
  batchFetchCourseraUserEnrollmentActivity,
  batchCheckCourseraInvitationsLive,
  type CourseraPendingInvitation,
} from '@/lib/coursera-api';
import { denyApiUnlessAccess } from '@/lib/api-guard';

export const maxDuration = 120;

async function fetchAllSupabase(queryBuilder: any) {
  let allData: any[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await queryBuilder.range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return allData;
}

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

  const denied = await denyApiUnlessAccess('data_management.coursera_export');
  if (denied) return denied;

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
  const activeLearnerMonthEmails = new Set<string>();
  const emailToName = new Map<string, string>();
  const emailToEnrollment = new Map<string, string>();
  const emailToLastActivity = new Map<string, string>();
  const emailToEnrolledCourses = new Map<string, number>();
  const emailToHours = new Map<string, number>();

  for (let i = 0; i < sanitizedEmails.length; i += CHUNK_SIZE) {
    const chunk = sanitizedEmails.slice(i, i + CHUNK_SIZE);
    const snapQuery = supabase
      .from('coursera_snapshots')
      .select('email, name, enrollment_time, last_activity_time, snapshot_month, course_id')
      .in('email', chunk);

    let snaps: any[] = [];
    try {
      snaps = await fetchAllSupabase(snapQuery);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    if (snaps && snaps.length > 0) {
      for (const s of snaps) {
        const cleanEmail = s.email.toLowerCase().trim();
        allSnapshotEmails.add(cleanEmail);
        if (s.name && !emailToName.has(cleanEmail)) {
          emailToName.set(cleanEmail, s.name);
        }
        if (s.enrollment_time) {
          const current = emailToEnrollment.get(cleanEmail);
          if (!current || new Date(s.enrollment_time) < new Date(current)) {
            emailToEnrollment.set(cleanEmail, s.enrollment_time);
          }
        }
        if (s.last_activity_time) {
          const current = emailToLastActivity.get(cleanEmail);
          if (!current || new Date(s.last_activity_time) > new Date(current)) {
            emailToLastActivity.set(cleanEmail, s.last_activity_time);
          }
        }
        if (selectedMonth && s.snapshot_month === selectedMonth) {
          monthSnapshotEmails.add(cleanEmail);
        }
        emailToEnrolledCourses.set(cleanEmail, (emailToEnrolledCourses.get(cleanEmail) || 0) + 1);
      }
    }
  }

  // Check coursera_learner_month for additional coverage & activity status
  const learnerMonthEmails = new Set<string>();
  for (let i = 0; i < sanitizedEmails.length; i += CHUNK_SIZE) {
    const chunk = sanitizedEmails.slice(i, i + CHUNK_SIZE);
    const lmQuery = supabase
      .from('coursera_learner_month')
      .select('email, name, month, is_active, monthly_hours, courses_active, courses_enrolled, days_since_activity')
      .in('email', chunk);

    const lmRows = await fetchAllSupabase(lmQuery);

    if (lmRows && lmRows.length > 0) {
      for (const lm of lmRows) {
        const cleanEmail = lm.email.toLowerCase().trim();
        allSnapshotEmails.add(cleanEmail);
        if (lm.name && !emailToName.has(cleanEmail)) {
          emailToName.set(cleanEmail, lm.name);
        }
        if (selectedMonth && lm.month === selectedMonth) {
          learnerMonthEmails.add(cleanEmail);
        }
        const isActiveInMonth = Boolean(lm.is_active) || Number(lm.monthly_hours) > 0 || Number(lm.courses_active) > 0;
        if (isActiveInMonth) {
          activeLearnerMonthEmails.add(cleanEmail);
        }
        if (lm.courses_enrolled && (!emailToEnrolledCourses.has(cleanEmail) || lm.courses_enrolled > emailToEnrolledCourses.get(cleanEmail)!)) {
          emailToEnrolledCourses.set(cleanEmail, Number(lm.courses_enrolled));
        }
        const hrs = Number(lm.monthly_hours) || 0;
        if (!emailToHours.has(cleanEmail) || hrs > emailToHours.get(cleanEmail)!) {
          emailToHours.set(cleanEmail, hrs);
        }
      }
    }
  }

  // Check alumni_master for names for any email still missing a name
  for (let i = 0; i < sanitizedEmails.length; i += CHUNK_SIZE) {
    const chunk = sanitizedEmails.slice(i, i + CHUNK_SIZE);
    const { data: alumniRows } = await supabase
      .from('alumni_master')
      .select('email, name')
      .in('email', chunk);

    if (alumniRows) {
      for (const a of alumniRows) {
        const cleanEmail = a.email.toLowerCase().trim();
        if (a.name && !emailToName.has(cleanEmail)) {
          emailToName.set(cleanEmail, a.name);
        }
      }
    }
  }

  // 5. Step 2: For any emails not found in DB, check Coursera Enterprise Live API
  const missingFromDb = sanitizedEmails.filter(e => !allSnapshotEmails.has(e));
  let liveApiUserMap = new Map<string, { fullName: string; id: string } | null>();
  let liveActivityMap = new Map<string, { coursesCount: number; earliestEnrollment: number | null; latestActivity: number | null }>();
  let liveInvitationsMap = new Map<string, CourseraPendingInvitation | null>();

  if (missingFromDb.length > 0) {
    try {
      liveApiUserMap = await batchCheckCourseraUsersLive(missingFromDb);
      const liveEmails = missingFromDb.filter(e => liveApiUserMap.get(e));
      if (liveEmails.length > 0) {
        liveActivityMap = await batchFetchCourseraUserEnrollmentActivity(liveEmails);
      }
      liveInvitationsMap = await batchCheckCourseraInvitationsLive(missingFromDb);
    } catch (err) {
      console.warn('[verify-users] Live Coursera API check failed gracefully:', err);
    }
  }

  // 6. Categorize Results into Member Status & Activity
  type MemberStatusType = 'Member' | 'Invited' | 'Not Invited';
  type ActivityStatusType = 'Active' | 'Inactive' | 'NA';

  const found: Array<{
    email: string;
    name: string | null;
    inSelectedMonth: boolean;
    memberStatus: MemberStatusType;
    activityStatus: ActivityStatusType;
    enrolledCourses: number;
    source: string;
    enrollmentDate: string;
    lastActivityDate: string;
  }> = [];

  const notFound: Array<{
    email: string;
    name: string | null;
    memberStatus: MemberStatusType;
    activityStatus: ActivityStatusType;
    enrolledCourses: number;
    reason: string;
  }> = [];

  let memberCount = 0;
  let activeMemberCount = 0;
  let inactiveMemberCount = 0;
  let invitedCount = 0;
  let notInvitedCount = 0;

  for (const email of sanitizedEmails) {
    const existsInDb = allSnapshotEmails.has(email);
    const lastAct = emailToLastActivity.get(email);
    let daysSince: number | null = null;
    if (lastAct) {
      const t = new Date(lastAct).getTime();
      if (!isNaN(t)) {
        daysSince = Math.max(0, Math.floor((Date.now() - t) / 86400000));
      }
    }

    if (existsInDb) {
      const inMonth = selectedMonth
        ? monthSnapshotEmails.has(email) || learnerMonthEmails.has(email)
        : true;
      
      const within30Days = daysSince !== null && daysSince <= 30;
      const activityStatus: ActivityStatusType = within30Days ? 'Active' : 'Inactive';

      memberCount++;
      if (within30Days) {
        activeMemberCount++;
      } else {
        inactiveMemberCount++;
      }

      let lastActivityDisplay = '—';
      if (lastAct) {
        const formatted = formatDateTimeForReport(lastAct);
        lastActivityDisplay = daysSince !== null ? `${formatted} (${daysSince}d ago)` : formatted;
      }

      found.push({
        email,
        name: emailToName.get(email) ?? null,
        inSelectedMonth: inMonth,
        memberStatus: 'Member',
        activityStatus,
        enrolledCourses: emailToEnrolledCourses.get(email) ?? 0,
        source: 'Snapshots',
        enrollmentDate: formatDateTimeForReport(emailToEnrollment.get(email)),
        lastActivityDate: lastActivityDisplay,
      });
    } else {
      // Check live API result
      const liveUser = liveApiUserMap.get(email);
      const liveInv = liveInvitationsMap.get(email);

      if (liveUser) {
        const liveAct = liveActivityMap.get(email);
        const liveDays = liveAct?.latestActivity
          ? Math.max(0, Math.floor((Date.now() - liveAct.latestActivity) / 86400000))
          : null;

        const within30Days = liveDays !== null && liveDays <= 30;
        const activityStatus: ActivityStatusType = within30Days ? 'Active' : 'Inactive';

        memberCount++;
        if (within30Days) {
          activeMemberCount++;
        } else {
          inactiveMemberCount++;
        }

        let lastActivityDisplay = '—';
        if (liveAct?.latestActivity) {
          const formatted = formatDateTimeForReport(liveAct.latestActivity);
          lastActivityDisplay = liveDays !== null ? `${formatted} (${liveDays}d ago)` : formatted;
        }

        found.push({
          email,
          name: liveUser.fullName || emailToName.get(email) || null,
          inSelectedMonth: false,
          memberStatus: 'Member',
          activityStatus,
          enrolledCourses: liveAct?.coursesCount ?? 0,
          source: 'Coursera Enterprise (Live API)',
          enrollmentDate: formatDateTimeForReport(liveAct?.earliestEnrollment),
          lastActivityDate: lastActivityDisplay,
        });
      } else if (liveInv) {
        invitedCount++;

        notFound.push({
          email,
          name: liveInv.fullName || emailToName.get(email) || null,
          memberStatus: 'Invited',
          activityStatus: 'NA',
          enrolledCourses: 0,
          reason: 'Coursera Pending Invitation (Invite Sent / Not Yet Accepted)',
        });
      } else {
        notInvitedCount++;

        notFound.push({
          email,
          name: emailToName.get(email) ?? null,
          memberStatus: 'Not Invited',
          activityStatus: 'NA',
          enrolledCourses: 0,
          reason: 'No Account Found & No Invitation Sent',
        });
      }
    }
  }

  return NextResponse.json({
    total: sanitizedEmails.length,
    foundCount: found.length,
    notFoundCount: notFound.length,
    memberCount,
    activeMemberCount,
    inactiveMemberCount,
    invitedCount,
    notInvitedCount,
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
