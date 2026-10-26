import { NextRequest, NextResponse } from 'next/server';

import { requirePruneAccess } from '@/lib/coursera-prune-auth';
import { listRemovals } from '@/lib/coursera-prune-store';

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
  const access = await requirePruneAccess('view');
  if (access.denied) return access.denied;

  const params = request.nextUrl.searchParams;
  const runId = params.get('runId');
  const from = params.get('from');
  const to = params.get('to');
  const format = params.get('format');
  const includeFailed = params.get('includeFailed') === 'true';

  if (runId && !UUID_REGEX.test(runId)) {
    return NextResponse.json({ success: false, error: 'Invalid runId' }, { status: 400 });
  }
  if ((from && !DATE_REGEX.test(from)) || (to && !DATE_REGEX.test(to))) {
    return NextResponse.json({ success: false, error: 'from/to must be YYYY-MM-DD' }, { status: 400 });
  }

  let data;
  try {
    data = await listRemovals({ runId, from, to, includeFailed });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not load the removal log.' }, { status: 500 });
  }

  if (format !== 'csv') {
    return NextResponse.json({ success: true, data: { count: data.length, removals: data } });
  }

  const headers = [
    'Removed At', 'Email', 'External ID', 'Name', 'Last Seen', 'Last Seen Source',
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
        r.removed_at, r.email, r.external_id, r.full_name, r.last_seen_at, r.last_seen_source,
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
