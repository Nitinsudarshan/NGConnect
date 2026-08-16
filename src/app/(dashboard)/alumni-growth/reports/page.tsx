import React from 'react';
import { getTeamActivity, getAlumniGrowthReportData } from '@/lib/engagement/queries';
import ReportsClient from './ReportsClient';

export default async function ReportsPage() {
  const sampleData = await getAlumniGrowthReportData();
  const teamActivity = await getTeamActivity();

  return <ReportsClient sampleData={sampleData} teamActivity={teamActivity} />;
}

