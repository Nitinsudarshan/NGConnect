'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { CheckCircle2, XCircle } from 'lucide-react';

interface MonthRecord {
  month: string;
  monthly_hours: number;
  cumulative_hours: number;
  courses_enrolled: number;
  courses_completed: number;
  is_active: boolean;
  is_compliant: boolean;
  days_since_activity: number | null;
}

interface Course {
  course_id: string;
  course_name: string | null;
  course_type: string | null;
  university: string | null;
  overall_progress: number;
  cumulative_learning_hours: number;
  estimated_course_hours: number | null;
  completed: boolean;
  last_activity_time: string | null;
  completion_time: string | null;
  course_slug: string | null;
  certificate_url: string | null;
}

interface Props {
  monthlyHistory: MonthRecord[];
  courses: Course[];
}

function formatMonthShort(dateStr: string) {
  return new Date(dateStr + 'T12:00:00Z').toLocaleString('en-US', { month: 'short', year: '2-digit' });
}

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
          <span className="font-semibold">{p.value.toFixed(1)}h</span>
        </div>
      ))}
    </div>
  );
}

function formatMonth(dateStr: string) {
  return new Date(dateStr + 'T12:00:00Z').toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export default function LearnerDetailClient({ monthlyHistory, courses }: Props) {
  const firstMonth = monthlyHistory[0]?.month;

  const chartData = monthlyHistory
    .filter(r => r.month !== firstMonth)
    .map(r => ({
      label: formatMonthShort(r.month),
      monthly_hours: r.monthly_hours,
      is_compliant: r.is_compliant,
    }));

  return (
    <div className="space-y-6">
      {/* Monthly Hours Chart */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm p-5">
        <h2 className="text-sm font-semibold mb-4">Monthly Learning Hours</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Bar
              dataKey="monthly_hours"
              name="Hours"
              radius={[4, 4, 0, 0]}
              // Compliant bars are indigo, non-compliant are amber
              fill="#6366f1"
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Monthly table below chart */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Month</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Monthly h</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Cumulative h</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Active</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Compliant</th>
              </tr>
            </thead>
            <tbody>
              {[...monthlyHistory].reverse().map(r => (
                <tr key={r.month} className="border-b border-border/40 last:border-0">
                  <td className="py-2 pr-4">{r.month === firstMonth || formatMonthShort(r.month) === 'Mar 26' ? `Lifetime till ${formatMonthShort(r.month)}` : formatMonth(r.month)}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{r.monthly_hours.toFixed(1)}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">{r.cumulative_hours.toFixed(1)}</td>
                  <td className="py-2 px-3 text-center">
                    {r.is_active
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                      : <XCircle className="w-3.5 h-3.5 text-rose-400 mx-auto" />}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {r.is_compliant
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                      : <XCircle className="w-3.5 h-3.5 text-amber-400 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course List */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <h2 className="text-sm font-semibold">Course List (Latest Snapshot)</h2>
        </div>
        {courses.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No course data available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Course</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Progress</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Hours</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Est. Total</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Done</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Active</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Links</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.course_id} className="border-b border-border/40 last:border-0 hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.course_name ?? c.course_id}</div>
                      {c.university && <div className="text-xs text-muted-foreground">{c.university}</div>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.course_type ?? '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-border/60 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${Math.min(100, c.overall_progress)}%` }}
                          />
                        </div>
                        <span className="text-xs">{c.overall_progress.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.cumulative_learning_hours.toFixed(1)}h</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {c.estimated_course_hours != null ? `${c.estimated_course_hours.toFixed(0)}h` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.completed
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        : <XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" />}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {c.last_activity_time
                        ? new Date(c.last_activity_time).toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {c.course_slug && (
                          <a
                            href={`https://www.coursera.org/learn/${c.course_slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-500 hover:text-indigo-400 hover:underline whitespace-nowrap transition-colors"
                          >
                            View ↗
                          </a>
                        )}
                        {c.completed && c.certificate_url && (
                          <a
                            href={c.certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 hover:underline whitespace-nowrap transition-colors"
                          >
                            Certificate ↗
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
