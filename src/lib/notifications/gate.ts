import { createAdminClient } from '@/lib/supabase/admin';
import { SkipReason } from '@/types/email-notifications';

export interface GateResult {
  allowed: boolean;
  skipReason?: SkipReason;
}

export async function checkSendEligibility(
  alumniEmail: string,
  triggerId?: string
): Promise<GateResult> {
  const supabase = createAdminClient();
  const normalizedEmail = alumniEmail.trim().toLowerCase();

  // 1. Check suppression list (channel in 'all' or 'email')
  const { data: suppression } = await supabase
    .from('alumni_contact_suppression')
    .select('reason, channel')
    .eq('alumni_email', normalizedEmail)
    .in('channel', ['all', 'email'])
    .maybeSingle();

  if (suppression) {
    if (suppression.reason === 'do_not_contact') {
      return { allowed: false, skipReason: 'do_not_contact' };
    }
    return { allowed: false, skipReason: 'unsubscribed' };
  }

  // 2. Check channel activity status (inactive status on 'email' channel)
  const { data: activity } = await supabase
    .from('alumni_channel_activity')
    .select('status')
    .eq('alumni_email', normalizedEmail)
    .eq('channel', 'email')
    .maybeSingle();

  if (activity && activity.status === 'inactive') {
    return { allowed: false, skipReason: 'inactive_email' };
  }

  // 3. Check for duplicate recent sends (same trigger to same email within last 24h)
  if (triggerId) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentSends } = await supabase
      .from('notification_sends')
      .select('id')
      .eq('alumni_email', normalizedEmail)
      .eq('trigger_id', triggerId)
      .gte('sent_at', twentyFourHoursAgo)
      .limit(1);

    if (recentSends && recentSends.length > 0) {
      return { allowed: false, skipReason: 'duplicate_recent_send' };
    }
  }

  return { allowed: true };
}
