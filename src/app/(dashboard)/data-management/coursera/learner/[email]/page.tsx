import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { getUserRole } from '@/lib/roles';
import Link from 'next/link';
import LearnerDetailClient from './_components/LearnerDetailClient';

interface PageProps {
  params: Promise<{ email: string }>;
}

export default async function LearnerDetailPage({ params }: PageProps) {
  const role = await getUserRole();
  if (role !== 'Super Admin' && role !== 'Admin') redirect('/');

  const { email: encodedEmail } = await params;
  const email = decodeURIComponent(encodedEmail).trim().toLowerCase();

  const supabase = await createClient();

  // 1. Monthly history
  const { data: monthlyHistory, error: histErr } = await supabase
    .from('coursera_learner_month')
    .select('*')
    .eq('email', email)
    .order('month', { ascending: true });

  if (histErr || !monthlyHistory || monthlyHistory.length === 0) {
    notFound();
  }

  const learnerName = monthlyHistory[monthlyHistory.length - 1]?.name ?? email;
  const latestRecord = monthlyHistory[monthlyHistory.length - 1];
  const latestYearMonth = latestRecord.month.substring(0, 7);

  // 2. Find the exact latest snapshot month for this user
  const { data: latestSnapRow } = await supabase
    .from('coursera_snapshots')
    .select('snapshot_month')
    .eq('email', email)
    .order('snapshot_month', { ascending: false })
    .limit(1)
    .single();

  const latestSnapMonth = latestSnapRow?.snapshot_month;

  // 3. Courses from the latest snapshot
  const { data: courses } = latestSnapMonth ? await supabase
    .from('coursera_snapshots')
    .select('course_id, course_name, course_type, university, overall_progress, cumulative_learning_hours, estimated_course_hours, completed, last_activity_time, completion_time, course_slug, certificate_url')
    .eq('email', email)
    .eq('snapshot_month', latestSnapMonth)
    .order('cumulative_learning_hours', { ascending: false }) : { data: [] };

  // Compute totals
  const lifetimeHours = latestRecord.cumulative_hours;
  const coursesEnrolled = latestRecord.courses_enrolled;
  const coursesCompleted = latestRecord.courses_completed;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-3 duration-500">

      {/* Back link */}
      <div>
        <Link href="/data-management/coursera/activity-logs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Activity Logs
        </Link>
      </div>

      {/* Learner header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 border-b border-border/60 pb-6">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
          {learnerName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{learnerName}</h1>
          <p className="text-muted-foreground text-sm">{email}</p>
        </div>
        <div className="md:ml-auto flex items-center gap-6 text-center">
          <div>
            <div className="text-xl font-bold">{lifetimeHours.toFixed(1)}h</div>
            <div className="text-xs text-muted-foreground">Lifetime Hours</div>
          </div>
          <div>
            <div className="text-xl font-bold">{coursesEnrolled}</div>
            <div className="text-xs text-muted-foreground">Enrolled</div>
          </div>
          <div>
            <div className="text-xl font-bold">{coursesCompleted}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
        </div>
      </div>

      <LearnerDetailClient monthlyHistory={monthlyHistory} courses={courses ?? []} />
    </div>
  );
}
