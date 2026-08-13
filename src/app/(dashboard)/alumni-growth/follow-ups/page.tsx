import React from 'react';
import { getFollowUpsData, getInteractionOutcomes } from '@/lib/engagement/queries';
import { getSupabaseUserEmail } from '@/lib/roles';
import FollowUpsClient from './FollowUpsClient';

export default async function FollowUpsPage() {
  const [followups, outcomes, userEmail] = await Promise.all([
    getFollowUpsData(),
    getInteractionOutcomes(),
    getSupabaseUserEmail(),
  ]);

  return (
    <FollowUpsClient
      followups={followups}
      outcomes={outcomes}
      userEmail={userEmail || 'staff@navgurukul.org'}
    />
  );
}
