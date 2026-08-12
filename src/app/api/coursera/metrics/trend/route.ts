import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const months = Math.min(parseInt(searchParams.get('months') ?? '6', 10), 24);

  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = user.app_metadata?.role;
  if (role !== 'Admin' && role !== 'Super Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('coursera_computed_metrics')
    .select('month, metrics')
    .order('month', { ascending: false })
    .limit(months);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Destructure JSONB in JS — PostgREST arrow syntax does not work in Supabase JS client
  const trend = (data ?? []).reverse().map(r => ({
    month: r.month,
    active_learners: r.metrics?.active_learners ?? 0,
    monthly_hours: r.metrics?.monthly_hours ?? 0,
    monthly_completions: r.metrics?.monthly_completions ?? 0,
    license_utilization_pct: r.metrics?.license_utilization_pct ?? null,
  }));

  return NextResponse.json(trend);
}
