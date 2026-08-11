import React from 'react';
import { getContributionTypes, getInteractionOutcomes, getOrgSettings, getOutcomeMapping, getPipelines, getPipelineStages } from '@/lib/engagement/queries';
import { getSupabaseUserEmail, getUserRole } from '@/lib/roles';
import { getMentors, getLearningCenterAuditLogs } from '@/lib/learning-center/queries';
import SettingsClient from './SettingsClient';

export const metadata = {
  title: 'Alumni Growth Settings | NGConnect',
};

export default async function SettingsPage() {
  const [
    settings,
    outcomes,
    contributionTypes,
    pipelines,
    stages,
    userEmail,
    userRole,
    mentors,
    auditLogs,
    outcomeMappings,
  ] = await Promise.all([
    getOrgSettings(),
    getInteractionOutcomes(),
    getContributionTypes(),
    getPipelines(),
    getPipelineStages(),
    getSupabaseUserEmail().then((e) => e || 'staff@navgurukul.org'),
    getUserRole(),
    getMentors(),
    getLearningCenterAuditLogs(),
    getOutcomeMapping(),
  ]);

  return (
    <SettingsClient
      settings={settings}
      outcomes={outcomes}
      contributionTypes={contributionTypes}
      pipelines={pipelines}
      stages={stages}
      userEmail={userEmail}
      userRole={userRole}
      mentors={mentors}
      auditLogs={auditLogs}
      initialOutcomeMappings={outcomeMappings}
    />
  );
}
