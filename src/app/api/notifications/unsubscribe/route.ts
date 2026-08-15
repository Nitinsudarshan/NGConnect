import { NextRequest, NextResponse } from 'next/server';
import { verifyUnsubscribeToken } from '@/lib/notifications/tokens';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  if (!email || !token) {
    return new NextResponse('Invalid request: Email and token are required.', { status: 400 });
  }

  const isValid = verifyUnsubscribeToken(email, token);
  if (!isValid) {
    return new NextResponse('Invalid or expired unsubscribe token.', { status: 403 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const supabase = createAdminClient();

  try {
    // Check if suppression row already exists to preserve channel = 'all'
    const { data: existing } = await supabase
      .from('alumni_contact_suppression')
      .select('channel, reason')
      .eq('alumni_email', normalizedEmail)
      .maybeSingle();

    if (existing) {
      // If existing row has channel === 'all', do NOT downgrade to 'email'
      const targetChannel = existing.channel === 'all' ? 'all' : 'email';
      await supabase
        .from('alumni_contact_suppression')
        .update({
          channel: targetChannel,
          reason: existing.reason || 'unsubscribed',
          suppressed_since: new Date().toISOString(),
        })
        .eq('alumni_email', normalizedEmail);
    } else {
      // Insert new suppression record for email channel
      await supabase.from('alumni_contact_suppression').insert({
        alumni_email: normalizedEmail,
        channel: 'email',
        reason: 'unsubscribed',
        suppressed_since: new Date().toISOString(),
      });
    }

    const htmlResponse = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed — NGConnect</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f9fafb; color: #111827; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 440px; width: 100%; padding: 32px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .icon { width: 48px; height: 48px; background: #ecfdf5; color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; font-size: 24px; }
          h1 { font-size: 20px; font-weight: 600; margin: 0 0 8px 0; }
          p { color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0; }
          .email { font-weight: 600; color: #111827; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✓</div>
          <h1>You have been unsubscribed</h1>
          <p>We have updated your communication preferences. Email notifications will no longer be sent to <span class="email">${normalizedEmail}</span>.</p>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(htmlResponse, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err: any) {
    console.error('[Unsubscribe API] Error:', err);
    return new NextResponse('Internal server error occurred while processing unsubscribe request.', { status: 500 });
  }
}
