import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const { email } = await params;
  const decodedEmail = decodeURIComponent(email).trim().toLowerCase();

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

  // 1. Monthly history for this learner
  const { data: monthlyHistory, error: historyErr } = await supabase
    .from('coursera_learner_month')
    .select('*')
    .eq('email', decodedEmail)
    .order('month', { ascending: true });

  if (historyErr) {
    return NextResponse.json({ error: historyErr.message }, { status: 500 });
  }

  // 2. Latest snapshot month from their history
  const latestRecord = monthlyHistory && monthlyHistory.length > 0
    ? monthlyHistory[monthlyHistory.length - 1]
    : null;

  let courses: unknown[] = [];
  if (latestRecord) {
    const { data: latestSnapRow } = await supabase
      .from('coursera_snapshots')
      .select('snapshot_month')
      .eq('email', decodedEmail)
      .order('snapshot_month', { ascending: false })
      .limit(1)
      .single();

    if (latestSnapRow) {
      const { data: snapshots } = await supabase
        .from('coursera_snapshots')
        .select('*')
        .eq('email', decodedEmail)
        .eq('snapshot_month', latestSnapRow.snapshot_month)
        .order('cumulative_learning_hours', { ascending: false });
      courses = snapshots || [];
    }
  }

  return NextResponse.json({ monthlyHistory: monthlyHistory ?? [], courses });
}
