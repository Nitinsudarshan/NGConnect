import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
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

  const supabase = createAdminClient();

  let body: {
    month?: string;
    userScope?: 'all' | 'users' | 'single' | 'list' | 'imported';
    emails?: string[];
    includeCourseBreakdown?: boolean;
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

  if (learners.length === 0) {
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
