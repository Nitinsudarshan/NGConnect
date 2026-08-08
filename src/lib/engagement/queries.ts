import { createClient } from '@/lib/supabase/server';
import { ContributionType, InteractionOutcome, Mentor, OrgSettings, PayForwardProgress, Pipeline, PipelineStage, ProfileCompleteness } from '@/types/engagement';
import { calculateProfileScore } from './utils';
import { slugify } from '@/lib/utils';
import { getUserCourseraData } from '@/lib/learning-center/queries';

const DEFAULT_PIPELINE_STAGES: Record<string, Omit<PipelineStage, 'id' | 'pipeline_id'>[]> = {
  pay_forward: [
    { code: 'paid', label: 'Paid', sort_order: 1, is_terminal: true, is_custom: false, is_active: true },
    { code: 'communicated', label: 'Communicated', sort_order: 2, is_terminal: false, is_custom: false, is_active: true },
    { code: 'waiting', label: 'Waiting', sort_order: 3, is_terminal: false, is_custom: false, is_active: true },
    { code: 'not_paying_right_now', label: 'Not Paying Right Now', sort_order: 4, is_terminal: false, is_custom: false, is_active: true },
  ],
  mentoring: [
    { code: 'needs_assessment', label: 'Needs assessment', sort_order: 1, is_terminal: false, is_custom: false, is_active: true },
    { code: 'matched_with_mentor', label: 'Matched with mentor', sort_order: 2, is_terminal: false, is_custom: false, is_active: true },
    { code: 'in_session', label: 'In session', sort_order: 3, is_terminal: false, is_custom: false, is_active: true },
    { code: 'closed', label: 'Closed', sort_order: 4, is_terminal: true, is_custom: false, is_active: true },
  ],
  placement: [
    { code: 'needs_identified', label: 'Needs identified', sort_order: 1, is_terminal: false, is_custom: false, is_active: true },
    { code: 'searching_matched', label: 'Actively searching / matched to opportunity', sort_order: 2, is_terminal: false, is_custom: false, is_active: true },
    { code: 'interviewing', label: 'Interviewing', sort_order: 3, is_terminal: false, is_custom: false, is_active: true },
    { code: 'placed', label: 'Placed', sort_order: 4, is_terminal: true, is_custom: false, is_active: true },
    { code: 'not_placed_closed', label: 'Not placed (closed)', sort_order: 5, is_terminal: true, is_custom: false, is_active: true },
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
    const supabase = await createClient();
    const { data } = await supabase.from('org_settings').select('key, value');
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
          settings.active_criteria_coursera = JSON.parse(row.value);
        } else if (row.key === 'active_criteria_mentoring') {
          settings.active_criteria_mentoring = JSON.parse(row.value);
        } else if (row.key === 'active_criteria_watch_time') {
          settings.active_criteria_watch_time = JSON.parse(row.value);
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

export async function getEngagementQueue() {
  const supabase = await createClient();

  // Fetch alumni_master list
  const { data: alumni } = await supabase
    .from('alumni_master')
    .select('*')
    .order('name', { ascending: true })
    .limit(300);

  // Fetch suppressed alumni to filter out
  const { data: suppressed } = await supabase
    .from('alumni_contact_suppression')
    .select('alumni_email');
  
  const suppressedSet = new Set((suppressed || []).map(s => s.alumni_email));

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
    .filter(a => !suppressedSet.has(a.email))
    .map((a) => ({
      ...a,
      profile: profileMap[a.email] || null,
      hasSalaryRecords: salarySet.has(a.email),
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
    followups: (followups || []).filter(f => !suppressedSet.has(f.alumni_email)),
    recentInteractions: (recentInteractions || []).filter(i => !suppressedSet.has(i.alumni_email)),
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

export async function getKanbanFacets() {
  const supabase = await createClient();

  const { data: campusesData } = await supabase.from('alumni_master').select('campus');
  const { data: yearsData } = await supabase.from('alumni_master').select('entry_year');
  const { data: supportersData } = await supabase.from('alumni_pipeline_membership').select('added_by');

  const campuses = Array.from(new Set((campusesData || []).map(r => r.campus).filter(Boolean)));
  const years = Array.from(new Set((yearsData || []).map(r => r.entry_year).filter(Boolean)));
  const supporters = Array.from(new Set((supportersData || []).map(r => r.added_by).filter(Boolean)));

  return { campuses, years, supporters };
}

export async function getKanbanColumnCards(
  pipelineCode: string,
  stageId: string,
  filters: { campus?: string; year?: string; supporter?: string },
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
