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
import ExcelJS from 'exceljs';
import { denyApiUnlessAccess } from '@/lib/api-guard';

export const maxDuration = 300;

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

function formatMonthForReport(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const cleanStr = String(dateStr).substring(0, 10);
    const d = new Date(cleanStr + 'T12:00:00Z');
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  } catch {
    return String(dateStr);
  }
}

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
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const denied = await denyApiUnlessAccess('data_management.coursera_export');
  if (denied) return denied;

  // Abuse Protection: Rate Limiting (10 report generations per minute per user)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateLimitKey = `export-report:${user.id}:${clientIp}`;
  const rateLimit = checkRateLimit(rateLimitKey, 10, 60 * 1000);

  if (!rateLimit.allowed) {
    const retrySec = Math.ceil(rateLimit.resetTimeMs / 1000);
    return NextResponse.json(
      { error: `Export rate limit reached. Please wait ${retrySec} seconds.` },
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

  const supabase = createAdminClient();

  let body: {
    month?: string;
    userScope?: 'all' | 'users' | 'single' | 'list' | 'imported';
    emails?: string[];
    includeMemberDetailsSheet?: boolean;
    includeCourseBreakdown?: boolean;
    includeUnmatchedSheet?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const {
    month = 'all',
    userScope = 'all',
    emails = [],
    includeMemberDetailsSheet = true,
    includeCourseBreakdown = true,
    includeUnmatchedSheet = true,
  } = body;

  const sanitizedEmails = Array.from(
    new Set(
      emails
        .map(e => String(e).trim().toLowerCase())
        .filter(e => e.length > 0 && e.includes('@'))
    )
  );

  if (userScope !== 'all' && sanitizedEmails.length === 0) {
    return NextResponse.json({ error: 'No valid email addresses provided for the selected user scope.' }, { status: 400 });
  }

  // ─── 1. Fetch Learner Activity Data (coursera_learner_month) ─────────────────
  let learnerQuery = supabase
    .from('coursera_learner_month')
    .select('*')
    .order('monthly_hours', { ascending: false })
    .order('name', { ascending: true });

  if (month && month !== 'all') {
    learnerQuery = learnerQuery.eq('month', month);
  }

  let learners: any[] = [];
  if (userScope === 'all') {
    learners = await fetchAllSupabase(learnerQuery);
  } else {
    // Process emails in chunks of 500 to avoid HTTP query length limits
    const CHUNK_SIZE = 500;
    for (let i = 0; i < sanitizedEmails.length; i += CHUNK_SIZE) {
      const chunk = sanitizedEmails.slice(i, i + CHUNK_SIZE);
      let chunkQuery = supabase
        .from('coursera_learner_month')
        .select('*')
        .in('email', chunk)
        .order('monthly_hours', { ascending: false });

      if (month && month !== 'all') {
        chunkQuery = chunkQuery.eq('month', month);
      }
      const chunkData = await fetchAllSupabase(chunkQuery);
      learners = learners.concat(chunkData);
    }
  }

  // Identify missing emails that were requested but not found in the selected month
  const foundEmailSet = new Set(learners.map(l => l.email));
  const missingEmails = userScope !== 'all'
    ? sanitizedEmails.filter(e => !foundEmailSet.has(e))
    : [];

  if (learners.length === 0 && (!includeUnmatchedSheet || missingEmails.length === 0) && (!includeMemberDetailsSheet || sanitizedEmails.length === 0)) {
    return NextResponse.json({
      error: 'No learner activity records found matching the specified month and email criteria.'
    }, { status: 404 });
  }

  // ─── 2. Fetch History & Metadata for Missing Emails / Alumni ─────────────────
  interface LearnerHistoryInfo {
    name: string | null;
    earliestEnrollment: string | null;
    latestActivity: string | null;
    coursesCount: number;
    months: string[];
  }
  const historyMap = new Map<string, LearnerHistoryInfo>();
  const emailToAlumniName = new Map<string, string>();

  const targetLookupEmails = userScope === 'all'
    ? Array.from(foundEmailSet)
    : sanitizedEmails;

  const CHUNK_SIZE = 500;

  // Lookup alumni_master for official names
  for (let i = 0; i < targetLookupEmails.length; i += CHUNK_SIZE) {
    const chunk = targetLookupEmails.slice(i, i + CHUNK_SIZE);
    const { data: alumniRows } = await supabase
      .from('alumni_master')
      .select('email, name')
      .in('email', chunk);

    if (alumniRows) {
      for (const a of alumniRows) {
        if (a.name) {
          emailToAlumniName.set(a.email.toLowerCase().trim(), a.name);
        }
      }
    }
  }

  // Lookup historical snapshots for all emails to get exact enrollment & last activity timestamps
  {
    for (let i = 0; i < targetLookupEmails.length; i += CHUNK_SIZE) {
      const chunk = targetLookupEmails.slice(i, i + CHUNK_SIZE);
      const snapQuery = supabase
        .from('coursera_snapshots')
        .select('email, name, enrollment_time, last_activity_time, snapshot_month, course_id')
        .in('email', chunk);
      const otherSnaps = await fetchAllSupabase(snapQuery);

      if (otherSnaps && otherSnaps.length > 0) {
        for (const os of otherSnaps) {
          const snapEmail = os.email.toLowerCase().trim();
          let info = historyMap.get(snapEmail);
          if (!info) {
            info = {
              name: os.name || null,
              earliestEnrollment: os.enrollment_time || null,
              latestActivity: os.last_activity_time || null,
              coursesCount: 0,
              months: [],
            };
            historyMap.set(snapEmail, info);
          }
          if (os.name && !info.name) info.name = os.name;
          info.coursesCount += 1;

          if (os.enrollment_time) {
            if (!info.earliestEnrollment || new Date(os.enrollment_time) < new Date(info.earliestEnrollment)) {
              info.earliestEnrollment = os.enrollment_time;
            }
          }

          if (os.last_activity_time) {
            if (!info.latestActivity || new Date(os.last_activity_time) > new Date(info.latestActivity)) {
              info.latestActivity = os.last_activity_time;
            }
          }

          const formattedMonth = formatMonthForReport(os.snapshot_month);
          if (!info.months.includes(formattedMonth)) {
            info.months.push(formattedMonth);
          }
        }
      }
    }
  }

  // Also check missing emails against live Coursera Enterprise API (Roster & Pending Invites)
  let liveCourseraMap = new Map<string, { fullName: string; id: string } | null>();
  let liveActivityMap = new Map<string, { coursesCount: number; earliestEnrollment: number | null; latestActivity: number | null }>();
  let liveInvitationsMap = new Map<string, CourseraPendingInvitation | null>();

  if (missingEmails.length > 0) {
    try {
      liveCourseraMap = await batchCheckCourseraUsersLive(missingEmails);
      const liveEmailList = missingEmails.filter(e => liveCourseraMap.get(e));
      if (liveEmailList.length > 0) {
        liveActivityMap = await batchFetchCourseraUserEnrollmentActivity(liveEmailList);
      }
      liveInvitationsMap = await batchCheckCourseraInvitationsLive(missingEmails);
    } catch (err) {
      console.warn('[export] Live Coursera check failed gracefully:', err);
    }
  }

  // ─── 3. Fetch Course Snapshots Data if requested ─────────────────────────────
  let snapshots: any[] = [];
  if (includeCourseBreakdown) {
    const targetEmails = userScope === 'all'
      ? Array.from(new Set(learners.map(l => l.email)))
      : sanitizedEmails;

    for (let i = 0; i < targetEmails.length; i += CHUNK_SIZE) {
      const chunk = targetEmails.slice(i, i + CHUNK_SIZE);
      let snapQuery = supabase
        .from('coursera_snapshots')
        .select('*')
        .in('email', chunk)
        .order('email', { ascending: true })
        .order('cumulative_learning_hours', { ascending: false });

      if (month && month !== 'all') {
        snapQuery = snapQuery.eq('snapshot_month', month);
      }
      const snapData = await fetchAllSupabase(snapQuery);
      snapshots = snapshots.concat(snapData);
    }
  }

  // ─── 4. Build Excel Workbook ──────────────────────────────────────────────────
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NGConnect Platform';
  workbook.created = new Date();

  const formattedSelectedMonth = month === 'all' ? 'All Historical Months' : formatMonthForReport(month);
  const generatedTimestamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  // ══════════════════════════════════════════════════════════════════════════════
  // ── SHEET 1: Member Details & Executive Dashboard Tab ────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  if (includeMemberDetailsSheet) {
    const wsMemberDetails = workbook.addWorksheet('Member Details', {
      views: [{ state: 'frozen', ySplit: 7 }]
    });

    // Structure member records
    interface MemberRecord {
      name: string;
      email: string;
      enrolledCourses: number;
      memberStatus: 'Member' | 'Invited' | 'Not Invited';
      activityStatus: 'Active' | 'Inactive' | 'NA';
      lastActivityDate: string;
      recordSource: string;
    }

    const memberRecords: MemberRecord[] = [];

    // Assemble unique member list (1 entry per unique email)
    const targetEmailList: string[] = userScope === 'all'
      ? Array.from(new Set(learners.map(l => l.email.toLowerCase().trim())))
      : sanitizedEmails.map(e => e.toLowerCase().trim());

    // Group learner_month records by email
    const learnerRowsByEmail = new Map<string, any[]>();
    for (const l of learners) {
      const email = l.email.toLowerCase().trim();
      const arr = learnerRowsByEmail.get(email) || [];
      arr.push(l);
      learnerRowsByEmail.set(email, arr);
    }

    for (const email of targetEmailList) {
      const cleanEmail = email;
      const rows = learnerRowsByEmail.get(cleanEmail);
      const alumniName = emailToAlumniName.get(cleanEmail);
      const historyInfo = historyMap.get(cleanEmail);
      const liveUser = liveCourseraMap.get(cleanEmail);
      const liveAct = liveActivityMap.get(cleanEmail);
      const liveInv = liveInvitationsMap.get(cleanEmail);

      if (rows && rows.length > 0) {
        // Sort rows by month descending so rows[0] is the most recent snapshot month
        rows.sort((a, b) => String(b.month || '').localeCompare(String(a.month || '')));
        const latestRow = rows[0];
        const name = latestRow.name || alumniName || historyInfo?.name || liveUser?.fullName || '—';

        // Calculate days since last activity across available snapshot records
        const actTime = historyInfo?.latestActivity || liveAct?.latestActivity;
        let daysSince: number | null = null;
        let lastActivityDate = '—';

        if (actTime) {
          const t = new Date(actTime).getTime();
          if (!isNaN(t)) {
            daysSince = Math.max(0, Math.floor((Date.now() - t) / 86400000));
            const formatted = formatDateTimeForReport(actTime);
            lastActivityDate = `${formatted} (${daysSince}d ago)`;
          }
        } else {
          // Fallback to days_since_activity from monthly snapshot rows
          let bestDays: number | null = null;
          for (const r of rows) {
            if (r.days_since_activity !== null && r.days_since_activity !== undefined) {
              const d = Math.abs(Number(r.days_since_activity));
              if (!isNaN(d)) {
                if (bestDays === null || d < bestDays) {
                  bestDays = d;
                }
              }
            }
          }
          if (bestDays !== null) {
            daysSince = bestDays;
            lastActivityDate = `${bestDays} day(s) ago`;
          }
        }

        // Active criteria: Activity within last 30 days (daysSince <= 30)
        const within30Days = daysSince !== null && daysSince <= 30;
        const activityStatus: MemberRecord['activityStatus'] = within30Days ? 'Active' : 'Inactive';

        const maxCoursesEnrolled = Math.max(...rows.map(r => Number(r.courses_enrolled) || 0));

        memberRecords.push({
          name,
          email: cleanEmail,
          enrolledCourses: maxCoursesEnrolled || historyInfo?.coursesCount || liveAct?.coursesCount || 0,
          memberStatus: 'Member',
          activityStatus,
          lastActivityDate,
          recordSource: month === 'all' ? 'All Snapshot History' : 'Monthly Snapshot',
        });
      } else {
        // Not in learner_month: check historyMap, liveCourseraMap, or liveInvitationsMap
        let name = alumniName || historyInfo?.name || liveUser?.fullName || liveInv?.fullName || '—';
        let enrolledCourses = 0;
        let lastActivityDate = '—';

        const actTime = historyInfo?.latestActivity || liveAct?.latestActivity;
        let daysSince: number | null = null;
        if (actTime) {
          const t = new Date(actTime).getTime();
          if (!isNaN(t)) {
            daysSince = Math.max(0, Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24)));
            const formatted = formatDateTimeForReport(actTime);
            lastActivityDate = `${formatted} (${daysSince}d ago)`;
          }
        }

        if (historyInfo) {
          const isRecent = daysSince !== null && daysSince <= 30;
          memberRecords.push({
            name,
            email: cleanEmail,
            enrolledCourses: historyInfo.coursesCount || liveAct?.coursesCount || 0,
            memberStatus: 'Member',
            activityStatus: isRecent ? 'Active' : 'Inactive',
            lastActivityDate,
            recordSource: 'Historical Snapshot',
          });
        } else if (liveUser) {
          const isRecent = daysSince !== null && daysSince <= 30;
          memberRecords.push({
            name,
            email: cleanEmail,
            enrolledCourses: liveAct?.coursesCount || 0,
            memberStatus: 'Member',
            activityStatus: isRecent ? 'Active' : 'Inactive',
            lastActivityDate,
            recordSource: 'Coursera Enterprise (Live API)',
          });
        } else if (liveInv) {
          // Invited in Coursera Enterprise, no account registered yet
          memberRecords.push({
            name: name !== '—' ? name : (liveInv.fullName || '—'),
            email: cleanEmail,
            enrolledCourses: 0,
            memberStatus: 'Invited',
            activityStatus: 'NA',
            lastActivityDate: '—',
            recordSource: 'Coursera Pending Invite',
          });
        } else {
          // Not invited / no records found
          memberRecords.push({
            name,
            email: cleanEmail,
            enrolledCourses: 0,
            memberStatus: 'Not Invited',
            activityStatus: 'NA',
            lastActivityDate: '—',
            recordSource: 'No Account / Not Invited',
          });
        }
      }
    }

    // Sort: Members (Active first, then Inactive), then Invited, then Not Invited
    const memberPriority = { 'Member': 1, 'Invited': 2, 'Not Invited': 3 };
    const activityPriority = { 'Active': 1, 'Inactive': 2, 'NA': 3 };

    memberRecords.sort((a, b) => {
      const mDiff = memberPriority[a.memberStatus] - memberPriority[b.memberStatus];
      if (mDiff !== 0) return mDiff;
      const aDiff = activityPriority[a.activityStatus] - activityPriority[b.activityStatus];
      if (aDiff !== 0) return aDiff;
      return a.name.localeCompare(b.name);
    });

    // Compute Metrics for Dashboard Cards
    const totalMembers = memberRecords.length;
    const activeCount = memberRecords.filter(m => m.memberStatus === 'Member' && m.activityStatus === 'Active').length;
    const inactiveCount = memberRecords.filter(m => m.memberStatus === 'Member' && m.activityStatus === 'Inactive').length;
    const invitedCount = memberRecords.filter(m => m.memberStatus === 'Invited').length;
    const notInvitedCount = memberRecords.filter(m => m.memberStatus === 'Not Invited').length;
    const totalCoursesEnrolled = memberRecords.reduce((sum, m) => sum + m.enrolledCourses, 0);

    const activePct = totalMembers > 0 ? Math.round((activeCount / totalMembers) * 100) : 0;
    const inactivePct = totalMembers > 0 ? Math.round((inactiveCount / totalMembers) * 100) : 0;

    // Setup worksheet columns
    wsMemberDetails.columns = [
      { key: 'name', width: 28 },
      { key: 'email', width: 36 },
      { key: 'enrolled_courses', width: 18 },
      { key: 'member_status', width: 20 },
      { key: 'activity_status', width: 18 },
      { key: 'last_activity_date', width: 24 },
      { key: 'record_source', width: 26 },
    ];

    // Row 1: Merged Title Banner
    wsMemberDetails.mergeCells('A1:G1');
    const r1 = wsMemberDetails.getCell('A1');
    r1.value = 'COURSERA ACTIVITY REPORT — MEMBER DETAILS & ENGAGEMENT DASHBOARD';
    r1.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 13 };
    r1.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }, // Slate 900
    };
    r1.alignment = { vertical: 'middle', horizontal: 'center' };
    wsMemberDetails.getRow(1).height = 34;

    // Row 2: Subtitle Banner
    wsMemberDetails.mergeCells('A2:G2');
    const r2 = wsMemberDetails.getCell('A2');
    r2.value = `Report Period: ${formattedSelectedMonth}   |   Generated: ${generatedTimestamp}   |   Total Evaluated: ${totalMembers} Members   |   Total Enrolled Courses: ${totalCoursesEnrolled}`;
    r2.font = { color: { argb: 'FFE2E8F0' }, size: 10, italic: true };
    r2.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF334155' }, // Slate 700
    };
    r2.alignment = { vertical: 'middle', horizontal: 'center' };
    wsMemberDetails.getRow(2).height = 22;

    // Row 3: Blank separator
    wsMemberDetails.getRow(3).height = 10;

    // Rows 4-5: Executive KPI Dashboard Cards
    const cardDefs = [
      {
        cols: ['A'],
        title: 'TOTAL MEMBERS',
        val: `${totalMembers}`,
        sub: 'Total Evaluated',
        bg: 'FFF8FAFC',
        titleColor: 'FF475569',
        valColor: 'FF0F172A',
        borderColor: 'FFE2E8F0',
      },
      {
        cols: ['B'],
        title: 'ACTIVE MEMBERS',
        val: `${activeCount} (${activePct}%)`,
        sub: 'Active <= 30 Days',
        bg: 'FFECFDF5',
        titleColor: 'FF047857',
        valColor: 'FF065F46',
        borderColor: 'FFA7F3D0',
      },
      {
        cols: ['C'],
        title: 'INACTIVE MEMBERS',
        val: `${inactiveCount} (${inactivePct}%)`,
        sub: 'Inactive > 30 Days',
        bg: 'FFFFFBEB',
        titleColor: 'FFB45309',
        valColor: 'FF92400E',
        borderColor: 'FFFDE68A',
      },
      {
        cols: ['D'],
        title: 'INVITED (PENDING)',
        val: `${invitedCount}`,
        sub: 'Invite Sent / No Account',
        bg: 'FFEFF6FF',
        titleColor: 'FF1D4ED8',
        valColor: 'FF1E40AF',
        borderColor: 'FFBFDBFE',
      },
      {
        cols: ['E'],
        title: 'NOT INVITED',
        val: `${notInvitedCount}`,
        sub: 'No Account & No Invite',
        bg: 'FFFFF1F2',
        titleColor: 'FFE11D48',
        valColor: 'FF9F1239',
        borderColor: 'FFFECDD3',
      },
      {
        cols: ['F', 'G'],
        title: 'TOTAL COURSES',
        val: `${totalCoursesEnrolled}`,
        sub: 'Enrolled Courses Sum',
        bg: 'FFEEF2FF',
        titleColor: 'FF4338CA',
        valColor: 'FF3730A3',
        borderColor: 'FFC7D2FE',
      },
    ];

    wsMemberDetails.getRow(4).height = 18;
    wsMemberDetails.getRow(5).height = 26;

    for (const card of cardDefs) {
      const topCell = `${card.cols[0]}4`;
      const valCell = `${card.cols[0]}5`;
      if (card.cols.length > 1) {
        wsMemberDetails.mergeCells(`${card.cols[0]}4:${card.cols[1]}4`);
        wsMemberDetails.mergeCells(`${card.cols[0]}5:${card.cols[1]}5`);
      }

      const tC = wsMemberDetails.getCell(topCell);
      tC.value = card.title;
      tC.font = { bold: true, size: 8.5, color: { argb: card.titleColor } };
      tC.alignment = { vertical: 'middle', horizontal: 'center' };
      tC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: card.bg } };

      const vC = wsMemberDetails.getCell(valCell);
      vC.value = card.val;
      vC.font = { bold: true, size: 14, color: { argb: card.valColor } };
      vC.alignment = { vertical: 'middle', horizontal: 'center' };
      vC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: card.bg } };

      // Apply borders to the card block
      ['4', '5'].forEach(r => {
        card.cols.forEach(c => {
          const cell = wsMemberDetails.getCell(`${c}${r}`);
          cell.border = {
            top: { style: 'thin', color: { argb: card.borderColor } },
            left: { style: 'thin', color: { argb: card.borderColor } },
            bottom: { style: 'thin', color: { argb: card.borderColor } },
            right: { style: 'thin', color: { argb: card.borderColor } },
          };
        });
      });
    }

    // Row 6: Blank separator
    wsMemberDetails.getRow(6).height = 12;

    // Row 7: Data Table Header
    const headers = [
      'Learner / Member Name',
      'Email Address',
      'Enrolled Courses',
      'Member Status',
      'Activity',
      'Last Activity Date',
      'Record Source',
    ];

    const headerRow = wsMemberDetails.getRow(7);
    headerRow.values = headers;
    headerRow.height = 28;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10.5 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Slate 800
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF0F172A' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } },
      };
    });

    // Row 8+: Data rows
    for (const m of memberRecords) {
      const row = wsMemberDetails.addRow({
        name: m.name,
        email: m.email,
        enrolled_courses: m.enrolledCourses,
        member_status: m.memberStatus,
        activity_status: m.activityStatus,
        last_activity_date: m.lastActivityDate,
        record_source: m.recordSource,
      });

      row.height = 22;

      // Formatting & Alignments
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(3).numFmt = '#,##0';

      // Member Status Badge Styling (Cell 4)
      const memberStatusCell = row.getCell(4);
      if (m.memberStatus === 'Member') {
        memberStatusCell.font = { bold: true, color: { argb: 'FF065F46' }, size: 10 };
        memberStatusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      } else if (m.memberStatus === 'Invited') {
        memberStatusCell.font = { bold: true, color: { argb: 'FF1E40AF' }, size: 10 };
        memberStatusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
      } else {
        memberStatusCell.font = { bold: true, color: { argb: 'FF9F1239' }, size: 9.5 };
        memberStatusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE4E6' } };
      }

      // Activity Status Badge Styling (Cell 5)
      const activityCell = row.getCell(5);
      if (m.activityStatus === 'Active') {
        activityCell.font = { bold: true, color: { argb: 'FF047857' }, size: 10 };
        activityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
      } else if (m.activityStatus === 'Inactive') {
        activityCell.font = { bold: true, color: { argb: 'FFB45309' }, size: 9.5 };
        activityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      } else {
        activityCell.font = { color: { argb: 'FF64748B' }, size: 9.5 };
        activityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      }

      // Thin borders for row cells
      for (let c = 1; c <= 7; c++) {
        row.getCell(c).border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── SHEET 2: Learner Summary Tab ─────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  const wsLearners = workbook.addWorksheet('Learner Summary', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  wsLearners.columns = [
    { header: 'Learner Name', key: 'name', width: 25 },
    { header: 'Email Address', key: 'email', width: 35 },
    { header: 'Snapshot Month', key: 'month', width: 16 },
    { header: 'Monthly Hours', key: 'monthly_hours', width: 16 },
    { header: 'Cumulative Hours', key: 'cumulative_hours', width: 18 },
    { header: 'Courses Enrolled', key: 'courses_enrolled', width: 18 },
    { header: 'Courses Active', key: 'courses_active', width: 16 },
    { header: 'Courses Completed', key: 'courses_completed', width: 18 },
    { header: 'New Completions', key: 'new_completions', width: 18 },
    { header: 'Average Progress', key: 'avg_progress', width: 18 },
    { header: 'Active Status', key: 'is_active', width: 16 },
    { header: 'Days Since Activity', key: 'days_since_activity', width: 22 },
  ];

  const header1 = wsLearners.getRow(1);
  header1.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  header1.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' }, // Slate 900
  };
  header1.alignment = { vertical: 'middle', horizontal: 'center' };
  header1.height = 28;

  for (const l of learners) {
    const row = wsLearners.addRow({
      name: l.name || emailToAlumniName.get(l.email.toLowerCase().trim()) || '—',
      email: l.email,
      month: formatMonthForReport(l.month),
      monthly_hours: Number(l.monthly_hours) || 0,
      cumulative_hours: Number(l.cumulative_hours) || 0,
      courses_enrolled: Number(l.courses_enrolled) || 0,
      courses_active: Number(l.courses_active) || 0,
      courses_completed: Number(l.courses_completed) || 0,
      new_completions: Number(l.new_completions) || 0,
      avg_progress: (Number(l.avg_progress) || 0) / 100,
      is_active: l.is_active ? 'Active' : 'Inactive',
      days_since_activity: l.days_since_activity !== null ? Number(l.days_since_activity) : '—',
    });

    row.getCell('monthly_hours').numFmt = '#,##0.0';
    row.getCell('cumulative_hours').numFmt = '#,##0.0';
    row.getCell('avg_progress').numFmt = '0.0%';
    row.getCell('name').alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell('email').alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell('month').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('is_active').alignment = { vertical: 'middle', horizontal: 'center' };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── SHEET 3: Course Breakdown Snapshots ──────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  if (includeCourseBreakdown && snapshots.length > 0) {
    const wsSnapshots = workbook.addWorksheet('Course Breakdown', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    wsSnapshots.columns = [
      { header: 'Learner Name', key: 'name', width: 25 },
      { header: 'Email Address', key: 'email', width: 35 },
      { header: 'Snapshot Month', key: 'snapshot_month', width: 16 },
      { header: 'Course Name', key: 'course_name', width: 40 },
      { header: 'Course ID', key: 'course_id', width: 26 },
      { header: 'University / Partner', key: 'university', width: 24 },
      { header: 'Course Type', key: 'course_type', width: 16 },
      { header: 'Program Name', key: 'program_name', width: 22 },
      { header: 'Learning Hours', key: 'cumulative_learning_hours', width: 16 },
      { header: 'Progress', key: 'overall_progress', width: 16 },
      { header: 'Completed', key: 'completed', width: 14 },
      { header: 'Completion Date', key: 'completion_time', width: 20 },
      { header: 'Grade', key: 'course_grade', width: 14 },
      { header: 'Enrollment Date', key: 'enrollment_time', width: 20 },
      { header: 'Last Activity Date', key: 'last_activity_time', width: 22 },
      { header: 'Certificate URL', key: 'certificate_url', width: 45 },
    ];

    const header2 = wsSnapshots.getRow(1);
    header2.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    header2.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Slate 800
    };
    header2.alignment = { vertical: 'middle', horizontal: 'center' };
    header2.height = 28;

    for (const s of snapshots) {
      const row = wsSnapshots.addRow({
        name: s.name || emailToAlumniName.get(s.email.toLowerCase().trim()) || '—',
        email: s.email,
        snapshot_month: formatMonthForReport(s.snapshot_month),
        course_name: s.course_name ?? '—',
        course_id: s.course_id,
        university: s.university ?? '—',
        course_type: s.course_type ?? '—',
        program_name: s.program_name ?? '—',
        cumulative_learning_hours: Number(s.cumulative_learning_hours) || 0,
        overall_progress: (Number(s.overall_progress) || 0) / 100,
        completed: s.completed ? 'Yes' : 'No',
        completion_time: s.completion_time ? s.completion_time.substring(0, 10) : '—',
        course_grade: s.course_grade !== null ? Number(s.course_grade) : '—',
        enrollment_time: s.enrollment_time ? s.enrollment_time.substring(0, 10) : '—',
        last_activity_time: s.last_activity_time ? s.last_activity_time.substring(0, 10) : '—',
        certificate_url: s.certificate_url ?? '—',
      });

      row.getCell('cumulative_learning_hours').numFmt = '#,##0.0';
      row.getCell('overall_progress').numFmt = '0.0%';
      row.getCell('name').alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell('email').alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell('completed').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('snapshot_month').alignment = { vertical: 'middle', horizontal: 'center' };
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── SHEET 4: Unmatched Learners ──────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  if (includeUnmatchedSheet && missingEmails.length > 0) {
    const wsUnmatched = workbook.addWorksheet('Unmatched Learners', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    wsUnmatched.columns = [
      { header: 'Email Address', key: 'email', width: 34 },
      { header: 'Learner Name', key: 'name', width: 26 },
      { header: 'Coursera Status', key: 'status', width: 36 },
      { header: 'Enrollment Date', key: 'enrollment_date', width: 20 },
      { header: 'Last Activity Date', key: 'last_activity_date', width: 20 },
      { header: 'Historical Enrollment', key: 'history', width: 30 },
      { header: 'Verification Notes', key: 'notes', width: 55 },
    ];

    const header3 = wsUnmatched.getRow(1);
    header3.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    header3.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF475569' }, // Slate 600
    };
    header3.alignment = { vertical: 'middle', horizontal: 'center' };
    header3.height = 28;

    for (const email of missingEmails) {
      const cleanEmail = email.toLowerCase().trim();
      const historyInfo = historyMap.get(cleanEmail);
      const liveUser = liveCourseraMap.get(cleanEmail);
      const liveAct = liveActivityMap.get(cleanEmail);
      const alumniName = emailToAlumniName.get(cleanEmail);

      let name = alumniName || '—';
      let status = 'Not Invited (No Coursera Account Found)';
      let enrollmentDate = '—';
      let lastActivityDate = '—';
      let history = 'Never Enrolled / No Records';
      let notes = 'Email address was not found in system snapshots, active roster, or pending Coursera invitations.';

      if (historyInfo) {
        name = alumniName || historyInfo.name || (liveUser?.fullName ?? '—');
        status = 'Inactive (Active on Coursera (No Activity in Selected Month))';
        enrollmentDate = formatDateTimeForReport(historyInfo.earliestEnrollment || liveAct?.earliestEnrollment);
        lastActivityDate = formatDateTimeForReport(historyInfo.latestActivity || liveAct?.latestActivity);
        history = historyInfo.months.length > 0
          ? `Recorded in ${historyInfo.months.join(', ')}`
          : 'Enrolled in Other Months';
        notes = 'Learner exists in system snapshots but had 0 hours and no course enrollments in the selected month.';
      } else if (liveUser) {
        name = alumniName || liveUser.fullName || '—';
        status = 'Inactive (Active on Coursera (No Activity in Selected Month))';
        enrollmentDate = formatDateTimeForReport(liveAct?.earliestEnrollment);
        lastActivityDate = formatDateTimeForReport(liveAct?.latestActivity);
        history = 'Live Coursera Enterprise Account';
        notes = `Learner holds an active Coursera Enterprise license${liveUser.fullName ? ` (${liveUser.fullName})` : ''}${liveAct?.coursesCount ? ` with ${liveAct.coursesCount} enrolled course(s)` : ''}, but no activity was recorded in this period.`;
      } else if (liveInvitationsMap.get(cleanEmail)) {
        const liveInv = liveInvitationsMap.get(cleanEmail);
        name = alumniName || liveInv?.fullName || '—';
        status = 'Invited (No Coursera Account Found)';
        history = 'Coursera Pending Invite';
        notes = 'Learner was invited to Coursera Enterprise program but has not yet accepted or registered an account.';
      }

      const row = wsUnmatched.addRow({
        email,
        name,
        status,
        enrollment_date: enrollmentDate,
        last_activity_date: lastActivityDate,
        history,
        notes,
      });

      row.getCell('email').alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell('name').alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell('status').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('enrollment_date').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('last_activity_date').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('history').alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell('notes').alignment = { vertical: 'middle', horizontal: 'left' };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const dateStr = month === 'all' ? 'All_Months' : month.substring(0, 7);
  const filename = `Coursera_Activity_Report_${dateStr}_${Date.now()}.xlsx`;

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
