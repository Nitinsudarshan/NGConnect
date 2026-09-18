import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rollbackImportBatch } from '@/lib/alumni/rollback';
import { getUserRole } from '@/lib/roles';
import { denyApiUnlessAccess } from '@/lib/api-guard';

/**
 * POST /api/alumni/admin/import-rollback
 *
 * Rolls back an entire import batch:
 *  - Records created by the batch → deleted from alumni_master
 *  - Records updated by the batch → restored to pre-import state
 *  - Sets import_batches.status = 'rolled_back'
 *
 * Body: { importBatchId: string }
 *
 * Super Admin only.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const denied = await denyApiUnlessAccess('data_management.rollback', 'edit');
  if (denied) return denied;

  const role = await getUserRole();

  const { importBatchId } = await req.json() as { importBatchId: string };
  if (!importBatchId) {
    return NextResponse.json({ error: 'importBatchId is required' }, { status: 400 });
  }

  const result = await rollbackImportBatch(importBatchId, {
    id:   user.id,
    name: user.user_metadata?.full_name ?? user.email ?? 'Unknown',
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success:  true,
    deleted:  result.deleted,
    restored: result.restored,
  });
}
