import React from 'react';
import { getPipelineBoardData, getKanbanFacets } from '@/lib/engagement/queries';
import { getSupabaseUserEmail } from '@/lib/roles';
import PlacementClient from './PlacementClient';
import { denyUnlessAccess } from '@/lib/guard';

export default async function PlacementPage() {
  const denied = await denyUnlessAccess('crm.pipelines.placement');
  if (denied) return denied;

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
