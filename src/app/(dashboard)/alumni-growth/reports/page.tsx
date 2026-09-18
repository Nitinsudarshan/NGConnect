import React from 'react';
import { getTeamActivity, getAlumniGrowthReportData } from '@/lib/engagement/queries';
import ReportsClient from './ReportsClient';
import { denyUnlessAccess } from '@/lib/guard';

export default async function ReportsPage() {
  const denied = await denyUnlessAccess('crm.reports');
  if (denied) return denied;

  const sampleData = await getAlumniGrowthReportData();
  const teamActivity = await getTeamActivity();

  return <ReportsClient sampleData={sampleData} teamActivity={teamActivity} />;
}

