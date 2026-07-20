import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/roles';
import ReportGeneratorClient from './_components/ReportGeneratorClient';

export default async function ReportsPage() {
  const role = await getUserRole();
  if (!role || (role !== 'Super Admin' && role !== 'Admin' && role !== 'Manager' && role !== 'Analyst' && role !== 'Program' && role !== 'Operations')) {
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
