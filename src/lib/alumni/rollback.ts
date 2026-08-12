import { createAdminClient } from '@/lib/supabase/admin';

type RollbackTable = 'alumni_master' | 'alumni_profile';

interface AdminUser {
  id: string;
  name: string;
}

/**
 * Restores a single record to its state at a given point in time.
 *
 * Steps:
 *  1. Fetch audit_log entries for the record up to targetTimestamp
 *  2. Replay entries chronologically to derive the field state at that time
 *  3. Apply the restored state to the table
 *  4. Write RESTORE audit_log entries for each changed field
 *
 * @param tableName       Table to restore ('alumni_master' | 'alumni_profile')
 * @param recordId        PK value — email for alumni_master, UUID for alumni_profile
 * @param targetTimestamp ISO8601 string — restore to state at this point
 * @param adminUser       Super Admin performing the rollback
 */
export async function rollbackRecord(
  tableName: RollbackTable,
  recordId: string,
  targetTimestamp: string,
  adminUser: AdminUser
): Promise<{ success: boolean; fieldsRestored: number; error?: string }> {
  const supabaseAdmin = createAdminClient();

  try {
    // 1. Fetch audit trail up to targetTimestamp
    const { data: history, error: histErr } = await supabaseAdmin
      .from('audit_log')
      .select('field_name, old_value, new_value, changed_at')
      .eq('record_id', recordId)
      .eq('table_name', tableName)
      .lte('changed_at', targetTimestamp)
      .order('changed_at', { ascending: true });

    if (histErr) throw new Error(histErr.message);
    if (!history || history.length === 0) {
      return { success: false, fieldsRestored: 0, error: 'No audit history found for this record at the given timestamp.' };
    }

    // 2. Replay entries → derive field state at targetTimestamp
    const restoredState: Record<string, string | null> = {};
    for (const entry of history) {
      if (entry.field_name !== '*') {
        restoredState[entry.field_name] = entry.new_value;
      }
    }

    // Remove non-writable fields
    const { created_at, updated_at, email, id, ...writableState } = restoredState as any;
    if (Object.keys(writableState).length === 0) {
      return { success: false, fieldsRestored: 0, error: 'No restorable fields found in history.' };
    }

    // 3. Fetch current record for old_value in audit entries
    const pkColumn = tableName === 'alumni_master' ? 'email' : 'id';
    const { data: current } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .eq(pkColumn, recordId)
      .single();

    // 4. Apply restored state
    const { error: updateErr } = await supabaseAdmin
      .from(tableName)
      .update(writableState)
      .eq(pkColumn, recordId);

    if (updateErr) throw new Error(updateErr.message);

    // 5. Write RESTORE audit entries
    const restoreEntries = Object.entries(writableState).map(([field, value]) => ({
      table_name:          tableName,
      record_id:           recordId,
      field_name:          field,
      old_value:           current ? String((current as any)[field] ?? '') : null,
      new_value:           value as string | null,
      action_type:         'RESTORE',
      changed_by_user_id:  adminUser.id,
      changed_by_name:     adminUser.name,
      changed_by_role:     'Super Admin',
    }));

    await supabaseAdmin.from('audit_log').insert(restoreEntries);

    return { success: true, fieldsRestored: Object.keys(writableState).length };
  } catch (err: any) {
    return { success: false, fieldsRestored: 0, error: err.message };
  }
}

/**
 * Rolls back an entire import batch.
 *
 * - Records with action='created' → DELETE from alumni_master
 * - Records with action='updated' → restore via rollbackRecord()
 * - Sets import_batches.status = 'rolled_back'
 */
export async function rollbackImportBatch(
  importBatchId: string,
  adminUser: AdminUser
): Promise<{ success: boolean; deleted: number; restored: number; error?: string }> {
  const supabaseAdmin = createAdminClient();

  try {
    // Fetch the batch to get the upload timestamp (rollback target)
    const { data: batch, error: batchErr } = await supabaseAdmin
      .from('import_batches')
      .select('uploaded_at, status')
      .eq('id', importBatchId)
      .single();

    if (batchErr || !batch) throw new Error('Import batch not found');
    if (batch.status === 'rolled_back') {
      return { success: false, deleted: 0, restored: 0, error: 'Batch has already been rolled back.' };
    }

    const { data: batchRecords, error: recErr } = await supabaseAdmin
      .from('import_batch_records')
      .select('alumni_email, action')
      .eq('import_batch_id', importBatchId)
      .eq('status', 'success');

    if (recErr) throw new Error(recErr.message);

    let deleted = 0;
    let restored = 0;

    for (const record of batchRecords ?? []) {
      if (!record.alumni_email) continue;

      if (record.action === 'created') {
        // Check for any interaction activity
        const { data: interactions } = await supabaseAdmin
          .from('alumni_interactions')
          .select('id')
          .eq('alumni_email', record.alumni_email)
          .limit(1);

        // Check for any profile updates
        const { data: audits } = await supabaseAdmin
          .from('audit_log')
          .select('id')
          .eq('record_id', record.alumni_email)
          .gt('changed_at', batch.uploaded_at)
          .limit(1);

        if ((interactions && interactions.length > 0) || (audits && audits.length > 0)) {
          // Skip hard-delete if they have subsequent activity
          continue;
        }

        await supabaseAdmin
          .from('alumni_master')
          .delete()
          .eq('email', record.alumni_email);
        deleted++;
      } else if (record.action === 'updated') {
        // Restore to the state BEFORE this batch uploaded
        await rollbackRecord(
          'alumni_master',
          record.alumni_email,
          batch.uploaded_at,
          adminUser
        );
        restored++;
      }
    }

    await supabaseAdmin
      .from('import_batches')
      .update({ status: 'rolled_back' })
      .eq('id', importBatchId);

    return { success: true, deleted, restored };
  } catch (err: any) {
    return { success: false, deleted: 0, restored: 0, error: err.message };
  }
}
