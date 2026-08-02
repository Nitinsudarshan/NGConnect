import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import * as XLSX from 'xlsx';

// firstDayOfMonth: string-only, no new Date() to avoid IST timezone shift
const firstDayOfMonth = (s: string) => s.substring(0, 7) + '-01';

function parseDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value.toISOString();
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  }
  return null;
}

async function upsertInBatches<T extends object>(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  rows: T[],
  onConflict: string,
  batchSize = 500
) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(batch, { onConflict });
    if (error) throw new Error(`Batch upsert failed on ${table}: ${error.message}`);
  }
}

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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const supabase = createAdminClient();

  // ── STEP 0: Validate inputs ──────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const snapshotMonth = (formData.get('snapshotMonth') as string | null)?.trim();
  const uploadedBy = (formData.get('uploadedBy') as string | null)?.trim() || null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!snapshotMonth || !/^\d{4}-\d{2}-\d{2}$/.test(snapshotMonth)) {
    return NextResponse.json({ error: 'snapshotMonth must be in YYYY-MM-DD format' }, { status: 400 });
  }
  const parsedDate = new Date(snapshotMonth);
  if (isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: 'snapshotMonth is not a valid date' }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return NextResponse.json({ error: 'Only .xlsx files are supported' }, { status: 400 });
  }

  // Check for duplicate import (must consider rollbacks)
  const { data: latestLogs } = await supabase
    .from('coursera_import_log')
    .select('action, status')
    .eq('snapshot_month', snapshotMonth)
    .eq('status', 'success')
    .order('imported_at', { ascending: false })
    .limit(1);

  if (latestLogs && latestLogs.length > 0 && latestLogs[0].action !== 'rollback') {
    return NextResponse.json({
      error: 'A successful import already exists for this month. Use rollback first if you want to re-import.'
    }, { status: 409 });
  }

  // ── STEP 1: Parse the XLSX file ──────────────────────────────────────────
  const buffer = Buffer.from(await file.arrayBuffer());
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  } catch {
    return NextResponse.json({ error: 'Failed to parse XLSX file' }, { status: 400 });
  }

  const sheetName =
    workbook.SheetNames.includes('Learner Activity') ? 'Learner Activity' :
    workbook.SheetNames.includes('Course Activity') ? 'Course Activity' : null;

  if (!sheetName) {
    return NextResponse.json({
      error: `No recognised sheet found. Sheets in file: ${workbook.SheetNames.join(', ')}`
    }, { status: 400 });
  }

  const sheet = workbook.Sheets[sheetName];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
  const totalRows = rawRows.length;

  // ── STEP 2: Validate columns ─────────────────────────────────────────────
  const REQUIRED_COLS = [
    'Email', 'Name', 'Course ID', 'Course', 'University',
    'Course Type', 'Learning Hours', 'Overall Progress', 'Completed'
  ];
  if (rawRows.length > 0) {
    const firstRow = rawRows[0];
    const missing = REQUIRED_COLS.filter(c => !(c in firstRow));
    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing required columns: ${missing.join(', ')}` }, { status: 400 });
    }
  }

  const validRows = rawRows.filter(r => r['Email'] && r['Course ID']);
  const skippedRows = totalRows - validRows.length;

  // ── STEP 3: Transform rows ───────────────────────────────────────────────
  const transformedRows = validRows.map(row => ({
    snapshot_month:            snapshotMonth,
    email:                     row['Email'].toString().trim().toLowerCase(),
    name:                      row['Name']?.toString().trim() || null,
    course_id:                 row['Course ID']?.toString().trim(),
    course_name:               row['Course']?.toString().trim() || null,
    course_slug:               row['Course Slug']?.toString().trim() || null,
    university:                row['University']?.toString().trim() || null,
    course_type:               row['Course Type']?.toString().trim() || null,
    program_name:              row['Program Name']?.toString().trim() || null,
    enrollment_time:           parseDate(row['Enrollment Time']),
    last_activity_time:        parseDate(row['Last Course Activity Time']),
    overall_progress:          parseFloat(row['Overall Progress']) || 0,
    cumulative_learning_hours: parseFloat(row['Learning Hours']) || 0,
    estimated_course_hours:    null,
    completed:                 row['Completed']?.toString().trim() === 'Yes',
    removed_from_program:      row['Removed From Program']?.toString().trim() === 'Yes',
    completion_time:           parseDate(row['Completion Time']),
    course_grade:              row['Course Grade'] != null ? parseFloat(row['Course Grade']) : null,
    certificate_url:           row['Course Certificate URL']?.toString().trim() || null,
  }));

  // ── STEP 3.5: Deduplicate rows ───────────────────────────────────────────
  // Real world data sometimes contains duplicates for the same (email, course_id).
  // Postgres ON CONFLICT cannot update the same row twice in one statement.
  // We keep the row with the most cumulative_learning_hours.
  const seen = new Map<string, typeof transformedRows[0]>();
  for (const row of transformedRows) {
    const key = `${row.email}|${row.course_id}`;
    const existing = seen.get(key);
    if (!existing || row.cumulative_learning_hours > existing.cumulative_learning_hours) {
      seen.set(key, row);
    }
  }
  const finalRows = Array.from(seen.values());

  // Find previous snapshot month early for carry-forward
  const { data: prevMonthRow } = await supabase
    .from('coursera_snapshots')
    .select('snapshot_month')
    .lt('snapshot_month', snapshotMonth)
    .order('snapshot_month', { ascending: false })
    .limit(1)
    .single();

  const prevMonth: string | null = prevMonthRow?.snapshot_month ?? null;

  // ── STEP 3.6: Carry forward missing courses for active learners ─────────
  if (prevMonth) {
    const prevSnapshots = await fetchAllSupabase(
      supabase.from('coursera_snapshots').select('*').eq('snapshot_month', prevMonth)
    );
      
    if (prevSnapshots && prevSnapshots.length > 0) {
      const currentKeys = new Set(finalRows.map(r => `${r.email}|${r.course_id}`));
      const currentEmails = new Set(finalRows.map(r => r.email));
      
      for (const p of prevSnapshots) {
        if (currentEmails.has(p.email) && !currentKeys.has(`${p.email}|${p.course_id}`)) {
          // Carry forward!
          finalRows.push({
            snapshot_month: snapshotMonth,
            email: p.email,
            name: p.name,
            course_id: p.course_id,
            course_name: p.course_name,
            course_slug: p.course_slug,
            university: p.university,
            course_type: p.course_type,
            program_name: p.program_name,
            enrollment_time: p.enrollment_time ? new Date(p.enrollment_time).toISOString() : null,
            last_activity_time: p.last_activity_time ? new Date(p.last_activity_time).toISOString() : null,
            overall_progress: p.overall_progress,
            cumulative_learning_hours: p.cumulative_learning_hours,
            estimated_course_hours: p.estimated_course_hours,
            completed: p.completed,
            removed_from_program: p.removed_from_program,
            completion_time: p.completion_time ? new Date(p.completion_time).toISOString() : null,
            course_grade: p.course_grade,
            certificate_url: p.certificate_url,
          });
        }
      }
    }
  }

  // ── STEP 4: Upsert snapshots ─────────────────────────────────────────────
  try {
    await upsertInBatches(supabase, 'coursera_snapshots', finalRows, 'snapshot_month,email,course_id');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // ── STEP 5: Compute monthly metrics ─────────────────────────────────────

  // 5a. Fetch config
  const { data: config } = await supabase
    .from('coursera_config')
    .select('minimum_monthly_hours, inactive_after_days, total_licenses')
    .eq('id', 1)
    .single();

  const minMonthlyHours = config?.minimum_monthly_hours ?? 20;
  const totalLicenses = config?.total_licenses ?? 0;

  // 5b. Find previous snapshot month (already done above as prevMonth)

  // 5c. Fetch previous month per-learner totals via coursera_learner_month
  type PrevTotals = { email: string; prev_hours: number; prev_completions: number };
  const prevMap = new Map<string, PrevTotals>();
  let prevRecords: any[] = [];
  if (prevMonth) {
    const d = new Date(prevMonth);
    const firstDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    prevRecords = await fetchAllSupabase(
      supabase.from('coursera_learner_month').select('*').eq('month', firstDay)
    );
    for (const row of prevRecords) {
      prevMap.set(row.email, { email: row.email, prev_hours: Number(row.cumulative_hours), prev_completions: Number(row.courses_completed) });
    }
  }

  // 5d. Group current rows by email in JS
  const byEmail = new Map<string, typeof finalRows>();
  for (const row of finalRows) {
    if (!byEmail.has(row.email)) byEmail.set(row.email, []);
    byEmail.get(row.email)!.push(row);
  }

  // 5e. Per-learner metrics
  const monthYear = snapshotMonth.substring(0, 7); // "YYYY-MM"

  const learnerMonthRecords = Array.from(byEmail.entries()).map(([email, rows]) => {
    const prev = prevMap.get(email) ?? { prev_hours: 0, prev_completions: 0 };

    const cumulative_hours = rows.reduce((s, r) => s + r.cumulative_learning_hours, 0);
    const monthly_hours = Math.max(0, cumulative_hours - prev.prev_hours);

    const courses_enrolled = rows.length;
    const courses_completed = rows.filter(r => r.completed).length;
    const new_completions = Math.max(0, courses_completed - prev.prev_completions);
    const avg_progress = rows.reduce((s, r) => s + r.overall_progress, 0) / rows.length;

    const is_active = monthly_hours > 0;

    const courses_active = rows.filter(r =>
      r.last_activity_time &&
      ((r.last_activity_time as any).toISOString 
        ? (r.last_activity_time as any).toISOString().substring(0, 7) 
        : new Date(r.last_activity_time).toISOString().substring(0, 7)) === monthYear
    ).length;

    const activityTimes = rows
      .filter(r => r.last_activity_time)
      .map(r => new Date(r.last_activity_time!).getTime())
      .sort((a, b) => b - a);

    const latestActivity = activityTimes[0] ?? null;
    const snapshotDate = new Date(snapshotMonth + 'T00:00:00Z').getTime();
    const days_since_activity = latestActivity !== null
      ? Math.floor((snapshotDate - latestActivity) / 86400000)
      : null;

    const is_compliant = monthly_hours >= minMonthlyHours;

    return {
      month: firstDayOfMonth(snapshotMonth),
      email,
      name: rows[0].name,
      monthly_hours,
      cumulative_hours,
      courses_enrolled,
      courses_active,
      courses_completed,
      new_completions,
      avg_progress,
      is_active,
      is_compliant,
      days_since_activity,
    };
  });

  // 5f. Upsert learner_month
  try {
    await upsertInBatches(supabase, 'coursera_learner_month', learnerMonthRecords, 'month,email');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // ── STEP 6: Build JSONB metrics blob ─────────────────────────────────────

  // We already fetched prevRecords in Step 5c. Just build the map for MoM deltas:
  const prevByEmail = new Map(prevRecords.map(r => [r.email, r]));

  // Fix: Use current month file learners instead of all-time distinct count
  const total_learners = learnerMonthRecords.length;

  const active_learners = learnerMonthRecords.filter(r => r.is_active).length;
  const inactive_learners = learnerMonthRecords.filter(r => !r.is_active).length;
  const compliant_learners = learnerMonthRecords.filter(r => r.is_compliant).length;
  const total_lifetime_hours = learnerMonthRecords.reduce((s, r) => s + r.cumulative_hours, 0);
  const monthly_hours_total = learnerMonthRecords.reduce((s, r) => s + r.monthly_hours, 0);
  const avg_hours_per_active_learner = active_learners > 0 ? monthly_hours_total / active_learners : 0;
  const total_courses_enrolled = learnerMonthRecords.reduce((s, r) => s + r.courses_enrolled, 0);
  const total_courses_completed = learnerMonthRecords.reduce((s, r) => s + r.courses_completed, 0);
  const monthly_completions = learnerMonthRecords.reduce((s, r) => s + r.new_completions, 0);
  const overall_completion_rate = total_courses_enrolled > 0
    ? (total_courses_completed / total_courses_enrolled) * 100 : 0;
  const licenses_active = active_learners;
  const license_utilization_pct = totalLicenses > 0
    ? (licenses_active / totalLicenses) * 100 : null;

  const prevActiveLearners = prevRecords.filter(r => r.is_active).length;
  const prevMonthlyHours = prevRecords.reduce((s, r) => s + r.monthly_hours, 0);
  const prevCompletions = prevRecords.reduce((s, r) => s + r.new_completions, 0);

  const metricsBlob = {
    // Executive cards
    total_learners,
    active_learners,
    inactive_learners,
    compliant_learners,
    total_lifetime_hours,
    monthly_hours: monthly_hours_total,
    avg_hours_per_active_learner,
    total_courses_enrolled,
    total_courses_completed,
    monthly_completions,
    overall_completion_rate,
    total_licenses: totalLicenses,
    licenses_active,
    license_utilization_pct,

    // MoM deltas
    mom_active_learners: active_learners - prevActiveLearners,
    mom_monthly_hours: monthly_hours_total - prevMonthlyHours,
    mom_completions: monthly_completions - prevCompletions,
    new_learners_this_month: learnerMonthRecords.filter(r => !prevByEmail.has(r.email)).length,
    reactivated_learners: learnerMonthRecords.filter(r =>
      r.is_active && prevByEmail.has(r.email) && !prevByEmail.get(r.email)!.is_active
    ).length,
    became_inactive: learnerMonthRecords.filter(r =>
      !r.is_active && prevByEmail.has(r.email) && prevByEmail.get(r.email)!.is_active
    ).length,

    // Distributions
    hours_distribution: {
      '0':     learnerMonthRecords.filter(r => r.monthly_hours === 0).length,
      '1-5':   learnerMonthRecords.filter(r => r.monthly_hours > 0 && r.monthly_hours <= 5).length,
      '6-10':  learnerMonthRecords.filter(r => r.monthly_hours > 5 && r.monthly_hours <= 10).length,
      '11-20': learnerMonthRecords.filter(r => r.monthly_hours > 10 && r.monthly_hours <= 20).length,
      '21-40': learnerMonthRecords.filter(r => r.monthly_hours > 20 && r.monthly_hours <= 40).length,
      '40+':   learnerMonthRecords.filter(r => r.monthly_hours > 40).length,
    },
    progress_distribution: {
      '0%':     learnerMonthRecords.filter(r => r.avg_progress === 0).length,
      '1-25%':  learnerMonthRecords.filter(r => r.avg_progress > 0 && r.avg_progress <= 25).length,
      '26-50%': learnerMonthRecords.filter(r => r.avg_progress > 25 && r.avg_progress <= 50).length,
      '51-75%': learnerMonthRecords.filter(r => r.avg_progress > 50 && r.avg_progress <= 75).length,
      '76-99%': learnerMonthRecords.filter(r => r.avg_progress > 75 && r.avg_progress < 100).length,
      '100%':   learnerMonthRecords.filter(r => r.avg_progress === 100).length,
    },

    // Leaderboards (pre-sorted, top 20)
    top_learners_by_hours: [...learnerMonthRecords]
      .sort((a, b) => b.monthly_hours - a.monthly_hours)
      .slice(0, 20)
      .map(r => ({ email: r.email, name: r.name, monthly_hours: r.monthly_hours, cumulative_hours: r.cumulative_hours })),

    top_learners_by_cumulative: [...learnerMonthRecords]
      .sort((a, b) => b.cumulative_hours - a.cumulative_hours)
      .slice(0, 20)
      .map(r => ({ email: r.email, name: r.name, cumulative_hours: r.cumulative_hours })),

    bottom_learners: [...learnerMonthRecords]
      .filter(r => r.is_active)
      .sort((a, b) => a.monthly_hours - b.monthly_hours)
      .slice(0, 20)
      .map(r => ({ email: r.email, name: r.name, monthly_hours: r.monthly_hours, days_since_activity: r.days_since_activity })),

    // Intervention lists
    learners_below_target: [...learnerMonthRecords]
      .filter(r => r.is_active && !r.is_compliant)
      .sort((a, b) => a.monthly_hours - b.monthly_hours)
      .slice(0, 50)
      .map(r => ({ email: r.email, name: r.name, monthly_hours: r.monthly_hours })),

    learners_no_activity_30: [...learnerMonthRecords]
      .filter(r => r.days_since_activity !== null && r.days_since_activity >= 30)
      .sort((a, b) => (b.days_since_activity ?? 0) - (a.days_since_activity ?? 0))
      .slice(0, 50)
      .map(r => ({ email: r.email, name: r.name, days_since_activity: r.days_since_activity })),

    learners_no_activity_60: learnerMonthRecords
      .filter(r => r.days_since_activity !== null && r.days_since_activity >= 60).length,
    learners_no_activity_90: learnerMonthRecords
      .filter(r => r.days_since_activity !== null && r.days_since_activity >= 90).length,
    never_active: learnerMonthRecords.filter(r => r.days_since_activity === null).length,

    // Alerts
    alerts: [
      {
        type: 'below_target',
        count: learnerMonthRecords.filter(r => r.is_active && !r.is_compliant).length,
        threshold: minMonthlyHours,
      },
      {
        type: 'inactive_30',
        count: learnerMonthRecords.filter(r => (r.days_since_activity ?? -1) >= 30).length,
      },
      {
        type: 'inactive_90',
        count: learnerMonthRecords.filter(r => (r.days_since_activity ?? -1) >= 90).length,
      },
    ].filter(a => a.count > 0),

    // Metadata
    snapshot_month: snapshotMonth,
    config: {
      minimum_monthly_hours: minMonthlyHours,
      inactive_after_days: config?.inactive_after_days ?? 90,
      total_licenses: totalLicenses,
    },
    generated_at: new Date().toISOString(),
  };

  // ── STEP 7: Upsert metrics blob ──────────────────────────────────────────
  const { error: metricsErr } = await supabase
    .from('coursera_computed_metrics')
    .upsert({
      month: firstDayOfMonth(snapshotMonth),
      metrics: metricsBlob,
      generated_by: uploadedBy,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'month' });

  if (metricsErr) {
    return NextResponse.json({ error: `Failed to save metrics: ${metricsErr.message}` }, { status: 500 });
  }

  // ── STEP 8: Write import log ─────────────────────────────────────────────
  await supabase.from('coursera_import_log').insert({
    snapshot_month:    snapshotMonth,
    filename:          file.name,
    file_size_bytes:   file.size,
    rows_imported:     finalRows.length,
    learners_affected: byEmail.size,
    action:            'import',
    status:            'success',
    duration_ms:       Date.now() - startTime,
    imported_by:       uploadedBy,
  });

  // ── STEP 9: Return response ──────────────────────────────────────────────
  return NextResponse.json({
    success: true,
    rowsImported: finalRows.length,
    learnersAffected: byEmail.size,
    skippedRows: totalRows - finalRows.length,
    durationMs: Date.now() - startTime,
    month: firstDayOfMonth(snapshotMonth),
  });
}
