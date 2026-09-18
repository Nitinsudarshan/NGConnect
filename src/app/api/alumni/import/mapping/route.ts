import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserRole } from '@/lib/roles';
import fs from 'fs/promises';
import path from 'path';
import { denyApiUnlessAccess } from '@/lib/api-guard';

const MAPPING_FILE_PATH = path.join(process.cwd(), 'src', 'lib', 'alumni', 'ghar-column-map.json');

/**
 * GET /api/alumni/import/mapping
 * Returns the current GHAR-to-DB column mapping configuration.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rawData = await fs.readFile(MAPPING_FILE_PATH, 'utf-8');
    const mapping = JSON.parse(rawData);
    return NextResponse.json(mapping);
  } catch (error: any) {
    console.error('[import/mapping] GET error:', error);
    return NextResponse.json({ error: 'Failed to read mapping configuration' }, { status: 500 });
  }
}

/**
 * POST /api/alumni/import/mapping
 * Updates the mapping configuration. Super Admin and Admin only.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const denied = await denyApiUnlessAccess('data_management.import', 'edit');
  if (denied) return denied;

  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid mapping configuration body' }, { status: 400 });
    }

    // Preserve the comment or formatting
    const updatedMap = {
      _comment: "Maps alumni_master DB column names to GHAR CSV/XLSX export column headers. Edit from the Data Management UI in Settings.",
      ...body
    };
    // Remove _comment if it was passed inside body to prevent duplication
    delete (updatedMap as any)._comment;
    updatedMap._comment = "Maps alumni_master DB column names to GHAR CSV/XLSX export column headers. Edit from the Data Management UI in Settings.";

    await fs.writeFile(MAPPING_FILE_PATH, JSON.stringify(updatedMap, null, 2), 'utf-8');
    return NextResponse.json({ success: true, mapping: updatedMap });
  } catch (error: any) {
    console.error('[import/mapping] POST error:', error);
    return NextResponse.json({ error: 'Failed to update mapping configuration' }, { status: 500 });
  }
}
