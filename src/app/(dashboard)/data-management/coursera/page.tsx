import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/roles';
import CourseraDashboardClient from './_components/CourseraDashboardClient';
import { denyUnlessAccess } from '@/lib/guard';

interface SearchParams { month?: string }

export default async function CourseraDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const denied = await denyUnlessAccess('data_management.coursera', 'view', { backHref: '/data-management', backLabel: 'Back to Data Management' });
  if (denied) return denied;

  const { month: monthParam } = await searchParams;

  const supabase = await createClient();

  // 1. Get all available months for the tab selector
  const { data: monthsList } = await supabase
    .from('coursera_computed_metrics')
    .select('month')
    .order('month', { ascending: false });

  const targetMonth = monthParam ?? monthsList?.[0]?.month ?? null;

  // 2. Fetch metrics blob for selected month
  const { data: metricsRow } = targetMonth
    ? await supabase
        .from('coursera_computed_metrics')
        .select('month, metrics, generated_at, generated_by')
        .eq('month', targetMonth)
        .single()
    : { data: null };

  // 3. Fetch last 6 months for trend charts (full metrics column, destructured in client)
  const { data: trendRaw } = await supabase
    .from('coursera_computed_metrics')
    .select('month, metrics')
    .order('month', { ascending: false })
    .limit(6);

  const trend = (trendRaw ?? []).reverse().map(r => ({
    month: r.month,
    active_learners: r.metrics?.active_learners ?? 0,
    monthly_hours: r.metrics?.monthly_hours ?? 0,
    monthly_completions: r.metrics?.monthly_completions ?? 0,
    license_utilization_pct: r.metrics?.license_utilization_pct ?? null,
  }));

  // Empty state — no imports yet
  if (!metricsRow) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="p-4 rounded-2xl bg-muted/50 border border-border/60">
          <svg className="w-12 h-12 mx-auto text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">No Coursera data imported yet</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm">
            Upload your first monthly Coursera report to start seeing analytics, learner activity, and compliance metrics.
          </p>
          <Link
            href="/data-management/import-coursera"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition"
          >
            Import your first report →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CourseraDashboardClient
      metrics={metricsRow.metrics}
      trend={trend}
      selectedMonth={targetMonth!}
      availableMonths={monthsList?.map(m => m.month) ?? []}
      generatedAt={metricsRow.generated_at}
    />
  );
}
