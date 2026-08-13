import React from 'react';
import { getPipelineBoardData, getKanbanFacets } from '@/lib/engagement/queries';
import { getSupabaseUserEmail } from '@/lib/roles';
import MentoringClient from './MentoringClient';

export default async function MentoringPage() {
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
