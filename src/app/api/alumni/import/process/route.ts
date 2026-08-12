import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseImportFile } from '@/lib/alumni/import-parser';
import { validateImportRows } from '@/lib/alumni/import-validator';
import { processImportRows } from '@/lib/alumni/import-processor';
import { getUserRole } from '@/lib/roles';

/**
 * POST /api/alumni/import/process
 *
 * Reads the file from Supabase Storage for the given batchId,
 * parses, validates, and upserts all valid rows into alumni_master.
 *
 * Body: { batchId: string, storagePath: string }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await getUserRole();
  if (role !== 'Super Admin' && role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { batchId, storagePath } = await req.json() as { batchId: string; storagePath: string };
  if (!batchId || !storagePath) {
    return NextResponse.json({ error: 'batchId and storagePath are required' }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  // Download file from Storage
  const { data: fileData, error: dlErr } = await supabaseAdmin.storage
    .from('imports')
    .download(storagePath);

  if (dlErr || !fileData) {
    return NextResponse.json({ error: 'Failed to retrieve import file from storage' }, { status: 500 });
  }

  const ext = storagePath.split('.').pop()?.toLowerCase() as 'csv' | 'xlsx';
  const buffer = await fileData.arrayBuffer();

  const parsed    = await parseImportFile(buffer, ext);
  const validated = validateImportRows(parsed);

  const result = await processImportRows(validated, batchId, {
    id:   user.id,
    name: user.user_metadata?.full_name ?? user.email ?? 'Unknown',
    role,
  });

  return NextResponse.json(result);
}
