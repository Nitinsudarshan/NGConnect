import React from 'react';
import { getEngagementQueue, getInteractionOutcomes, getOrgSettings } from '@/lib/engagement/queries';
import { getSupabaseUserEmail } from '@/lib/roles';
import WorkspaceClient from './WorkspaceClient';

export default async function WorkspacePage() {
  const { alumniList, followups, recentInteractions } = await getEngagementQueue();
  const outcomes = await getInteractionOutcomes();
  const settings = await getOrgSettings();
  const userEmail = (await getSupabaseUserEmail()) || 'staff@navgurukul.org';
  console.log('--- WORKSPACE PAGE ---');
  console.log('alumniList length:', alumniList?.length);

  return (
    <WorkspaceClient
      alumniList={alumniList}
      followups={followups}
      recentInteractions={recentInteractions}
      outcomes={outcomes}
      settings={settings}
      userEmail={userEmail}
    />
  );
}
