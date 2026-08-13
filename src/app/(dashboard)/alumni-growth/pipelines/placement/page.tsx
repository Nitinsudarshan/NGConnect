import React from 'react';
import { getPipelineBoardData, getKanbanFacets } from '@/lib/engagement/queries';
import { getSupabaseUserEmail } from '@/lib/roles';
import PlacementClient from './PlacementClient';

export default async function PlacementPage() {
  const { pipeline, stages } = await getPipelineBoardData('placement');
  const facets = await getKanbanFacets('placement');
  const userEmail = (await getSupabaseUserEmail()) || 'staff@navgurukul.org';

  return (
    <PlacementClient
      pipeline={pipeline}
      stages={stages}
      facets={facets}
      userEmail={userEmail}
    />
  );
}
