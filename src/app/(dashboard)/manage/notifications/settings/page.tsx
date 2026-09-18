import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { SettingsClient } from './_components/SettingsClient';
import { NotificationProviderSettings } from '@/types/email-notifications';
import { denyUnlessAccess } from '@/lib/guard';

const DEFAULT_SETTINGS: NotificationProviderSettings = {
  id: 1,
  active_provider: 'dry_run',
  from_name: 'NGConnect',
  from_email: 'notifications@navgurukul.org',
  reply_to: null,
  sandbox_mode: true,
  sandbox_redirect_email: null,
  kill_switch: false,
  ses_region: null,
  updated_at: new Date().toISOString(),
};

export default async function NotificationSettingsPage() {
  const denied = await denyUnlessAccess('manage.notifications', 'edit', { backHref: '/manage/notifications', backLabel: 'Back to Notifications' });
  if (denied) return denied;

  const adminSupabase = createAdminClient();
  let dbError: string | null = null;

  let { data: settings, error } = await adminSupabase
    .from('notification_provider_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    dbError = error.message;
  }

  if (!settings && !error) {
    try {
      const { data: defaultSettings, error: insertError } = await adminSupabase
        .from('notification_provider_settings')
        .insert({
          id: 1,
          active_provider: 'dry_run',
          from_name: 'NGConnect',
          sandbox_mode: true,
        })
        .select('*')
        .maybeSingle();

      if (insertError) {
        dbError = insertError.message;
      } else if (defaultSettings) {
        settings = defaultSettings;
      }
    } catch (e: any) {
      dbError = e?.message || 'Failed to initialize default settings';
    }
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      <SettingsClient
        initialSettings={settings || DEFAULT_SETTINGS}
        dbError={dbError}
      />
    </div>
  );
}
