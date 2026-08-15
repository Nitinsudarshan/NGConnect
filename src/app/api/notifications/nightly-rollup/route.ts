import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  return handleRollup(request);
}

export async function POST(request: NextRequest) {
  return handleRollup(request);
}

async function handleRollup(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secretParam = new URL(request.url).searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET || 'ngconnect-cron-secret-dev';

  const isAuthorized =
    authHeader === `Bearer ${cronSecret}` ||
    secretParam === cronSecret ||
    process.env.NODE_ENV === 'development';

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Get all unique alumni emails
    const { data: alumniList } = await supabase
      .from('alumni_master')
      .select('email');

    if (!alumniList || alumniList.length === 0) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    let updatedCount = 0;

    for (const item of alumniList) {
      const email = item.email;
      if (!email) continue;

      // 1. Email channel activity
      const { data: emailSends } = await supabase
        .from('notification_sends')
        .select('opened_at')
        .eq('alumni_email', email)
        .gte('sent_at', ninetyDaysAgo);

      let emailStatus: 'active' | 'inactive' | 'unknown' = 'unknown';
      if (emailSends && emailSends.length > 0) {
        const hasOpened = emailSends.some((s) => s.opened_at !== null);
        emailStatus = hasOpened ? 'active' : 'inactive';
      }

      await supabase.from('alumni_channel_activity').upsert(
        {
          alumni_email: email,
          channel: 'email',
          status: emailStatus,
          computed_at: new Date().toISOString(),
        },
        { onConflict: 'alumni_email,channel' }
      );

      // 2. Call channel activity
      const { data: callInteractions } = await supabase
        .from('alumni_interactions')
        .select('id, interaction_outcomes(is_substantive_conversation)')
        .eq('alumni_email', email)
        .gte('created_at', ninetyDaysAgo);

      let callStatus: 'active' | 'inactive' | 'unknown' = 'unknown';
      if (callInteractions && callInteractions.length > 0) {
        const hasSubstantive = callInteractions.some(
          (ci: any) => ci.interaction_outcomes?.is_substantive_conversation === true
        );
        callStatus = hasSubstantive ? 'active' : 'inactive';
      }

      await supabase.from('alumni_channel_activity').upsert(
        {
          alumni_email: email,
          channel: 'call',
          status: callStatus,
          computed_at: new Date().toISOString(),
        },
        { onConflict: 'alumni_email,channel' }
      );

      updatedCount++;
    }

    return NextResponse.json({ success: true, processed: updatedCount });
  } catch (err: any) {
    console.error('[Nightly Rollup Job] Error:', err);
    return NextResponse.json({ error: err?.message || 'Nightly rollup failed' }, { status: 500 });
  }
}
