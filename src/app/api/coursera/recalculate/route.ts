import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const firstDayOfMonth = (s: string) => s.substring(0, 7) + '-01';

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

  let body: { snapshotMonth?: string; requestedBy?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { snapshotMonth, requestedBy } = body;
  if (!snapshotMonth || !/^\d{4}-\d{2}-\d{2}$/.test(snapshotMonth)) {
    return NextResponse.json({ error: 'snapshotMonth must be in YYYY-MM-DD format' }, { status: 400 });
  }

  // STEP 1: Verify snapshots exist
  const { count: snapCount } = await supabase
    .from('coursera_snapshots')
    .select('id', { count: 'exact', head: true })
    .eq('snapshot_month', snapshotMonth);

  if (!snapCount || snapCount === 0) {
    return NextResponse.json({ error: `No snapshots found for month ${snapshotMonth}` }, { status: 404 });
  }

  // STEP 2: Fetch all snapshots for this month
  const snapshots = await fetchAllSupabase(
    supabase.from('coursera_snapshots').select('*').eq('snapshot_month', snapshotMonth)
  );

  if (!snapshots || snapshots.length === 0) {
    return NextResponse.json({ error: `Failed to fetch snapshots or none found` }, { status: 500 });
  }

  // STEP 3: Re-run Steps 5–8 of the import algorithm

  // Fetch config
  const { data: config } = await supabase
    .from('coursera_config')
    .select('minimum_monthly_hours, inactive_after_days, total_licenses')
    .eq('id', 1)
    .single();

  const minMonthlyHours = config?.minimum_monthly_hours ?? 20;
  const totalLicenses = config?.total_licenses ?? 0;

  // Find previous snapshot month
  const { data: prevMonthRow } = await supabase
    .from('coursera_snapshots')
    .select('snapshot_month')
    .lt('snapshot_month', snapshotMonth)
    .order('snapshot_month', { ascending: false })
    .limit(1)
    .single();

  const prevMonth: string | null = prevMonthRow?.snapshot_month ?? null;

  // Fetch prev month totals via coursera_learner_month
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

  // Group by email in JS
  const byEmail = new Map<string, typeof snapshots>();
  for (const row of snapshots) {
    if (!byEmail.has(row.email)) byEmail.set(row.email, []);
    byEmail.get(row.email)!.push(row);
  }

  const monthYear = snapshotMonth.substring(0, 7);

  const learnerMonthRecords = Array.from(byEmail.entries()).map(([email, rows]) => {
    const prev = prevMap.get(email) ?? { prev_hours: 0, prev_completions: 0 };

    const cumulative_hours = rows.reduce((s, r) => s + (r.cumulative_learning_hours ?? 0), 0);
    const monthly_hours = Math.max(0, cumulative_hours - prev.prev_hours);
    const courses_enrolled = rows.length;
    const courses_completed = rows.filter(r => r.completed).length;
    const new_completions = Math.max(0, courses_completed - prev.prev_completions);
    const avg_progress = rows.reduce((s, r) => s + (r.overall_progress ?? 0), 0) / rows.length;
    const is_active = monthly_hours > 0;

    const courses_active = rows.filter(r =>
      r.last_activity_time &&
      r.last_activity_time.substring(0, 7) === monthYear
    ).length;

    const activityTimes = rows
      .filter(r => r.last_activity_time)
      .map(r => new Date(r.last_activity_time).getTime())
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

  try {
    await upsertInBatches(supabase, 'coursera_learner_month', learnerMonthRecords, 'month,email');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // We already fetched prevRecords earlier. Just build the map for MoM deltas:
  const prevByEmail = new Map(prevRecords.map(r => [r.email, r]));

  const { data: distinctCount } = await supabase.rpc('count_distinct_learners');
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
    total_learners, active_learners, inactive_learners, compliant_learners,
    total_lifetime_hours, monthly_hours: monthly_hours_total, avg_hours_per_active_learner,
    total_courses_enrolled, total_courses_completed, monthly_completions,
    overall_completion_rate, total_licenses: totalLicenses, licenses_active, license_utilization_pct,
    mom_active_learners: active_learners - prevActiveLearners,
    mom_monthly_hours: monthly_hours_total - prevMonthlyHours,
    mom_completions: monthly_completions - prevCompletions,
    new_learners_this_month: learnerMonthRecords.filter(r => !prevByEmail.has(r.email)).length,
    reactivated_learners: learnerMonthRecords.filter(r =>
      r.is_active && prevByEmail.has(r.email) && !prevByEmail.get(r.email)!.is_active).length,
    became_inactive: learnerMonthRecords.filter(r =>
      !r.is_active && prevByEmail.has(r.email) && prevByEmail.get(r.email)!.is_active).length,
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
    top_learners_by_hours: [...learnerMonthRecords]
      .sort((a, b) => b.monthly_hours - a.monthly_hours).slice(0, 20)
      .map(r => ({ email: r.email, name: r.name, monthly_hours: r.monthly_hours, cumulative_hours: r.cumulative_hours })),
    top_learners_by_cumulative: [...learnerMonthRecords]
      .sort((a, b) => b.cumulative_hours - a.cumulative_hours).slice(0, 20)
      .map(r => ({ email: r.email, name: r.name, cumulative_hours: r.cumulative_hours })),
    bottom_learners: [...learnerMonthRecords].filter(r => r.is_active)
      .sort((a, b) => a.monthly_hours - b.monthly_hours).slice(0, 20)
      .map(r => ({ email: r.email, name: r.name, monthly_hours: r.monthly_hours, days_since_activity: r.days_since_activity })),
    learners_below_target: [...learnerMonthRecords].filter(r => r.is_active && !r.is_compliant)
      .sort((a, b) => a.monthly_hours - b.monthly_hours).slice(0, 50)
      .map(r => ({ email: r.email, name: r.name, monthly_hours: r.monthly_hours })),
    learners_no_activity_30: [...learnerMonthRecords]
      .filter(r => r.days_since_activity !== null && r.days_since_activity >= 30)
      .sort((a, b) => (b.days_since_activity ?? 0) - (a.days_since_activity ?? 0)).slice(0, 50)
      .map(r => ({ email: r.email, name: r.name, days_since_activity: r.days_since_activity })),
    learners_no_activity_60: learnerMonthRecords.filter(r => r.days_since_activity !== null && r.days_since_activity >= 60).length,
    learners_no_activity_90: learnerMonthRecords.filter(r => r.days_since_activity !== null && r.days_since_activity >= 90).length,
    never_active: learnerMonthRecords.filter(r => r.days_since_activity === null).length,
    alerts: [
      { type: 'below_target', count: learnerMonthRecords.filter(r => r.is_active && !r.is_compliant).length, threshold: minMonthlyHours },
      { type: 'inactive_30', count: learnerMonthRecords.filter(r => (r.days_since_activity ?? -1) >= 30).length },
      { type: 'inactive_90', count: learnerMonthRecords.filter(r => (r.days_since_activity ?? -1) >= 90).length },
    ].filter(a => a.count > 0),
    snapshot_month: snapshotMonth,
    config: { minimum_monthly_hours: minMonthlyHours, inactive_after_days: config?.inactive_after_days ?? 90, total_licenses: totalLicenses },
    generated_at: new Date().toISOString(),
  };

  const { error: metricsErr } = await supabase
    .from('coursera_computed_metrics')
    .upsert({
      month: firstDayOfMonth(snapshotMonth),
      metrics: metricsBlob,
      generated_by: requestedBy ?? null,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'month' });

  if (metricsErr) {
    return NextResponse.json({ error: `Failed to save metrics: ${metricsErr.message}` }, { status: 500 });
  }

  await supabase.from('coursera_import_log').insert({
    snapshot_month: snapshotMonth,
    action: 'recalculate',
    status: 'success',
    duration_ms: Date.now() - startTime,
    imported_by: requestedBy ?? null,
  });

  return NextResponse.json({
    success: true,
    month: firstDayOfMonth(snapshotMonth),
    durationMs: Date.now() - startTime,
  });
}
