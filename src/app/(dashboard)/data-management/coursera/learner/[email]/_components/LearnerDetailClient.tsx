'use client';

import { useState } from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

const chartConfig = {
  monthly_hours: { label: "Hours", color: "var(--color-chart-primary)" },
};

function formatMonth(dateStr: string) {
  return new Date(dateStr + 'T12:00:00Z').toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export default function LearnerDetailClient({ monthlyHistory, courses }: Props) {
  const [isCourseListExpanded, setIsCourseListExpanded] = useState(false);
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
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm p-5 shadow-2xs">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" /> Monthly Learning Hours & Compliance
        </h2>
        <ChartContainer config={chartConfig} className="w-full h-[220px]">
          <BarChart data={chartData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.is_compliant ? "var(--color-chart-success)" : "var(--color-chart-warning)"} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

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

      {/* Course List (Collapsible) */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Course List (Latest Snapshot)</h2>
            <Badge variant="outline" className="text-[10px] font-mono">
              {courses.length} Courses
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCourseListExpanded(!isCourseListExpanded)}
            className="h-8 text-xs font-semibold gap-1 text-primary hover:bg-primary/10 rounded-lg px-2.5"
          >
            {isCourseListExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" /> Collapse Course List
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" /> Expand Course List
              </>
            )}
          </Button>
        </div>

        {isCourseListExpanded && (
          <div>
            {courses.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No course data available.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Course</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Type</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Progress</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Hours</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs">Done</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Last Active</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Links</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(c => (
                      <tr key={c.course_id} className="border-b border-border/40 last:border-0 hover:bg-accent/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-xs text-foreground">{c.course_name ?? c.course_id}</div>
                          {c.university && <div className="text-[10px] text-muted-foreground">{c.university}</div>}
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
                        <td className="px-4 py-3 text-right tabular-nums text-xs">{c.cumulative_learning_hours.toFixed(1)}h</td>
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
        )}
      </div>
    </div>
  );
}
