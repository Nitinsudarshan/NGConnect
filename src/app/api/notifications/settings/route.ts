import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const adminSupabase = createAdminClient();
  const { data: settings, error } = await adminSupabase
    .from('notification_provider_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error && error.code === 'PGRST116') {
    // If not found, insert default
    const { data: defaultSettings } = await adminSupabase
      .from('notification_provider_settings')
      .insert({ id: 1, active_provider: 'dry_run', from_name: 'NGConnect', sandbox_mode: true })
      .select('*')
      .single();
    return NextResponse.json(defaultSettings);
  }

  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isSuperUser = user?.email && ['nitin@navgurukul.org', 'nitinsudarshan@gmail.com'].includes(user.email.toLowerCase());
  if (user?.user_metadata?.role !== 'Admin' && user?.user_metadata?.role !== 'Super Admin' && !isSuperUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from('notification_provider_settings')
      .upsert(
        {
          id: 1,
          active_provider: body.active_provider,
          from_name: body.from_name,
          from_email: body.from_email || null,
          reply_to: body.reply_to || null,
          sandbox_mode: body.sandbox_mode ?? true,
          sandbox_redirect_email: body.sandbox_redirect_email || null,
          kill_switch: body.kill_switch ?? false,
          ses_region: body.ses_region || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (error) {
      console.error('[Notification Settings API] Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update settings' }, { status: 500 });
  }
}
