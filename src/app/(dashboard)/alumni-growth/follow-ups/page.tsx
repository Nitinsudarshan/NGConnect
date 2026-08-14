import React from 'react';
import { getMyFollowUps, getTeamFollowUps, getInteractionOutcomes } from '@/lib/engagement/queries';
import { getSupabaseUserEmail } from '@/lib/roles';
import { checkAccess } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import FollowUpsClient from './FollowUpsClient';

export default async function FollowUpsPage() {
  const userEmail = (await getSupabaseUserEmail()) || 'staff@navgurukul.org';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const canViewTeamTab = user ? await checkAccess(user.id, 'crm.all_data', 'view') : false;

  const [myFollowups, teamFollowups, outcomes] = await Promise.all([
    getMyFollowUps(userEmail),
    canViewTeamTab ? getTeamFollowUps() : Promise.resolve([]),
    getInteractionOutcomes(),
  ]);

  return (
    <FollowUpsClient
      canViewTeamTab={canViewTeamTab}
      initialMyFollowups={myFollowups}
      initialTeamFollowups={teamFollowups}
      outcomes={outcomes}
      userEmail={userEmail}
    />
  );
}
