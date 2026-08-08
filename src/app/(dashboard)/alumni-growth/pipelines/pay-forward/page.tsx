import React from 'react';
import { getPipelineBoardData, getKanbanFacets } from '@/lib/engagement/queries';
import { getSupabaseUserEmail } from '@/lib/roles';
import PayForwardClient from './PayForwardClient';

export default async function PayForwardPage() {
  const { pipeline, stages } = await getPipelineBoardData('pay_forward');
  const facets = await getKanbanFacets();
  const userEmail = (await getSupabaseUserEmail()) || 'staff@navgurukul.org';

  return (
    <PayForwardClient
      pipeline={pipeline}
      stages={stages}
      facets={facets}
      userEmail={userEmail}
    />
  );
}
