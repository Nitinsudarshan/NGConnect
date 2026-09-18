import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { denyApiUnlessAccess } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');

  if (!month || !/^\d{4}-\d{2}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'month param required in YYYY-MM-DD format' }, { status: 400 });
  }

  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const denied = await denyApiUnlessAccess('data_management.coursera');
  if (denied) return denied;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('coursera_computed_metrics')
    .select('month, metrics, generated_at, generated_by')
    .eq('month', month)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'No metrics found for this month' }, { status: 404 });
  }

  return NextResponse.json(data);
}
