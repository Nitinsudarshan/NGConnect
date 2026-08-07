import React from 'react';
import { getPipelineBoardData } from '@/lib/engagement/queries';
import { getSupabaseUserEmail } from '@/lib/roles';
import MentoringClient from './MentoringClient';

export default async function MentoringPage() {
  const { pipeline, stages, memberships } = await getPipelineBoardData('mentoring');
  const userEmail = (await getSupabaseUserEmail()) || 'staff@navgurukul.org';

  return (
    <MentoringClient
      pipeline={pipeline}
      stages={stages}
      memberships={memberships}
      userEmail={userEmail}
    />
  );
}
