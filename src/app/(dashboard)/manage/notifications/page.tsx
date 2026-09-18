import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { NotificationDashboardClient } from './_components/NotificationDashboardClient';
import { denyUnlessAccess } from '@/lib/guard';

export default async function NotificationDashboardPage() {
  const denied = await denyUnlessAccess('manage.notifications', 'view', { backHref: '/manage', backLabel: 'Back to Manage' });
  if (denied) return denied;

  const adminSupabase = createAdminClient();

  // Fetch sends, templates, triggers
  const { data: sends } = await adminSupabase
    .from('notification_sends')
    .select(`
      *,
      template:notification_templates(*),
      trigger:notification_triggers(*),
      alumni:alumni_master(full_name, campus, program)
    `)
    .order('sent_at', { ascending: false })
    .limit(500);

  const { data: templates } = await adminSupabase
    .from('notification_templates')
    .select('*')
    .eq('is_active', true)
    .order('code', { ascending: true });

  const { data: triggers } = await adminSupabase
    .from('notification_triggers')
    .select('*')
    .eq('is_active', true)
    .order('code', { ascending: true });

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      <NotificationDashboardClient
        sends={(sends as any) || []}
        templates={templates || []}
        triggers={triggers || []}
      />
    </div>
  );
}
