import React from 'react';
import { getContributionTypes, getInteractionOutcomes, getMentorsList, getOrgSettings, getPipelines, getPipelineStages } from '@/lib/engagement/queries';
import { getSupabaseUserEmail, getUserRole } from '@/lib/roles';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const settings = await getOrgSettings();
  const outcomes = await getInteractionOutcomes();
  const contributionTypes = await getContributionTypes();
  const mentors = await getMentorsList();
  const pipelines = await getPipelines();
  const stages = await getPipelineStages();
  const userEmail = (await getSupabaseUserEmail()) || 'staff@navgurukul.org';
  const userRole = await getUserRole();

  return (
    <SettingsClient
      settings={settings}
      outcomes={outcomes}
      contributionTypes={contributionTypes}
      mentors={mentors}
      pipelines={pipelines}
      stages={stages}
      userEmail={userEmail}
      userRole={userRole}
    />
  );
}
