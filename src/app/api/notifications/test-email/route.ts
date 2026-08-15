import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAccess } from '@/lib/permissions';
import { sendEmailViaDispatcher } from '@/lib/email/dispatcher';
import { EmailProviderType } from '@/types/email-notifications';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const canManage = await checkAccess(user?.id ?? null, 'manage.users', 'edit');
  // Allow super admin / admin
  const isSuperUser = user?.email && ['nitin@navgurukul.org', 'nitinsudarshan@gmail.com'].includes(user.email.toLowerCase());
  if (!canManage && !isSuperUser) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { to, subject, html, provider } = body;

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, html' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const { data: settings } = await adminSupabase
      .from('notification_provider_settings')
      .select('*')
      .eq('id', 1)
      .single();

    const fromName = settings?.from_name || 'NGConnect';
    const fromEmail = settings?.from_email || 'notifications@navgurukul.org';
    const fromHeader = `"${fromName}" <${fromEmail}>`;

    const activeProvider = (provider as EmailProviderType) || settings?.active_provider || 'dry_run';

    const result = await sendEmailViaDispatcher(
      {
        to,
        from: fromHeader,
        replyTo: settings?.reply_to || undefined,
        subject,
        html,
      },
      activeProvider
    );

    // Record test send in durable log
    await adminSupabase.from('notification_sends').insert({
      recipient_email: to,
      subject_rendered: subject,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error || null,
      provider: result.providerUsed,
      provider_message_id: result.providerMessageId || null,
    });

    return NextResponse.json({
      success: result.success,
      providerUsed: result.providerUsed,
      providerMessageId: result.providerMessageId,
      previewUrl: result.previewUrl,
      error: result.error,
    });
  } catch (error: any) {
    console.error('[Test Email API] Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to send test email' }, { status: 500 });
  }
}
