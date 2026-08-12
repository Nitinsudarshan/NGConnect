import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const firstDayOfMonth = (s: string) => s.substring(0, 7) + '-01';

export async function DELETE(request: NextRequest) {
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

  // STEP 1: Parse and validate body
  let body: { snapshotMonth?: string; requestedBy?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { snapshotMonth, requestedBy } = body;
  if (!snapshotMonth || !/^\d{4}-\d{2}-\d{2}$/.test(snapshotMonth)) {
    return NextResponse.json({ error: 'snapshotMonth must be in YYYY-MM-DD format' }, { status: 400 });
  }

  // STEP 2: Check that a successful import exists for this month
  const { count: importCount } = await supabase
    .from('coursera_import_log')
    .select('id', { count: 'exact', head: true })
    .eq('snapshot_month', snapshotMonth)
    .eq('action', 'import')
    .eq('status', 'success');

  if (!importCount || importCount === 0) {
    return NextResponse.json({ error: 'No successful import found for this month' }, { status: 404 });
  }

  // STEP 3: Block if a newer month exists
  const { data: newerMonth } = await supabase
    .from('coursera_snapshots')
    .select('snapshot_month')
    .gt('snapshot_month', snapshotMonth)
    .order('snapshot_month', { ascending: true })
    .limit(1)
    .single();

  if (newerMonth) {
    const newerLabel = newerMonth.snapshot_month.substring(0, 7);
    return NextResponse.json({
      error: `Cannot rollback ${snapshotMonth.substring(0, 7)} because ${newerLabel} exists. Rollback months in reverse chronological order (newest first).`
    }, { status: 409 });
  }

  // STEP 4: Delete in FK-safe order
  const monthFirst = firstDayOfMonth(snapshotMonth);

  const { error: e1 } = await supabase
    .from('coursera_computed_metrics')
    .delete()
    .eq('month', monthFirst);
  if (e1) return NextResponse.json({ error: `Failed to delete metrics: ${e1.message}` }, { status: 500 });

  const { error: e2 } = await supabase
    .from('coursera_learner_month')
    .delete()
    .eq('month', monthFirst);
  if (e2) return NextResponse.json({ error: `Failed to delete learner_month: ${e2.message}` }, { status: 500 });

  const { error: e3 } = await supabase
    .from('coursera_snapshots')
    .delete()
    .eq('snapshot_month', snapshotMonth);
  if (e3) return NextResponse.json({ error: `Failed to delete snapshots: ${e3.message}` }, { status: 500 });

  // STEP 5: Write rollback log
  await supabase.from('coursera_import_log').insert({
    snapshot_month: snapshotMonth,
    action: 'rollback',
    status: 'success',
    imported_by: requestedBy ?? null,
  });

  // STEP 6: Return
  const monthLabel = new Date(snapshotMonth + 'T12:00:00Z').toLocaleString('en-US', { month: 'long', year: 'numeric' });
  return NextResponse.json({ success: true, message: `Rollback complete for ${monthLabel}` });
}
