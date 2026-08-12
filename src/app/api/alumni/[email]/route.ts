import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { mergeAlumniProfile } from '@/lib/alumni/merge-profile';
import { setAuditContext } from '@/lib/audit';
import { getUserRole } from '@/lib/roles';
import type { AlumniProfile } from '@/types/alumni';

/**
 * GET /api/alumni/[email]
 * Returns the merged profile (alumni_master + alumni_profile).
 *
 * PATCH /api/alumni/[email]
 * Updates the alumni_profile row for the given email.
 * Members can only update their own profile.
 * Super Admin can update any profile.
 */

type Params = { params: Promise<{ email: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { email } = await params;
  const decodedEmail = decodeURIComponent(email);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = await getUserRole();
  const isSuperAdmin = role === 'Super Admin' || role === 'Admin';
  const isMember = role === 'Member';

  // Members can only view their own profile
  if (!isSuperAdmin && !(isMember && user.email === decodedEmail)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [masterRes, profileRes] = await Promise.all([
    supabase.from('alumni_master').select('*').eq('email', decodedEmail).single(),
    supabase.from('alumni_profile').select('*').eq('alumni_email', decodedEmail).maybeSingle(),
  ]);

  if (masterRes.error || !masterRes.data) {
    return NextResponse.json({ error: 'Alumni not found' }, { status: 404 });
  }

  const merged = mergeAlumniProfile(masterRes.data, profileRes.data ?? null);
  return NextResponse.json(merged);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { email } = await params;
  const decodedEmail = decodeURIComponent(email);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = await getUserRole();
  const isSuperAdmin = role === 'Super Admin' || role === 'Admin';
  const isMember = role === 'Member';

  // Members can only edit their own profile
  if (!isSuperAdmin && !(isMember && user.email === decodedEmail)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as Partial<AlumniProfile>;
  const supabaseAdmin = createAdminClient();

  await setAuditContext(supabaseAdmin, user.user_metadata?.full_name ?? user.email ?? 'Unknown', role);

  // Check if profile row exists
  const { data: existing } = await supabaseAdmin
    .from('alumni_profile')
    .select('id')
    .eq('alumni_email', decodedEmail)
    .maybeSingle();

  const payload = { ...body, alumni_email: decodedEmail, updated_by: user.id };

  let error;
  if (existing) {
    ({ error } = await supabaseAdmin.from('alumni_profile').update(payload).eq('alumni_email', decodedEmail));
  } else {
    ({ error } = await supabaseAdmin.from('alumni_profile').insert(payload));
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
