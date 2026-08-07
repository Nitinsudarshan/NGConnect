import React from 'react';
import { getEngagementQueue } from '@/lib/engagement/queries';
import ReportsClient from './ReportsClient';

export default async function ReportsPage() {
  const { alumniList } = await getEngagementQueue();

  const sampleData = alumniList.map((a: any) => ({
    name: a.name || 'Alumnus',
    email: a.email,
    campus: a.campus || 'N/A',
    course: a.course || 'N/A',
    status: a.status || 'Active',
    company: a.company || 'N/A',
    salary: 25000,
    last_contact: new Date().toISOString().split('T')[0],
    last_outcome: 'Connected — discussed',
    pf_counted: 45000,
    pf_lifetime: 45000,
    mentoring_status: 'Matched with mentor',
    placement_status: 'Discussed',
  }));

  return <ReportsClient sampleData={sampleData} />;
}
