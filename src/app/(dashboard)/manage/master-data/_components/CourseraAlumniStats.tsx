'use client';

import { useEffect, useState } from 'react';
import LearnerDetailClient from '@/app/(dashboard)/data-management/coursera/learner/[email]/_components/LearnerDetailClient';
import { Loader2, BookOpen } from 'lucide-react';

export default function CourseraAlumniStats({ email }: { email: string }) {
  const [data, setData] = useState<{ monthlyHistory: any[]; courses: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/coursera/learner/${encodeURIComponent(email)}`);
        const json = await res.json();
        if (res.ok) {
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [email]);

  if (loading) {
    return (
      <div className="bg-muted/10 border border-border/40 rounded-md p-5 flex justify-center items-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.monthlyHistory.length === 0) {
    return (
      <div className="bg-muted/10 border border-border/40 rounded-md p-5 text-center">
        <p className="text-sm text-muted-foreground">No Coursera data available for this learner.</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/10 border border-border/40 rounded-md p-5 space-y-4 md:col-span-2">
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-2">
        <BookOpen className="w-4 h-4" /> Coursera Learning Stats
      </h4>
      <div>
        <LearnerDetailClient monthlyHistory={data.monthlyHistory} courses={data.courses} />
      </div>
    </div>
  );
}
