import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { denyApiUnlessAccess } from '@/lib/api-guard';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/coursera/prune-inactive/removals
 *
 *   ?runId=<uuid>             one removal run
 *   ?from=YYYY-MM-DD&to=...   all removals in a date range
 *   ?format=csv               download instead of JSON
 *   ?includeFailed=true       include failed attempts (default: removed only)
 */
export async function GET(request: NextRequest) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const denied = await denyApiUnlessAccess('data_management.coursera_enroll', 'view');
  if (denied) return denied;

  const params = request.nextUrl.searchParams;
  const runId = params.get('runId');
  const from = params.get('from');
  const to = params.get('to');
  const format = params.get('format');
  const includeFailed = params.get('includeFailed') === 'true';

  if (runId && !UUID_REGEX.test(runId)) {
    return NextResponse.json({ error: 'Invalid runId' }, { status: 400 });
  }
  if ((from && !DATE_REGEX.test(from)) || (to && !DATE_REGEX.test(to))) {
    return NextResponse.json({ error: 'from/to must be YYYY-MM-DD' }, { status: 400 });
  }

  let query = createAdminClient()
    .from('coursera_removal_log')
    .select(
      'run_id, removed_at, mode, threshold, email, full_name, last_seen_at, last_seen_source, days_inactive, courses_count, soft_delete, success, message'
    )
    .order('removed_at', { ascending: false })
    .limit(5000);

  if (runId) query = query.eq('run_id', runId);
  if (from) query = query.gte('removed_at', `${from}T00:00:00Z`);
  if (to) query = query.lte('removed_at', `${to}T23:59:59Z`);
  if (!includeFailed) query = query.eq('success', true);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (format !== 'csv') {
    return NextResponse.json({ count: data.length, removals: data });
  }

  const headers = [
    'Removed At', 'Email', 'Name', 'Last Seen', 'Last Seen Source',
    'Days Inactive', 'Courses', 'Mode', 'Threshold', 'Soft Delete', 'Success', 'Message', 'Run ID',
  ];
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    // Quote, and neutralise spreadsheet formula injection
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const lines = [
    headers.join(','),
    ...data.map(r =>
      [
        r.removed_at, r.email, r.full_name, r.last_seen_at, r.last_seen_source,
        r.days_inactive, r.courses_count, r.mode, r.threshold, r.soft_delete,
        r.success, r.message, r.run_id,
      ].map(esc).join(',')
    ),
  ];

  const filename = runId
    ? `coursera-removals-${runId.slice(0, 8)}.csv`
    : `coursera-removals-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
