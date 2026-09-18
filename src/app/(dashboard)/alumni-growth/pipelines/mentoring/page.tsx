import React from 'react';
import { getPipelineBoardData, getKanbanFacets } from '@/lib/engagement/queries';
import { getSupabaseUserEmail } from '@/lib/roles';
import MentoringClient from './MentoringClient';
import { denyUnlessAccess } from '@/lib/guard';

export default async function MentoringPage() {
  const denied = await denyUnlessAccess('crm.pipelines.mentoring');
  if (denied) return denied;

  const { pipeline, stages } = await getPipelineBoardData('mentoring');
  const facets = await getKanbanFacets('mentoring');
  const userEmail = (await getSupabaseUserEmail()) || 'staff@navgurukul.org';

  return (
    <MentoringClient
      pipeline={pipeline}
      stages={stages}
      facets={facets}
      userEmail={userEmail}
    />
  );
}
