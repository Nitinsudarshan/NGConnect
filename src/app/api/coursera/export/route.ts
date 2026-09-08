import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import { batchCheckCourseraUsersLive } from '@/lib/coursera-api';
import ExcelJS from 'exceljs';

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

  const role = user.app_metadata?.role;
  if (role !== 'Admin' && role !== 'Super Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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

  // ── 1. Fetch Learner Activity Data (coursera_learner_month) ─────────────────
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

  if (learners.length === 0 && (!includeUnmatchedSheet || missingEmails.length === 0)) {
    return NextResponse.json({
      error: 'No learner activity records found matching the specified month and email criteria.'
    }, { status: 404 });
  }

  // ── 2. Fetch Course Snapshots Data if requested ─────────────────────────────
  let snapshots: any[] = [];
  if (includeCourseBreakdown) {
    const targetEmails = userScope === 'all'
      ? Array.from(new Set(learners.map(l => l.email)))
      : sanitizedEmails;

    const CHUNK_SIZE = 500;
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

  // ── 3. Build Excel Workbook ────────────────────────────────────────────────
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NGConnect Platform';
  workbook.created = new Date();

  // ── Sheet 1: Learner Activity Summary ──────────────────────────────────────
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

  // Header styling
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
      name: l.name ?? '—',
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

    // Alignments & formats
    row.getCell('monthly_hours').numFmt = '#,##0.0';
    row.getCell('cumulative_hours').numFmt = '#,##0.0';
    row.getCell('avg_progress').numFmt = '0.0%';
    row.getCell('name').alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell('email').alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell('month').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('is_active').alignment = { vertical: 'middle', horizontal: 'center' };
  }

  // ── Sheet 2: Course Breakdown Snapshots ─────────────────────────────────────
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
        name: s.name ?? '—',
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

  // ── Sheet 3: Unmatched Learners (Requested emails with no records) ──────────
  if (includeUnmatchedSheet && missingEmails.length > 0) {
    const wsUnmatched = workbook.addWorksheet('Unmatched Learners', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    wsUnmatched.columns = [
      { header: 'Email Address', key: 'email', width: 34 },
      { header: 'Learner Name', key: 'name', width: 26 },
      { header: 'Coursera Status', key: 'status', width: 32 },
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

    // Check if these missing emails exist in snapshots and extract enrollment/activity dates
    interface LearnerHistoryInfo {
      name: string | null;
      earliestEnrollment: string | null;
      latestActivity: string | null;
      months: string[];
    }
    const historyMap = new Map<string, LearnerHistoryInfo>();

    const CHUNK_SIZE = 500;
    for (let i = 0; i < missingEmails.length; i += CHUNK_SIZE) {
      const chunk = missingEmails.slice(i, i + CHUNK_SIZE);
      const { data: otherSnaps } = await supabase
        .from('coursera_snapshots')
        .select('email, name, enrollment_time, last_activity_time, snapshot_month')
        .in('email', chunk);

      if (otherSnaps) {
        for (const os of otherSnaps) {
          let info = historyMap.get(os.email);
          if (!info) {
            info = {
              name: os.name || null,
              earliestEnrollment: os.enrollment_time || null,
              latestActivity: os.last_activity_time || null,
              months: [],
            };
            historyMap.set(os.email, info);
          }
          if (os.name && !info.name) info.name = os.name;

          // Track earliest enrollment date
          if (os.enrollment_time) {
            if (!info.earliestEnrollment || new Date(os.enrollment_time) < new Date(info.earliestEnrollment)) {
              info.earliestEnrollment = os.enrollment_time;
            }
          }

          // Track latest activity date
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

    // Also check missing emails against live Coursera Enterprise API
    let liveCourseraMap = new Map<string, { fullName: string; id: string } | null>();
    try {
      liveCourseraMap = await batchCheckCourseraUsersLive(missingEmails);
    } catch (err) {
      console.warn('[export] Live Coursera check failed gracefully:', err);
    }

    for (const email of missingEmails) {
      const historyInfo = historyMap.get(email);
      const liveUser = liveCourseraMap.get(email);

      let name = '—';
      let status = 'No Coursera Account Found';
      let enrollmentDate = '—';
      let lastActivityDate = '—';
      let history = 'Never Enrolled / No Records';
      let notes = 'Email address was not found in system snapshots or live Coursera Enterprise roster.';

      if (historyInfo) {
        name = historyInfo.name || (liveUser?.fullName ?? '—');
        status = 'Inactive in Selected Month';
        enrollmentDate = formatDateTimeForReport(historyInfo.earliestEnrollment);
        lastActivityDate = formatDateTimeForReport(historyInfo.latestActivity);
        history = historyInfo.months.length > 0
          ? `Recorded in ${historyInfo.months.join(', ')}`
          : 'Enrolled in Other Months';
        notes = 'Learner exists in system snapshots but had 0 hours and no course enrollments in the selected month.';
      } else if (liveUser) {
        name = liveUser.fullName || '—';
        status = 'Active on Coursera (No Activity in Selected Month)';
        enrollmentDate = 'Active Account';
        lastActivityDate = '—';
        history = 'Live Coursera Enterprise Account';
        notes = `Learner holds an active Coursera Enterprise license${liveUser.fullName ? ` (${liveUser.fullName})` : ''}, but no activity was recorded in this period.`;
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
