import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/roles';
import { auth } from '@/lib/auth';
import ReportGeneratorClient from './_components/ReportGeneratorClient';
import { checkAccess } from '@/lib/permissions';

export default async function ReportsPage() {
  const { userId } = await auth();
  const hasAccess = await checkAccess(userId, 'reports', 'view');
  
  if (!hasAccess) {
    redirect('/');
  }

  const supabase = await createClient();

  // Fetch all available months and computed metrics
  const { data: metricsData } = await supabase
    .from('coursera_computed_metrics')
    .select('month, metrics, generated_at')
    .order('month', { ascending: true });

  const availableMonths = (metricsData ?? []).map(m => m.month);

  return (
    <ReportGeneratorClient
      metricsData={metricsData ?? []}
      availableMonths={availableMonths}
    />
  );
}
