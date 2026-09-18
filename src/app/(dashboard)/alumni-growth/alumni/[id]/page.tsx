import React from 'react';
import { getAlumnusEngagementDetails, getInteractionOutcomes, getOrgSettings } from '@/lib/engagement/queries';
import { getSupabaseUserEmail } from '@/lib/roles';
import AlumniDetailClient from './AlumniDetailClient';
import { denyUnlessAccess } from '@/lib/guard';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AlumniDetailPage({ params }: PageProps) {
  const denied = await denyUnlessAccess('crm.alumni_profile');
  if (denied) return denied;

  const { id } = await params;
  const decodedEmail = decodeURIComponent(id);

  const data = await getAlumnusEngagementDetails(decodedEmail);
  const outcomes = await getInteractionOutcomes();
  const settings = await getOrgSettings();
  const userEmail = (await getSupabaseUserEmail()) || 'staff@navgurukul.org';

  return (
    <AlumniDetailClient
      data={data}
      outcomes={outcomes}
      settings={settings}
      userEmail={userEmail}
    />
  );
}
