import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { 
  getInteractionOutcomes, 
  getOrgSettings, 
  getMyWorkspaceKPIs, 
  getMyQueueAlumni, 
  getUnassignedAlumni, 
  getTeamAlumni, 
  getUnassignedCounts, 
  getLastSyncedAt 
} from '@/lib/engagement/queries';
import { getSupabaseUserEmail } from '@/lib/roles';
import { checkAccess } from '@/lib/permissions';
import WorkspaceClient from './WorkspaceClient';

export default async function WorkspacePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || null;
  const userEmail = (await getSupabaseUserEmail()) || user?.email || 'staff@navgurukul.org';

  // Check RBAC permission for Team View tab
  const canViewTeamTab = await checkAccess(userId, 'crm.all_data', 'view');

  // Fetch initial tab data & workspace metadata in parallel
  const [
    myQueueAlumni,
    unassignedAlumni,
    teamData,
    outcomes,
    settings,
    myWorkspaceKPIs,
    unassignedCounts,
    lastSyncedAt,
  ] = await Promise.all([
    getMyQueueAlumni(userEmail),
    getUnassignedAlumni(),
    canViewTeamTab ? getTeamAlumni({ page: 1, pageSize: 10 }) : Promise.resolve({ alumniList: [], totalEntries: 0, totalPages: 0 }),
    getInteractionOutcomes(),
    getOrgSettings(),
    getMyWorkspaceKPIs(userEmail),
    getUnassignedCounts(),
    getLastSyncedAt(),
  ]);

  return (
    <WorkspaceClient
      canViewTeamTab={canViewTeamTab}
      initialMyQueueAlumni={myQueueAlumni}
      initialUnassignedAlumni={unassignedAlumni}
      initialTeamData={teamData}
      outcomes={outcomes}
      settings={settings}
      userEmail={userEmail}
      myWorkspaceKPIs={myWorkspaceKPIs}
      unassignedCounts={unassignedCounts}
      lastSyncedAt={lastSyncedAt}
    />
  );
}

