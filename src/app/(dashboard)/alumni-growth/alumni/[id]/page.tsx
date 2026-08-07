import React from 'react';
import { getAlumnusEngagementDetails, getInteractionOutcomes, getOrgSettings } from '@/lib/engagement/queries';
import { getSupabaseUserEmail } from '@/lib/roles';
import AlumniDetailClient from './AlumniDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AlumniDetailPage({ params }: PageProps) {
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
