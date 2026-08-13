import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ContributionType, DEFAULT_OUTCOME_MAPPINGS, InteractionOutcome, Mentor, OrgSettings, OutcomeMappingRow, PayForwardProgress, Pipeline, PipelineStage, ProfileCompleteness } from '@/types/engagement';
import { calculateProfileScore } from './utils';
import { slugify } from '@/lib/utils';
import { getUserCourseraData } from '@/lib/learning-center/queries';

export async function getOutcomeMapping(): Promise<OutcomeMappingRow[]> {
  try {
    const adminSupabase = createAdminClient();
    const { data } = await adminSupabase.from('org_settings').select('value').eq('key', 'outcome_mapping_rows').maybeSingle();
    if (data && data.value) {
      const parsed = JSON.parse(data.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    return DEFAULT_OUTCOME_MAPPINGS;
  } catch {
    return DEFAULT_OUTCOME_MAPPINGS;
  }
}

const DEFAULT_PIPELINE_STAGES: Record<string, Omit<PipelineStage, 'id' | 'pipeline_id'>[]> = {
  pay_forward: [
    { code: 'paid', label: 'Paid', sort_order: 1, is_terminal: true, is_custom: false, is_active: true, requires_outcome: false },
    { code: 'communicated', label: 'Communicated', sort_order: 2, is_terminal: false, is_custom: false, is_active: true, requires_outcome: false },
    { code: 'waiting', label: 'Waiting', sort_order: 3, is_terminal: false, is_custom: false, is_active: true, requires_outcome: false },
    { code: 'not_paying_right_now', label: 'Not Paying Right Now', sort_order: 4, is_terminal: false, is_custom: false, is_active: true, requires_outcome: false },
  ],
  mentoring: [
    { code: 'needs_assessment', label: 'Needs assessment', sort_order: 1, is_terminal: false, is_custom: false, is_active: true, requires_outcome: false },
    { code: 'matched_with_mentor', label: 'Matched with mentor', sort_order: 2, is_terminal: false, is_custom: false, is_active: true, requires_outcome: false },
    { code: 'in_session', label: 'In session', sort_order: 3, is_terminal: false, is_custom: false, is_active: true, requires_outcome: false },
    { code: 'closed', label: 'Closed', sort_order: 4, is_terminal: true, is_custom: false, is_active: true, requires_outcome: false },
  ],
  placement: [
    { code: 'needs_identified', label: 'Needs identified', sort_order: 1, is_terminal: false, is_custom: false, is_active: true, requires_outcome: false },
    { code: 'searching_matched', label: 'Actively searching / matched to opportunity', sort_order: 2, is_terminal: false, is_custom: false, is_active: true, requires_outcome: false },
    { code: 'interviewing', label: 'Interviewing', sort_order: 3, is_terminal: false, is_custom: false, is_active: true, requires_outcome: false },
    { code: 'placed', label: 'Placed', sort_order: 4, is_terminal: true, is_custom: false, is_active: true, requires_outcome: false },
    { code: 'not_placed_closed', label: 'Not placed (closed)', sort_order: 5, is_terminal: true, is_custom: false, is_active: true, requires_outcome: false },
  ],
};

export async function getPipelineStages(pipelineIdOrCode?: string): Promise<PipelineStage[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('pipeline_stages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (pipelineIdOrCode) {
      if (pipelineIdOrCode.includes('-')) {
        query = query.eq('pipeline_id', pipelineIdOrCode);
      } else {
        const { data: p } = await supabase.from('pipelines').select('id').eq('code', pipelineIdOrCode).single();
        if (p) {
          query = query.eq('pipeline_id', p.id);
        } else if (DEFAULT_PIPELINE_STAGES[pipelineIdOrCode]) {
          return DEFAULT_PIPELINE_STAGES[pipelineIdOrCode].map((s) => ({
            id: `default-${s.code}`,
            pipeline_id: pipelineIdOrCode,
            ...s,
          }));
        }
      }
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      if (pipelineIdOrCode && DEFAULT_PIPELINE_STAGES[pipelineIdOrCode]) {
        return DEFAULT_PIPELINE_STAGES[pipelineIdOrCode].map((s) => ({
          id: `default-${s.code}`,
          pipeline_id: pipelineIdOrCode,
          ...s,
        }));
      }
      return [];
    }

    return data as PipelineStage[];
  } catch {
    if (pipelineIdOrCode && DEFAULT_PIPELINE_STAGES[pipelineIdOrCode]) {
      return DEFAULT_PIPELINE_STAGES[pipelineIdOrCode].map((s) => ({
        id: `default-${s.code}`,
        pipeline_id: pipelineIdOrCode,
        ...s,
      }));
    }
    return [];
  }
}

export async function getOrgSettings(): Promise<OrgSettings> {
  try {
    const adminSupabase = createAdminClient();
    const { data } = await adminSupabase.from('org_settings').select('key, value');
    const settings: OrgSettings = {
      pay_forward_cap_inr: 120000,
      pay_forward_min_salary_monthly_inr: 15000,
      followup_cooldown_days: 3,
      active_criteria_coursera: true,
      active_criteria_mentoring: true,
      active_criteria_watch_time: true,
      weight_name: 10,
      weight_email: 10,
      weight_phone: 10,
      weight_gender: 5,
      weight_campus: 5,
      weight_course: 5,
      weight_entry_year: 5,
      weight_location: 10,
      weight_company: 15,
      weight_salary: 15,
      weight_linkedin: 5,
      weight_tech_stack: 5,
      profile_score_red_threshold: 50,
      profile_score_amber_threshold: 80,
      profile_score_green_threshold: 100,
    };
    if (data) {
      for (const row of data) {
        if (row.key === 'pay_forward_cap_inr') {
          settings.pay_forward_cap_inr = Number(row.value) || 120000;
        } else if (row.key === 'pay_forward_min_salary_monthly_inr') {
          settings.pay_forward_min_salary_monthly_inr = Number(row.value) || 15000;
        } else if (row.key === 'followup_cooldown_days') {
          settings.followup_cooldown_days = Number(row.value) || 3;
        } else if (row.key === 'active_criteria_coursera') {
          settings.active_criteria_coursera = typeof row.value === 'string' ? JSON.parse(row.value) : Boolean(row.value);
        } else if (row.key === 'active_criteria_mentoring') {
          settings.active_criteria_mentoring = typeof row.value === 'string' ? JSON.parse(row.value) : Boolean(row.value);
        } else if (row.key === 'active_criteria_watch_time') {
          settings.active_criteria_watch_time = typeof row.value === 'string' ? JSON.parse(row.value) : Boolean(row.value);
        } else if (row.key === 'weight_name') {
          settings.weight_name = Number(row.value);
        } else if (row.key === 'weight_email') {
          settings.weight_email = Number(row.value);
        } else if (row.key === 'weight_phone') {
          settings.weight_phone = Number(row.value);
        } else if (row.key === 'weight_gender') {
          settings.weight_gender = Number(row.value);
        } else if (row.key === 'weight_campus') {
          settings.weight_campus = Number(row.value);
        } else if (row.key === 'weight_course') {
          settings.weight_course = Number(row.value);
        } else if (row.key === 'weight_entry_year') {
          settings.weight_entry_year = Number(row.value);
        } else if (row.key === 'weight_location') {
          settings.weight_location = Number(row.value);
        } else if (row.key === 'weight_company') {
          settings.weight_company = Number(row.value);
        } else if (row.key === 'weight_salary') {
          settings.weight_salary = Number(row.value);
        } else if (row.key === 'weight_linkedin') {
          settings.weight_linkedin = Number(row.value);
        } else if (row.key === 'weight_tech_stack') {
          settings.weight_tech_stack = Number(row.value);
        } else if (row.key === 'profile_score_red_threshold') {
          settings.profile_score_red_threshold = Number(row.value);
        } else if (row.key === 'profile_score_amber_threshold') {
          settings.profile_score_amber_threshold = Number(row.value);
        } else if (row.key === 'profile_score_green_threshold') {
          settings.profile_score_green_threshold = Number(row.value);
        }
      }
    }
    return settings;
  } catch (err) {
    return {
      pay_forward_cap_inr: 120000,
      pay_forward_min_salary_monthly_inr: 15000,
      followup_cooldown_days: 3,
      active_criteria_coursera: true,
      active_criteria_mentoring: true,
      active_criteria_watch_time: true,
      weight_name: 10,
      weight_email: 10,
      weight_phone: 10,
      weight_gender: 5,
      weight_campus: 5,
      weight_course: 5,
      weight_entry_year: 5,
      weight_location: 10,
      weight_company: 15,
      weight_salary: 15,
      weight_linkedin: 5,
      weight_tech_stack: 5,
      profile_score_red_threshold: 50,
      profile_score_amber_threshold: 80,
      profile_score_green_threshold: 100,
    };
  }
}

export async function getInteractionOutcomes(): Promise<InteractionOutcome[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('interaction_outcomes')
      .select('*')
      .eq('is_active', true)
      .order('code', { ascending: true });
    return data || [];
  } catch {
    return [];
  }
}

export async function getCallReasons() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('call_reasons')
    .select('id, code, label, is_active')
    .order('created_at', { ascending: true });
    
  if (error) throw error;
  return data;
}

export async function getAlumnusOwnershipSummary(alumniEmail: string) {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from('alumni_pipeline_membership')
    .select('poc_email, pipelines(code)')
    .eq('alumni_email', alumniEmail)
    .eq('is_active', true);

  let payForwardOwner: string | null = null;
  let mentoringOwner: string | null = null;
  let placementOwner: string | null = null;

  if (memberships) {
    for (const m of memberships) {
      const pipe = m.pipelines as any;
      if (pipe?.code === 'pay_forward') payForwardOwner = m.poc_email || null;
      if (pipe?.code === 'mentoring') mentoringOwner = m.poc_email || null;
      if (pipe?.code === 'placement') placementOwner = m.poc_email || null;
    }
  }

  return {
    payForwardOwner,
    careerSupportOwner: mentoringOwner || placementOwner || null,
  };
}

export async function getTeamActivity(startDate?: string, endDate?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from('alumni_interactions')
    .select('logged_by, call_reasons(label)');
    
  if (startDate) {
    query = query.gte('created_at', startDate);
  } else {
    // Default to last 30 days if no date provided
    query = query.gte('created_at', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString());
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;

  const activityMap: Record<string, { byReason: Record<string, number>; total: number }> = {};
  
  (data || []).forEach(row => {
    const user = row.logged_by || 'Unknown';
    if (!activityMap[user]) {
      activityMap[user] = { byReason: {}, total: 0 };
    }
    const reason = (row.call_reasons as any)?.label || 'Unspecified';
    activityMap[user].total += 1;
    activityMap[user].byReason[reason] = (activityMap[user].byReason[reason] || 0) + 1;
  });

  return Object.keys(activityMap).map(user => ({
    staff: user,
    ...activityMap[user]
  })).sort((a, b) => b.total - a.total);
}

export async function getContributionTypes(): Promise<ContributionType[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('contribution_types')
      .select('*')
      .eq('is_active', true)
      .order('code', { ascending: true });
    return data || [];
  } catch {
    return [];
  }
}

export async function getPipelines(): Promise<Pipeline[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('pipelines')
      .select('*')
      .eq('is_active', true);
    return data || [];
  } catch {
    return [];
  }
}

export async function getAllPipelinePocEligibility() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('pipeline_poc_eligibility')
      .select('*');
    return data || [];
  } catch {
    return [];
  }
}

export async function getPipelineEligibleStaff(pipelineCode: string): Promise<{ email: string; name: string }[]> {
  try {
    const adminSupabase = createAdminClient();
    const { data: usersData, error: usersError } = await adminSupabase.auth.admin.listUsers();
    
    if (usersError || !usersData?.users) {
      return [];
    }

    const supabase = await createClient();
    const resourceId = `crm.pipelines.${pipelineCode}`;
    
    const { data: permissions } = await supabase
      .from('rbac_permissions')
      .select('*')
      .eq('resource_id', resourceId);

    const eligibleUsers = [];

    for (const user of usersData.users) {
      const role = user.app_metadata?.role || 'Staff';
      const team = user.user_metadata?.team || 'None';
      
      let canEdit = false;

      if (role === 'Super Admin') {
        canEdit = true;
      } else {
        const indData = permissions?.find(d => d.subject_type === 'user' && d.subject_id === user.id);
        const teamData = permissions?.find(d => d.subject_type === 'team' && d.subject_id === team);
        const roleData = permissions?.find(d => d.subject_type === 'role' && d.subject_id === role);

        if (indData && indData.can_edit !== undefined) {
          canEdit = indData.can_edit;
        } else if (teamData && teamData.can_edit !== undefined) {
          canEdit = teamData.can_edit;
        } else if (roleData && roleData.can_edit !== undefined) {
          canEdit = roleData.can_edit;
        } else if (role === 'Admin') {
          // Graceful fallback for Admin
          canEdit = true;
        }
      }

      if (canEdit && user.email) {
        // Exclude seeded dummy emails if they accidentally exist in auth
        if (!user.email.startsWith('caller') && !user.email.startsWith('dummy')) {
          eligibleUsers.push({
            email: user.email,
            name: user.user_metadata?.name || user.email.split('@')[0]
          });
        }
      }
    }

    // Sort alphabetically by name
    return eligibleUsers.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('Error fetching eligible staff:', err);
    return [];
  }
}

export async function getEngagementQueue() {
  const supabase = await createClient();

  // Fetch alumni_master list
  const { data: alumni } = await supabase
    .from('alumni_master')
    .select('*')
    .order('name', { ascending: true })
    .limit(300);

  // Fetch suppressed alumni to attach suppression reason
  const { data: suppressed } = await supabase
    .from('alumni_contact_suppression')
    .select('alumni_email, reason');
  
  const suppressedMap = new Map((suppressed || []).map(s => [s.alumni_email, s.reason || 'do_not_contact']));

  // Fetch alumni_profile list
  const { data: profiles } = await supabase
    .from('alumni_profile')
    .select('*');

  // Fetch salary records presence
  const { data: salaryRecords } = await supabase
    .from('alumni_salary_records')
    .select('alumni_email');

  const profileMap: Record<string, any> = {};
  if (profiles) {
    for (const p of profiles) {
      profileMap[p.alumni_email] = p;
    }
  }

  const salarySet = new Set<string>();
  if (salaryRecords) {
    for (const s of salaryRecords) {
      salarySet.add(s.alumni_email);
    }
  }

  const enrichedAlumni = (alumni || [])
    .map((a) => ({
      ...a,
      profile: profileMap[a.email] || null,
      hasSalaryRecords: salarySet.has(a.email),
      contactSuppressionReason: suppressedMap.get(a.email) || null,
    }));

  // Fetch active pending followups
  const { data: followups } = await supabase
    .from('alumni_interactions')
    .select('*, interaction_outcomes(label, code)')
    .eq('followup_completed', false)
    .not('followup_at', 'is', null)
    .order('followup_at', { ascending: true });

  // Fetch recent interactions to calculate cooldown re-attempts
  const { data: recentInteractions } = await supabase
    .from('alumni_interactions')
    .select('*, interaction_outcomes(code, label)')
    .order('created_at', { ascending: false })
    .limit(500);

  return {
    alumniList: enrichedAlumni,
    followups: (followups || []).filter(f => !suppressedMap.has(f.alumni_email)),
    recentInteractions: (recentInteractions || []).filter(i => !suppressedMap.has(i.alumni_email)),
  };
}

export async function getMyWorkspaceKPIs(userEmail: string) {
  const supabase = await createClient();
  const currentTime = new Date();
  
  // Today's start and end boundaries
  const todayStart = new Date(currentTime.setHours(0, 0, 0, 0)).toISOString();
  const todayEnd = new Date(currentTime.setHours(23, 59, 59, 999)).toISOString();

  // 0. Team-wide metrics for today
  const { count: callsLoggedToday } = await supabase
    .from('alumni_interactions')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd)
    .eq('interaction_channel', 'call');

  const { count: followupsAddedToday } = await supabase
    .from('alumni_interactions')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd)
    .not('followup_at', 'is', null);

  const { data: interactedAlumniToday } = await supabase
    .from('alumni_interactions')
    .select('alumni_email')
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd);

  const interactedToday = new Set(interactedAlumniToday?.map(i => i.alumni_email) || []).size;

  // 1. My Active Leads: alumni_pipeline_membership where poc_email = userEmail and is_active = true
  const { data: myLeads } = await supabase
    .from('alumni_pipeline_membership')
    .select('alumni_email')
    .eq('poc_email', userEmail)
    .eq('is_active', true);

  if (!myLeads || myLeads.length === 0) {
    return { 
      myActiveLeads: 0, 
      uncontactedLeads: 0, 
      followupsDue: 0,
      callsLoggedToday: callsLoggedToday || 0,
      followupsAddedToday: followupsAddedToday || 0,
      interactedToday,
    };
  }

  // Deduplicate emails since one alumnus could be in multiple pipelines
  const uniqueEmails = Array.from(new Set(myLeads.map(l => l.alumni_email)));

  // 2. Uncontacted Leads (last interaction > 30 days ago, or no interaction)
  // 3. Follow-ups Due (followup_at <= today, followup_completed = false)
  const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
  
  // We can fetch interactions for these emails
  const { data: interactions } = await supabase
    .from('alumni_interactions')
    .select('alumni_email, created_at, followup_at, followup_completed')
    .in('alumni_email', uniqueEmails);

  const interactionGroups: Record<string, any[]> = {};
  uniqueEmails.forEach(e => { interactionGroups[e] = []; });
  
  (interactions || []).forEach(inter => {
    if (interactionGroups[inter.alumni_email]) {
      interactionGroups[inter.alumni_email].push(inter);
    }
  });

  let uncontactedLeads = 0;
  let followupsDue = 0;
  const currentTimestamp = new Date();

  uniqueEmails.forEach(email => {
    const userInteractions = interactionGroups[email];
    
    // Check uncontacted
    if (userInteractions.length === 0) {
      uncontactedLeads++;
    } else {
      const sortedInteractions = [...userInteractions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const lastContact = sortedInteractions[0].created_at;
      if (lastContact < thirtyDaysAgo) {
        uncontactedLeads++;
      }
    }

    // Check followups
    const hasOverdueFollowup = userInteractions.some(i => {
      if (!i.followup_at || i.followup_completed) return false;
      const due = new Date(i.followup_at);
      return due <= currentTimestamp;
    });

    if (hasOverdueFollowup) {
      followupsDue++;
    }
  });

  return {
    myActiveLeads: uniqueEmails.length,
    uncontactedLeads,
    followupsDue,
    callsLoggedToday: callsLoggedToday || 0,
    followupsAddedToday: followupsAddedToday || 0,
    interactedToday,
  };
}

export async function getAlumnusEngagementDetails(alumniEmail: string) {
  const supabase = await createClient();

  const decodedParam = decodeURIComponent(alumniEmail);
  let resolvedEmail = decodedParam;

  // 1. Check exact match on email
  const { data: directMaster } = await supabase
    .from('alumni_master')
    .select('email')
    .eq('email', decodedParam)
    .maybeSingle();

  if (directMaster) {
    resolvedEmail = directMaster.email;
  } else {
    // 2. Lookup matching email without '@' or matching slugified name/email
    const { data: allMaster } = await supabase
      .from('alumni_master')
      .select('email, name');

    if (allMaster && allMaster.length > 0) {
      const match = allMaster.find((row) => {
        if (!row.email) return false;
        // Check email with '@' stripped
        if (row.email.replace('@', '') === decodedParam) return true;
        // Check normalized email (no special symbols)
        if (row.email.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === decodedParam.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()) return true;
        // Check slugified name
        if (row.name) {
          const cleanNameSlug = row.name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '');
          if (cleanNameSlug.toLowerCase() === decodedParam.toLowerCase()) return true;
          if (slugify(row.name) === slugify(decodedParam)) return true;
        }
        return false;
      });

      if (match) {
        resolvedEmail = match.email;
      }
    }
  }

  // Master record
  const { data: master } = await supabase
    .from('alumni_master')
    .select('*')
    .eq('email', resolvedEmail)
    .single();

  // Profile record
  const { data: profile } = await supabase
    .from('alumni_profile')
    .select('*')
    .eq('alumni_email', resolvedEmail)
    .single();

  // Interactions history
  const { data: interactions } = await supabase
    .from('alumni_interactions')
    .select('*, interaction_outcomes(label, code, is_custom)')
    .eq('alumni_email', resolvedEmail)
    .order('created_at', { ascending: false });

  // Pipeline memberships
  const { data: memberships } = await supabase
    .from('alumni_pipeline_membership')
    .select('*, pipelines(code, label)')
    .eq('alumni_email', resolvedEmail)
    .eq('is_active', true);

  // Salary records
  const { data: salaryRecords } = await supabase
    .from('alumni_salary_records')
    .select('*')
    .eq('alumni_email', resolvedEmail)
    .order('recorded_at', { ascending: false });

  // Pay-forward contributions
  const { data: contributions } = await supabase
    .from('pay_forward_contributions')
    .select('*, contribution_types(code, label, is_monetary)')
    .eq('alumni_email', resolvedEmail)
    .order('contributed_at', { ascending: false });

  // Completeness check (checking both master table & profile table)
  const completeness: ProfileCompleteness = {
    alumni_email: resolvedEmail,
    missing_linkedin: !(profile?.linkedin_profile || (master as any)?.linkedin_url),
    missing_company: !(profile?.current_company || master?.company),
    missing_salary: !(salaryRecords && salaryRecords.length > 0) && !master?.starting_salary,
  };

  // Pay forward progress
  const { data: pfProgressData } = await supabase
    .from('v_pay_forward_progress')
    .select('*')
    .eq('alumni_email', alumniEmail)
    .single();

  const pfProgress: PayForwardProgress = pfProgressData || {
    alumni_email: alumniEmail,
    counted_toward_cap: 0,
    lifetime_monetary_total: 0,
    cap_inr: 120000,
  };

  // Field change audit log
  const { data: auditLogs } = await supabase
    .from('audit_log')
    .select('*')
    .eq('record_id', alumniEmail)
    .order('changed_at', { ascending: false });

  // Mentoring attendance logs
  const { data: mentoringAttendance } = await supabase
    .from('mentoring_attendance')
    .select('*, mentoring_sessions(*, mentors(*))')
    .eq('alumni_email', alumniEmail)
    .order('created_at', { ascending: false });

  // Coursera & Learning stats
  const courseraData = await getUserCourseraData(alumniEmail);

  const orgSettings = await getOrgSettings();

  // Suppression status
  const { data: suppression } = await supabase
    .from('alumni_contact_suppression')
    .select('suppressed_since, reason')
    .eq('alumni_email', resolvedEmail)
    .single();

  return {
    master,
    profile,
    interactions: interactions || [],
    memberships: memberships || [],
    salaryRecords: salaryRecords || [],
    contributions: contributions || [],
    auditLogs: auditLogs || [],
    mentoringAttendance: mentoringAttendance || [],
    learningSessions: [],
    courseraData,
    completeness,
    pfProgress,
    orgSettings,
    isSuppressed: !!suppression,
    contactSuppressionReason: suppression?.reason || (suppression ? 'do_not_contact' : null),
  };
}

export async function getPipelineAlumniData(pipelineCode: string) {
  const supabase = await createClient();

  const { data: pipeline } = await supabase
    .from('pipelines')
    .select('id, code, label')
    .eq('code', pipelineCode)
    .single();

  if (!pipeline) {
    return { pipeline: null, stages: [], memberships: [], pfProgressMap: {}, salaryMap: {} };
  }

  const stages = await getPipelineStages(pipeline.id);

  // Get active memberships with joined pipeline_stages
  let memberships: any[] = [];
  try {
    const { data } = await supabase
      .from('alumni_pipeline_membership')
      .select('*, alumni_master(email, name, campus, company, phone_number), pipeline_stages(id, code, label, sort_order, is_terminal)')
      .eq('pipeline_id', pipeline.id)
      .eq('is_active', true);
    memberships = data || [];
  } catch {
    const { data } = await supabase
      .from('alumni_pipeline_membership')
      .select('*, alumni_master(email, name, campus, company, phone_number)')
      .eq('pipeline_id', pipeline.id)
      .eq('is_active', true);
    memberships = data || [];
  }

  // Pay-forward extra metadata if pipeline is pay_forward
  let pfProgressMap: Record<string, PayForwardProgress> = {};
  let salaryMap: Record<string, number> = {};
  if (pipelineCode === 'pay_forward' && memberships) {
    const emails = memberships.map((m) => m.alumni_email);
    if (emails.length > 0) {
      const { data: pfProg } = await supabase
        .from('v_pay_forward_progress')
        .select('*')
        .in('alumni_email', emails);

      if (pfProg) {
        for (const row of pfProg) {
          pfProgressMap[row.alumni_email] = row;
        }
      }

      const { data: salaries } = await supabase
        .from('alumni_salary_records')
        .select('alumni_email, amount_monthly_inr, recorded_at')
        .in('alumni_email', emails)
        .order('recorded_at', { ascending: false });

      if (salaries) {
        for (const s of salaries) {
          if (!salaryMap[s.alumni_email]) {
            salaryMap[s.alumni_email] = Number(s.amount_monthly_inr);
          }
        }
      }
    }
  }

  return {
    pipeline,
    stages,
    memberships: memberships || [],
    pfProgressMap,
    salaryMap,
  };
}

export { calculateProfileScore } from './utils';

export async function getFollowUpsData() {
  const supabase = await createClient();

  const { data: followups } = await supabase
    .from('alumni_interactions')
    .select('*, interaction_outcomes(*), alumni_master(name, phone_number, campus, company)')
    .eq('followup_completed', false)
    .not('followup_at', 'is', null)
    .order('followup_at', { ascending: true });

  return followups || [];
}

export async function getMentorsList(): Promise<Mentor[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('mentors')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    return data || [];
  } catch {
    return [];
  }
}

export async function getPipelineBoardData(pipelineCode: string) {
  return getPipelineAlumniData(pipelineCode);
}

export async function getKanbanFacets(pipelineCode?: string) {
  const supabase = await createClient();

  const { data: campusesData } = await supabase.from('alumni_master').select('campus');
  const { data: yearsData } = await supabase.from('alumni_master').select('entry_year');
  const { data: supportersData } = await supabase.from('alumni_pipeline_membership').select('added_by');

  const campuses = Array.from(new Set((campusesData || []).map(r => r.campus).filter(Boolean)));
  const years = Array.from(new Set((yearsData || []).map(r => r.entry_year).filter(Boolean)));
  const supporters = Array.from(new Set((supportersData || []).map(r => r.added_by).filter(Boolean)));

  let pocOptions: { email: string; name: string }[] = [];
  if (pipelineCode) {
    pocOptions = await getPipelineEligibleStaff(pipelineCode);
  }

  return { campuses, years, supporters, pocOptions };
}

export async function getKanbanColumnCards(
  pipelineCode: string,
  stageId: string,
  filters: { campus?: string; year?: string; supporter?: string; poc?: string },
  page: number = 1,
  limit: number = 25
) {
  const supabase = await createClient();
  
  // 1. Get Pipeline
  const { data: pipeline } = await supabase
    .from('pipelines')
    .select('id')
    .eq('code', pipelineCode)
    .single();

  if (!pipeline) return [];

  // 1.5 Get Stage Label
  const { data: stage } = await supabase
    .from('pipeline_stages')
    .select('label')
    .eq('id', stageId)
    .single();

  const stageLabel = stage?.label || '';

  // 2. Base query for memberships in this stage
  let query = supabase
    .from('alumni_pipeline_membership')
    .select('*, alumni_master!inner(email, name, campus, company, phone_number, entry_year)')
    .eq('pipeline_id', pipeline.id)
    .eq('is_active', true)
    .or(`stage_id.eq.${stageId},and(stage_id.is.null,status.eq."${stageLabel}")`);

  if (filters.supporter) {
    query = query.eq('added_by', filters.supporter);
  }
  if (filters.poc) {
    query = query.eq('poc_email', filters.poc);
  }
  if (filters.campus) {
    query = query.eq('alumni_master.campus', filters.campus);
  }
  if (filters.year) {
    query = query.eq('alumni_master.entry_year', filters.year);
  }

  // 3. Fetch suppressed alumni to filter out
  const { data: suppressed } = await supabase
    .from('alumni_contact_suppression')
    .select('alumni_email');
  
  const suppressedSet = new Set((suppressed || []).map(s => s.alumni_email));

  const { data: memberships, error } = await query;
  if (error || !memberships) return [];

  // 4. Filter out suppressed
  const activeMemberships = memberships.filter(m => !suppressedSet.has(m.alumni_email));

  // 5. Calculate days since last contact and sort
  const emails = activeMemberships.map(m => m.alumni_email);
  const { data: interactions } = await supabase
    .from('alumni_interactions')
    .select('alumni_email, created_at')
    .in('alumni_email', emails);

  const lastContactMap: Record<string, number> = {};
  if (interactions) {
    for (const i of interactions) {
      const ts = new Date(i.created_at).getTime();
      if (!lastContactMap[i.alumni_email] || ts > lastContactMap[i.alumni_email]) {
        lastContactMap[i.alumni_email] = ts;
      }
    }
  }

  const now = Date.now();
  const sorted = activeMemberships.sort((a, b) => {
    const aLast = lastContactMap[a.alumni_email] || 0;
    const bLast = lastContactMap[b.alumni_email] || 0;
    const aDays = aLast === 0 ? 9999 : (now - aLast) / (1000 * 60 * 60 * 24);
    const bDays = bLast === 0 ? 9999 : (now - bLast) / (1000 * 60 * 60 * 24);
    return bDays - aDays; // descending
  });

  // 6. Paginate
  const start = (page - 1) * limit;
  const paginated = sorted.slice(start, start + limit);

  // 7. Enclose extra metadata if Pay-Forward
  if (pipelineCode === 'pay_forward' && paginated.length > 0) {
    const paginatedEmails = paginated.map(m => m.alumni_email);
    const { data: pfProg } = await supabase
      .from('v_pay_forward_progress')
      .select('*')
      .in('alumni_email', paginatedEmails);

    const pfProgressMap: Record<string, PayForwardProgress> = {};
    if (pfProg) {
      for (const row of pfProg) {
        pfProgressMap[row.alumni_email] = row;
      }
    }

    const { data: salaries } = await supabase
      .from('alumni_salary_records')
      .select('alumni_email, amount_monthly_inr, recorded_at')
      .in('alumni_email', paginatedEmails)
      .order('recorded_at', { ascending: false });

    const salaryMap: Record<string, number> = {};
    if (salaries) {
      for (const s of salaries) {
        if (!salaryMap[s.alumni_email]) {
          salaryMap[s.alumni_email] = Number(s.amount_monthly_inr);
        }
      }
    }

    return paginated.map(m => ({ ...m, pfProgress: pfProgressMap[m.alumni_email], salary: salaryMap[m.alumni_email] }));
  }

  return paginated;
}

export async function getKanbanBoardCards(
  pipelineCode: string,
  stages: any[],
  filters: { campus?: string; year?: string; supporter?: string; poc?: string },
  limit: number = 500
) {
  const supabase = await createClient();
  
  // 1. Get Pipeline
  const { data: pipeline } = await supabase
    .from('pipelines')
    .select('id')
    .eq('code', pipelineCode)
    .single();

  if (!pipeline) return {};

  // 2. Base query for ALL memberships in this pipeline
  let query = supabase
    .from('alumni_pipeline_membership')
    .select('*, alumni_master!inner(email, name, campus, company, phone_number, entry_year)')
    .eq('pipeline_id', pipeline.id)
    .eq('is_active', true);

  if (filters.supporter) {
    query = query.eq('added_by', filters.supporter);
  }
  if (filters.poc) {
    query = query.eq('poc_email', filters.poc);
  }
  if (filters.campus) {
    query = query.eq('alumni_master.campus', filters.campus);
  }
  if (filters.year) {
    query = query.eq('alumni_master.entry_year', filters.year);
  }

  // 3. Fetch suppressed alumni to attach reason
  const { data: suppressed } = await supabase
    .from('alumni_contact_suppression')
    .select('alumni_email, reason');
  
  const suppressedMap = new Map((suppressed || []).map(s => [s.alumni_email, s.reason || 'do_not_contact']));

  const { data: memberships, error } = await query;
  if (error || !memberships) return {};

  // 4. Do not filter out suppressed for Kanban, we want them visible but badged
  const activeMemberships = memberships;

  // 5. Calculate days since last contact
  const emails = activeMemberships.map(m => m.alumni_email);
  const { data: interactions } = await supabase
    .from('alumni_interactions')
    .select('alumni_email, created_at')
    .in('alumni_email', emails);

  const lastContactMap: Record<string, number> = {};
  if (interactions) {
    for (const i of interactions) {
      const ts = new Date(i.created_at).getTime();
      if (!lastContactMap[i.alumni_email] || ts > lastContactMap[i.alumni_email]) {
        lastContactMap[i.alumni_email] = ts;
      }
    }
  }

  // 6. Fetch extra metadata if Pay-Forward
  const pfProgressMap: Record<string, PayForwardProgress> = {};
  const salaryMap: Record<string, number> = {};
  
  if (pipelineCode === 'pay_forward' && activeMemberships.length > 0) {
    const { data: pfProg } = await supabase
      .from('v_pay_forward_progress')
      .select('*')
      .in('alumni_email', emails);

    if (pfProg) {
      for (const row of pfProg) {
        pfProgressMap[row.alumni_email] = row;
      }
    }

    const { data: salaries } = await supabase
      .from('alumni_salary_records')
      .select('alumni_email, amount_monthly_inr, recorded_at')
      .in('alumni_email', emails)
      .order('recorded_at', { ascending: false });

    if (salaries) {
      for (const s of salaries) {
        if (!salaryMap[s.alumni_email]) {
          salaryMap[s.alumni_email] = Number(s.amount_monthly_inr);
        }
      }
    }
  }

  // 7. Sort and Group by Stage ID
  const now = Date.now();
  const sorted = activeMemberships.sort((a, b) => {
    const aLast = lastContactMap[a.alumni_email] || 0;
    const bLast = lastContactMap[b.alumni_email] || 0;
    const aDays = aLast === 0 ? 9999 : (now - aLast) / (1000 * 60 * 60 * 24);
    const bDays = bLast === 0 ? 9999 : (now - bLast) / (1000 * 60 * 60 * 24);
    return bDays - aDays; // descending
  });

  const cardsByStage: Record<string, any[]> = {};
  stages.forEach(s => { cardsByStage[s.id] = []; });

  sorted.forEach(m => {
    let card = m;
    if (pipelineCode === 'pay_forward') {
      card = { ...m, pfProgress: pfProgressMap[m.alumni_email], salary: salaryMap[m.alumni_email] };
    }

    let assignedStageId = m.stage_id;
    // Handle fallback if stage_id is null but status string matches a stage label
    if (!assignedStageId) {
      const match = stages.find(s => s.label === m.status);
      if (match) assignedStageId = match.id;
    }

    if (assignedStageId && cardsByStage[assignedStageId] && cardsByStage[assignedStageId].length < limit) {
      cardsByStage[assignedStageId].push(card);
    }
  });

  return cardsByStage;
}

export async function getPipelineListView(
  pipelineCode: string,
  filters: { campus?: string; year?: string; supporter?: string; poc?: string; stage?: string },
  sort: { field: 'name' | 'stage' | 'campus' | 'year' | 'poc'; direction: 'asc' | 'desc' },
  page: number,
  pageSize: number = 25
) {
  const supabase = await createClient();
  
  // 1. Get Pipeline
  const { data: pipeline } = await supabase
    .from('pipelines')
    .select('id')
    .eq('code', pipelineCode)
    .single();

  if (!pipeline) return { data: [], totalCount: 0 };

  // 2. Base query
  let query = supabase
    .from('alumni_pipeline_membership')
    .select('*, alumni_master!inner(email, name, campus, company, phone_number, entry_year), pipeline_stages!inner(id, code, label)', { count: 'exact' })
    .eq('pipeline_id', pipeline.id)
    .eq('is_active', true);

  if (filters.supporter) {
    query = query.eq('added_by', filters.supporter);
  }
  if (filters.poc) {
    query = query.eq('poc_email', filters.poc);
  }
  if (filters.campus) {
    query = query.eq('alumni_master.campus', filters.campus);
  }
  if (filters.year) {
    query = query.eq('alumni_master.entry_year', filters.year);
  }
  if (filters.stage) {
    query = query.eq('stage_id', filters.stage);
  }

  // 3. Sorting
  const ascending = sort.direction === 'asc';
  if (sort.field === 'name') {
    query = query.order('name', { foreignTable: 'alumni_master', ascending });
  } else if (sort.field === 'campus') {
    query = query.order('campus', { foreignTable: 'alumni_master', ascending });
  } else if (sort.field === 'year') {
    query = query.order('entry_year', { foreignTable: 'alumni_master', ascending });
  } else if (sort.field === 'poc') {
    query = query.order('poc_email', { ascending });
  } else if (sort.field === 'stage') {
    query = query.order('label', { foreignTable: 'pipeline_stages', ascending });
  } else {
    // Default fallback sort
    query = query.order('updated_at', { ascending: false });
  }

  // 4. Pagination
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  query = query.range(start, end);

  const { data: memberships, count, error } = await query;
  
  if (error || !memberships) {
    console.error("List view fetch error:", error);
    return { data: [], totalCount: 0 };
  }

  // 5. Fetch suppressed alumni to attach reason
  const { data: suppressed } = await supabase
    .from('alumni_contact_suppression')
    .select('alumni_email, reason');
  const suppressedMap = new Map((suppressed || []).map(s => [s.alumni_email, s.reason || 'do_not_contact']));

  const activeMemberships = memberships;

  // 6. Augment with interaction / salary data (Pay-Forward only really needs salary, all might want last contact)
  const emails = activeMemberships.map(m => m.alumni_email);
  
  const { data: interactions } = await supabase
    .from('alumni_interactions')
    .select('alumni_email, created_at')
    .in('alumni_email', emails);

  const lastContactMap: Record<string, number> = {};
  if (interactions) {
    for (const i of interactions) {
      const ts = new Date(i.created_at).getTime();
      const em = i.alumni_email;
      if (!lastContactMap[em] || ts > lastContactMap[em]) {
        lastContactMap[em] = ts;
      }
    }
  }

  let salaryMap: Record<string, number> = {};
  let pfProgressMap: Record<string, any> = {};

  if (pipelineCode === 'pay_forward') {
    const { data: salaries } = await supabase
      .from('alumni_salary_records')
      .select('alumni_email, salary_amount')
      .in('alumni_email', emails)
      .order('effective_date', { ascending: false });

    if (salaries) {
      for (const s of salaries) {
        if (!salaryMap[s.alumni_email]) {
          salaryMap[s.alumni_email] = Number(s.salary_amount);
        }
      }
    }

    const { data: pfCaps } = await supabase
      .from('alumni_pf_caps')
      .select('alumni_email, target_amount, total_paid, is_fulfilled')
      .in('alumni_email', emails);

    if (pfCaps) {
      for (const c of pfCaps) {
        pfProgressMap[c.alumni_email] = c;
      }
    }
  }

  // 7. Map to final card shape
  const now = Date.now();
  const finalData = activeMemberships.map(m => {
    let days = -1;
    if (lastContactMap[m.alumni_email]) {
      days = Math.floor((now - lastContactMap[m.alumni_email]) / (1000 * 60 * 60 * 24));
    }
    
    // For fallback salary if record missing
    const fallbackSal = m.alumni_master?.starting_salary ? (Number(m.alumni_master.starting_salary) / 12) : 0;
    
    return {
      ...m,
      stage: m.pipeline_stages,
      days_since_last_contact: days,
      salary: salaryMap[m.alumni_email] || fallbackSal,
      pfProgress: pfProgressMap[m.alumni_email] || null,
      contactSuppressionReason: suppressedMap.get(m.alumni_email) || null
    };
  });

  return {
    data: finalData,
    totalCount: count || 0
  };
}
