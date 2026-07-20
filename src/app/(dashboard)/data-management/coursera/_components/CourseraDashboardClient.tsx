'use client';

import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import {
  Users, Activity, Clock, BookOpen, CheckSquare, TrendingUp, TrendingDown, Award,
  AlertTriangle, UserX, Zap, Shield,
} from 'lucide-react';
import Link from 'next/link';

// ── Types ────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Metrics = Record<string, any>;
interface TrendPoint {
  month: string;
  active_learners: number;
  monthly_hours: number;
  monthly_completions: number;
  license_utilization_pct: number | null;
}

interface Props {
  metrics: Metrics;
  trend: TrendPoint[];
  selectedMonth: string;
  availableMonths: string[];
  availableMonthLabels?: Record<string, string>;
  basePath?: string;
  queryParam?: string;
  generatedAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatMonth(dateStr: string) {
  return new Date(dateStr + 'T12:00:00Z').toLocaleString('en-US', { month: 'long', year: 'numeric' });
}
function formatMonthShort(dateStr: string) {
  return new Date(dateStr + 'T12:00:00Z').toLocaleString('en-US', { month: 'short', year: '2-digit' });
}
function fmt(n: number, decimals = 0) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function delta(n: number) {
  const abs = Math.abs(n).toLocaleString();
  if (n > 0) return <span className="text-xs font-semibold text-emerald-500">↑{abs}</span>;
  if (n < 0) return <span className="text-xs font-semibold text-rose-500">↓{abs}</span>;
  return <span className="text-xs text-muted-foreground">—</span>;
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, accent, deltaVal,
}: {
  label: string; value: string; sub?: string; icon: React.ElementType;
  accent: string; deltaVal?: number;
}) {
  return (
    <div className={`rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
      {deltaVal !== undefined && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          MoM: {delta(deltaVal)}
        </div>
      )}
    </div>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <div className="font-medium mb-1">{label}</div>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold">{typeof p.value === 'number' ? fmt(p.value, 1) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Bar colours for distribution charts ───────────────────────────────────────
const DIST_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

// ── Main Component ────────────────────────────────────────────────────────────
export default function CourseraDashboardClient({ metrics, trend, selectedMonth, availableMonths, availableMonthLabels, basePath, queryParam, generatedAt }: Props) {
  const router = useRouter();

  const m = metrics;

  const firstImportMonth = availableMonths[availableMonths.length - 1];
  const isSecondMonth = availableMonths.length >= 2 && selectedMonth === availableMonths[availableMonths.length - 2];

  const isFirstImport = (monthStr: string) => {
    return monthStr === firstImportMonth || formatMonthShort(monthStr) === 'Mar 26';
  };

  const getLabel = (monthStr: string) => {
    if (availableMonthLabels && availableMonthLabels[monthStr]) return availableMonthLabels[monthStr];
    return isFirstImport(monthStr) ? `Lifetime till ${formatMonthShort(monthStr)}` : formatMonth(monthStr);
  };
  const getShortLabel = (monthStr: string) => {
    if (availableMonthLabels && availableMonthLabels[monthStr]) return availableMonthLabels[monthStr];
    return isFirstImport(monthStr) ? `Lifetime till ${formatMonthShort(monthStr)}` : formatMonthShort(monthStr);
  };

  // Distribution chart data
  const hoursDistData = Object.entries(m.hours_distribution ?? {}).map(([k, v]) => ({ name: k, value: v as number }));
  const progressDistData = Object.entries(m.progress_distribution ?? {}).map(([k, v]) => ({ name: k, value: v as number }));

  const trendWithLabel = trend
    .filter(t => t.month !== firstImportMonth)
    .map(t => ({ ...t, label: getShortLabel(t.month) }));

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-3 duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coursera Analytics</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {getLabel(selectedMonth)} · Generated {new Date(generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/data-management/coursera/activity-logs" className="text-sm px-4 py-2 rounded-lg border border-border/80 hover:bg-accent transition-colors">
            Activity Logs
          </Link>
          <Link href="/data-management/import-coursera" className="text-sm px-4 py-2 rounded-lg border border-border/80 hover:bg-accent transition-colors">
            Import Reports
          </Link>
        </div>
      </div>

      {/* Month Tabs */}
      {availableMonths.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {availableMonths.map(month => (
            <button
              key={month}
              onClick={() => {
                const path = basePath ?? '/data-management/coursera';
                const param = queryParam ?? 'month';
                router.push(`${path}?${param}=${month}`);
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                month === selectedMonth
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border/80 hover:bg-accent'
              }`}
            >
              {getShortLabel(month)}
            </button>
          ))}
        </div>
      )}

      {/* Alerts */}
      {(m.alerts ?? []).length > 0 && (
        <div className="space-y-2">
          {m.alerts.map((alert: { type: string; count: number; threshold?: number }, i: number) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {alert.type === 'below_target' && `${alert.count.toLocaleString()} learners active but below ${alert.threshold}h target this month`}
              {alert.type === 'inactive_30' && `${alert.count.toLocaleString()} learners have had no activity in 30+ days`}
              {alert.type === 'inactive_90' && `${alert.count.toLocaleString()} learners have had no activity in 90+ days`}
            </div>
          ))}
        </div>
      )}

      {/* Row 1: Learner KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Learners" value={fmt(m.total_learners)} icon={Users}
          accent="bg-indigo-500/10 text-indigo-500" />
        <KpiCard label="Active This Month" value={fmt(m.active_learners)} icon={Activity}
          accent="bg-emerald-500/10 text-emerald-500" deltaVal={isSecondMonth ? undefined : m.mom_active_learners} />
        <KpiCard label="Monthly Hours" value={`${fmt(m.monthly_hours, 1)}h`} icon={Clock}
          accent="bg-blue-500/10 text-blue-500"
          sub={`${fmt(m.avg_hours_per_active_learner, 1)}h avg per active`}
          deltaVal={isSecondMonth ? undefined : m.mom_monthly_hours} />
        <KpiCard label="Lifetime Hours" value={`${fmt(m.total_lifetime_hours, 0)}h`} icon={TrendingUp}
          accent="bg-violet-500/10 text-violet-500" />
      </div>

      {/* Row 2: Compliance + License KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Compliant Learners" value={fmt(m.compliant_learners)}
          sub={`≥${m.config?.minimum_monthly_hours}h/mo`} icon={Shield}
          accent="bg-teal-500/10 text-teal-500" />
        <KpiCard label="Inactive This Month" value={fmt(m.inactive_learners)} icon={UserX}
          accent="bg-rose-500/10 text-rose-500" />
        <KpiCard label="Monthly Completions" value={fmt(m.monthly_completions)} icon={CheckSquare}
          accent="bg-amber-500/10 text-amber-500" deltaVal={isSecondMonth ? undefined : m.mom_completions} />
        <KpiCard
          label="License Usage"
          value={m.license_utilization_pct !== null ? `${fmt(m.license_utilization_pct, 1)}%` : '—'}
          sub={m.total_licenses > 0 ? `${fmt(m.licenses_active)} / ${fmt(m.total_licenses)} licenses` : 'No license count set'}
          icon={Zap}
          accent="bg-cyan-500/10 text-cyan-500"
        />
      </div>

      {/* Row 3: Trend Charts */}
      {trendWithLabel.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm p-5">
            <h3 className="text-sm font-semibold mb-4">Monthly Learning Hours</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendWithLabel} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="monthly_hours" name="Hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm p-5">
            <h3 className="text-sm font-semibold mb-4">Active Learners</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendWithLabel}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="active_learners" name="Active" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Row 4: Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm p-5">
          <h3 className="text-sm font-semibold mb-4">Hours Distribution This Month</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hoursDistData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Learners" radius={[4, 4, 0, 0]}>
                {hoursDistData.map((_, i) => <Cell key={i} fill={DIST_COLORS[i % DIST_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm p-5">
          <h3 className="text-sm font-semibold mb-4">Progress Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={progressDistData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Learners" radius={[4, 4, 0, 0]}>
                {progressDistData.map((_, i) => <Cell key={i} fill={DIST_COLORS[i % DIST_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 5: Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Learners */}
        <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold">Top Learners This Month</h3>
          </div>
          <div className="divide-y divide-border/40">
            {(m.top_learners_by_hours ?? []).slice(0, 10).map((l: { email: string; name: string; monthly_hours: number; cumulative_hours: number }, i: number) => (
              <Link
                key={l.email}
                href={`/data-management/coursera/learner/${encodeURIComponent(l.email)}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-accent/30 transition-colors"
              >
                <span className="text-xs font-bold text-muted-foreground w-5 shrink-0 tabular-nums">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{l.name || l.email}</div>
                  <div className="text-xs text-muted-foreground">{fmt(l.cumulative_hours, 1)}h lifetime</div>
                </div>
                <span className="text-sm font-bold text-indigo-500 tabular-nums">{fmt(l.monthly_hours, 1)}h</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Needs Intervention */}
        <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-semibold">Needs Intervention</h3>
          </div>
          <div className="divide-y divide-border/40">
            {(m.learners_below_target ?? []).slice(0, 10).length > 0 ? (
              (m.learners_below_target ?? []).slice(0, 10).map((l: { email: string; name: string; monthly_hours: number }) => (
                <Link
                  key={l.email}
                  href={`/data-management/coursera/learner/${encodeURIComponent(l.email)}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{l.name || l.email}</div>
                    <div className="text-xs text-muted-foreground">{fmt(l.monthly_hours, 1)}h this month</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium">
                    Below target
                  </span>
                </Link>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                🎉 All active learners are on target this month
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
