import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseImportFile } from '@/lib/alumni/import-parser';
import { validateImportRows } from '@/lib/alumni/import-validator';
import type { ImportPreviewResult } from '@/types/import';

/**
 * POST /api/alumni/import/preview
 *
 * Parses and validates a file WITHOUT writing to the DB.
 * Returns a preview of the first 50 rows plus validation errors.
 *
 * Body: multipart/form-data with `file` field.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() as 'csv' | 'xlsx';
  const buffer = await file.arrayBuffer();

  const parsed = await parseImportFile(buffer, ext);
  const validated = validateImportRows(parsed);

  const validRows   = validated.filter((r) => r._valid);
  const invalidRows = validated.filter((r) => !r._valid);

  const result: ImportPreviewResult = {
    total_rows:   validated.length,
    valid_rows:   validRows.length,
    invalid_rows: invalidRows.length,
    preview:      validated.slice(0, 50),
    errors:       invalidRows.map((r, i) => ({
      row:    i + 1,
      email:  r.email ?? '(missing)',
      errors: r._errors ?? [],
    })),
  };

  return NextResponse.json(result);
}
