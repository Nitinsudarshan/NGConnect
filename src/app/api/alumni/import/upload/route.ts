import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/alumni/import/upload
 *
 * Accepts a multipart/form-data body with a `file` field (CSV or XLSX).
 * Creates an import_batches row and stores the file in Supabase Storage.
 * Returns { batchId } for the subsequent /process call.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // L1 Fix: Add role check
  if (user.app_metadata?.role !== 'Admin' && user.app_metadata?.role !== 'Super Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['csv', 'xlsx'].includes(ext ?? '')) {
    return NextResponse.json({ error: 'Only CSV and XLSX files are supported' }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  // Automatically ensure the 'imports' storage bucket exists
  try {
    const { data: buckets, error: listErr } = await supabaseAdmin.storage.listBuckets();
    if (!listErr && buckets) {
      const hasBucket = buckets.some((b) => b.id === 'imports');
      if (!hasBucket) {
        await supabaseAdmin.storage.createBucket('imports', {
          public: false,
          fileSizeLimit: 10485760, // 10MB
        });
      }
    }
  } catch (bucketErr) {
    console.error('[import/upload] Bucket verification failed:', bucketErr);
  }

  // Create the import_batches row
  const { data: batch, error: batchErr } = await supabaseAdmin
    .from('import_batches')
    .insert({
      file_name:        file.name,
      file_type:        ext as 'csv' | 'xlsx',
      file_size:        file.size,
      uploaded_by:      user.id,
      uploaded_by_name: user.user_metadata?.full_name ?? user.email ?? 'Unknown',
      status:           'processing',
    })
    .select('id')
    .single();

  if (batchErr || !batch) {
    return NextResponse.json({ error: 'Failed to create import batch' }, { status: 500 });
  }

  // Store the file in Supabase Storage (bucket: 'imports')
  const bytes = await file.arrayBuffer();
  const storagePath = `imports/${batch.id}/${file.name}`;
  const { error: storageErr } = await supabaseAdmin.storage
    .from('imports')
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });

  if (storageErr) {
    console.error('[import/upload] Storage upload failed:', storageErr.message);
    // Delete the orphaned batch row
    await supabaseAdmin.from('import_batches').delete().eq('id', batch.id);
    return NextResponse.json({ 
      error: `Failed to upload file to storage: ${storageErr.message}. Please verify your Supabase Storage configurations.` 
    }, { status: 500 });
  }

  return NextResponse.json({ batchId: batch.id, storagePath });
}
