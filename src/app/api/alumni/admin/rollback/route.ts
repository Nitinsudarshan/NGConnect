import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rollbackRecord } from '@/lib/alumni/rollback';
import { getUserRole } from '@/lib/roles';
import { denyApiUnlessAccess } from '@/lib/api-guard';

/**
 * POST /api/alumni/admin/rollback
 *
 * Restores a single alumni_master or alumni_profile record
 * to its state at a given point in time.
 *
 * Body: {
 *   recordId: string,          // email for alumni_master; UUID for alumni_profile
 *   tableName: "alumni_master" | "alumni_profile",
 *   targetTimestamp: string    // ISO8601
 * }
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

  const { recordId, tableName, targetTimestamp } = await req.json() as {
    recordId: string;
    tableName: 'alumni_master' | 'alumni_profile';
    targetTimestamp: string;
  };

  if (!recordId || !tableName || !targetTimestamp) {
    return NextResponse.json({ error: 'recordId, tableName, and targetTimestamp are required' }, { status: 400 });
  }

  const result = await rollbackRecord(tableName, recordId, targetTimestamp, {
    id:   user.id,
    name: user.user_metadata?.full_name ?? user.email ?? 'Unknown',
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, fieldsRestored: result.fieldsRestored });
}
