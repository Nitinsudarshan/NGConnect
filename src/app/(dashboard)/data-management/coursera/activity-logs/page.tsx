import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/roles';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SearchParams {
  month?: string;
  search?: string;
  status?: string;
  page?: string;
}

const PAGE_SIZE = 50;

function formatMonth(dateStr: string, firstMonth?: string | null) {
  const short = new Date(dateStr + 'T12:00:00Z').toLocaleString('en-US', { month: 'short', year: '2-digit' });
  if ((firstMonth && dateStr === firstMonth) || short === 'Mar 26') {
    return `Lifetime till ${short}`;
  }
  return new Date(dateStr + 'T12:00:00Z').toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export default async function ActivityLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const role = await getUserRole();
  if (role !== 'Super Admin' && role !== 'Admin') redirect('/');

  const { month: monthParam, search = '', status = 'all', page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  // Get available months for the selector
  const { data: monthsList } = await supabase
    .from('coursera_computed_metrics')
    .select('month')
    .order('month', { ascending: false });

  const firstImportMonth = monthsList?.[monthsList.length - 1]?.month;
  const selectedMonth = monthParam ?? monthsList?.[0]?.month ?? null;

  // Build query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('coursera_learner_month')
    .select('*', { count: 'exact' });

  if (selectedMonth) {
    query = query.eq('month', selectedMonth);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // Status filter mapping
  switch (status) {
    case 'active':         query = query.eq('is_active', true); break;
    case 'inactive':       query = query.eq('is_active', false); break;
    case 'below_target':   query = query.eq('is_active', true).eq('is_compliant', false); break;
    case 'no_activity_30': query = query.gte('days_since_activity', 30); break;
    case 'no_activity_90': query = query.gte('days_since_activity', 90); break;
  }

  query = query
    .order('monthly_hours', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const { data: learners, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // Build URL with updated params
  function buildUrl(overrides: Partial<SearchParams>) {
    const params = new URLSearchParams();
    const merged = { month: selectedMonth ?? '', search, status, page: String(page), ...overrides };
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
    return `/data-management/coursera/activity-logs?${params.toString()}`;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-3 duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/data-management/coursera" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {selectedMonth ? formatMonth(selectedMonth, firstImportMonth) : 'All months'} · {(count ?? 0).toLocaleString()} learners
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Month — uses form submit to avoid onChange in Server Component */}
        <form method="get" action="/data-management/coursera/activity-logs" className="flex gap-2 items-center">
          {search && <input type="hidden" name="search" value={search} />}
          {status !== 'all' && <input type="hidden" name="status" value={status} />}
          <select
            name="month"
            defaultValue={selectedMonth ?? ''}
            className="bg-background border border-border/80 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          >
            {(monthsList ?? []).map(m => (
              <option key={m.month} value={m.month}>{formatMonth(m.month, firstImportMonth)}</option>
            ))}
          </select>
          <button type="submit" className="px-3 py-2 rounded-lg border border-border/80 text-sm hover:bg-accent transition-colors">Filter</button>
        </form>

        {/* Search */}
        <form action={buildUrl({ page: '1' }).split('?')[0]} method="get" className="flex gap-2">
          {selectedMonth && <input type="hidden" name="month" value={selectedMonth} />}
          {status !== 'all' && <input type="hidden" name="status" value={status} />}
          <input
            name="search"
            defaultValue={search}
            placeholder="Search name or email…"
            className="bg-background border border-border/80 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition w-56"
          />
          <button type="submit" className="px-3 py-2 rounded-lg border border-border/80 text-sm hover:bg-accent transition-colors">Search</button>
          {search && (
            <Link href={buildUrl({ search: '', page: '1' })} className="px-3 py-2 rounded-lg border border-border/80 text-sm hover:bg-accent transition-colors text-muted-foreground">
              Clear
            </Link>
          )}
        </form>

        {/* Status filter */}
        <div className="flex gap-1 flex-wrap">
          {[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'below_target', label: 'Below Target' },
            { value: 'no_activity_30', label: 'No Activity 30d' },
            { value: 'no_activity_90', label: 'No Activity 90d' },
          ].map(opt => (
            <Link
              key={opt.value}
              href={buildUrl({ status: opt.value, page: '1' })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                status === opt.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border/80 hover:bg-accent'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm overflow-hidden">
        {!selectedMonth ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No data imported yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Monthly h</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Cumulative h</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Courses</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Completed</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Active</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Compliant</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Days Inactive</th>
                </tr>
              </thead>
              <tbody>
                {(learners ?? []).length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No learners match your filters.</td></tr>
                ) : (
                  (learners ?? []).map((l: {
                    email: string; name: string | null;
                    monthly_hours: number; cumulative_hours: number;
                    courses_enrolled: number; courses_completed: number;
                    is_active: boolean; is_compliant: boolean; days_since_activity: number | null;
                  }) => (
                    <tr key={l.email} className="border-b border-border/40 last:border-0 hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/data-management/coursera/learner/${encodeURIComponent(l.email)}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {l.name ?? '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{l.email}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">{l.monthly_hours.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{l.cumulative_hours.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{l.courses_enrolled}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{l.courses_completed}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${l.is_active ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${l.is_compliant ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {l.days_since_activity !== null ? l.days_since_activity : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {(count ?? 0).toLocaleString()} total
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/80 text-sm hover:bg-accent transition-colors">
                <ChevronLeft className="w-4 h-4" /> Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildUrl({ page: String(page + 1) })} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/80 text-sm hover:bg-accent transition-colors">
                Next <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
