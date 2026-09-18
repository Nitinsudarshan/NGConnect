import React from 'react';
import { getPipelineBoardData, getKanbanFacets } from '@/lib/engagement/queries';
import { getSupabaseUserEmail } from '@/lib/roles';
import PayForwardClient from './PayForwardClient';
import { denyUnlessAccess } from '@/lib/guard';

export default async function PayForwardPage() {
  const denied = await denyUnlessAccess('crm.pipelines.pay_forward');
  if (denied) return denied;

  const { pipeline, stages } = await getPipelineBoardData('pay_forward');
  const facets = await getKanbanFacets('pay_forward');
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
