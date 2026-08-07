import React from 'react';
import { getPipelineBoardData } from '@/lib/engagement/queries';
import { getSupabaseUserEmail } from '@/lib/roles';
import PlacementClient from './PlacementClient';

export default async function PlacementPage() {
  const { pipeline, stages, memberships } = await getPipelineBoardData('placement');
  const userEmail = (await getSupabaseUserEmail()) || 'staff@navgurukul.org';

  return (
    <PlacementClient
      pipeline={pipeline}
      stages={stages}
      memberships={memberships}
      userEmail={userEmail}
    />
  );
}
