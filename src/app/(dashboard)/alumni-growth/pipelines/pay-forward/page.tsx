import React from 'react';
import { getPipelineBoardData } from '@/lib/engagement/queries';
import { getSupabaseUserEmail } from '@/lib/roles';
import PayForwardClient from './PayForwardClient';

export default async function PayForwardPage() {
  const { pipeline, stages, memberships, pfProgressMap, salaryMap } = await getPipelineBoardData('pay_forward');
  const userEmail = (await getSupabaseUserEmail()) || 'staff@navgurukul.org';

  return (
    <PayForwardClient
      pipeline={pipeline}
      stages={stages}
      memberships={memberships}
      pfProgressMap={pfProgressMap || {}}
      salaryMap={salaryMap || {}}
      userEmail={userEmail}
    />
  );
}
