import React from 'react';
import { getFollowUpsData } from '@/lib/engagement/queries';
import FollowUpsClient from './FollowUpsClient';

export default async function FollowUpsPage() {
  const followups = await getFollowUpsData();

  return <FollowUpsClient followups={followups} />;
}
