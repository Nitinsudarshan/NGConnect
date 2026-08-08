"use server";

import { createClient } from '@/lib/supabase/server';
import { checkAccess } from '@/lib/permissions';
import { getUserRole } from '@/lib/roles';
import { LogInteractionPayload, PipelineSuggestion } from '@/types/engagement';
import { revalidatePath } from 'next/cache';

export async function logInteractionAction(payload: LogInteractionPayload) {
  try {
    const role = await getUserRole();
    const hasAccess = await checkAccess(role, 'crm');
    if (!hasAccess && role !== 'Admin' && role !== 'Super Admin') {
      return { success: false, error: 'Unauthorized: insufficient permissions' };
    }

    const supabase = await createClient();

    // 1. Fetch outcome definition
    const { data: outcome, error: outcomeErr } = await supabase
      .from('interaction_outcomes')
      .select('*')
      .eq('id', payload.outcome_id)
      .single();

    if (outcomeErr || !outcome) {
      return { success: false, error: 'Selected interaction outcome is invalid or inactive' };
    }

    // 2. Client & DB rule check: requires_followup_datetime
    if (outcome.requires_followup_datetime && (!payload.followup_at || payload.followup_at.trim() === '')) {
      return { success: false, error: 'This outcome requires a follow-up date and time' };
    }

    // Build combined notes if missing data fields were skipped
    let finalNotes = payload.notes || '';
    if (payload.skipped_missing_fields && payload.skipped_missing_fields.length > 0 && payload.skip_reason) {
      const skipSnippet = `[Data Gaps Skipped (${payload.skipped_missing_fields.join(', ')}): ${payload.skip_reason}]`;
      finalNotes = finalNotes ? `${finalNotes.trim()}\n${skipSnippet}` : skipSnippet;
    }

    // 3. Insert into alumni_interactions
    const { data: interaction, error: insertErr } = await supabase
      .from('alumni_interactions')
      .insert({
        alumni_email: payload.alumni_email,
        logged_by: payload.logged_by,
        interaction_channel: payload.interaction_channel || 'call',
        outcome_id: payload.outcome_id,
        notes: finalNotes || null,
        mentoring_interest: payload.mentoring_interest ?? null,
        placement_interest: payload.placement_interest ?? null,
        pay_forward_interest: payload.pay_forward_interest ?? null,
        followup_at: payload.followup_at || null,
        followup_assigned_to: payload.followup_assigned_to || payload.logged_by,
        followup_completed: false,
      })
      .select()
      .single();

    if (insertErr || !interaction) {
      return { success: false, error: insertErr?.message || 'Failed to log interaction' };
    }

    // Update missing profile fields if provided
    if (payload.updated_company && payload.updated_company.trim() !== '') {
      await supabase.from('alumni_master').update({ company: payload.updated_company }).eq('email', payload.alumni_email);
      await supabase.from('alumni_profile').update({ current_company: payload.updated_company }).eq('alumni_email', payload.alumni_email);
      await supabase.from('audit_log').insert({
        record_id: payload.alumni_email,
        action_type: 'UPDATE',
        field_name: 'company',
        new_value: payload.updated_company,
        changed_by_user_id: payload.logged_by,
        changed_at: new Date().toISOString(),
      });
    }

    if (payload.updated_linkedin && payload.updated_linkedin.trim() !== '') {
      await supabase.from('alumni_master').update({ linkedin_url: payload.updated_linkedin }).eq('email', payload.alumni_email);
      await supabase.from('alumni_profile').update({ linkedin_profile: payload.updated_linkedin }).eq('alumni_email', payload.alumni_email);
      await supabase.from('audit_log').insert({
        record_id: payload.alumni_email,
        action_type: 'UPDATE',
        field_name: 'linkedin_url',
        new_value: payload.updated_linkedin,
        changed_by_user_id: payload.logged_by,
        changed_at: new Date().toISOString(),
      });
    }

    // Log audit entry for skipped profile data gaps
    if (payload.skipped_missing_fields && payload.skipped_missing_fields.length > 0 && payload.skip_reason) {
      await supabase.from('audit_log').insert({
        record_id: payload.alumni_email,
        action_type: 'DATA_GAP_SKIPPED',
        field_name: payload.skipped_missing_fields.join(', '),
        new_value: payload.skip_reason,
        changed_by_user_id: payload.logged_by,
        changed_at: new Date().toISOString(),
      });
    }

    // 4. Support areas mapping
    if (payload.support_areas && payload.support_areas.length > 0) {
      const rows = payload.support_areas.map((sa) => ({
        interaction_id: interaction.id,
        support_area: sa,
      }));
      await supabase.from('interaction_support_areas').insert(rows);
    }

    // 5. Salary recording if provided
    let normalizedSalaryMonthly = 0;
    if (payload.salary_amount && payload.salary_amount > 0 && payload.salary_unit) {
      const unit = payload.salary_unit;
      const amount = payload.salary_amount;
      normalizedSalaryMonthly = unit === 'lpa' ? Math.round((amount * 100000) / 12) : amount;

      await supabase.from('alumni_salary_records').insert({
        alumni_email: payload.alumni_email,
        amount,
        unit,
        recorded_by: payload.logged_by,
        source_interaction_id: interaction.id,
      });

      // Update current_salary on alumni_profile if present
      await supabase
        .from('alumni_profile')
        .update({ current_salary: normalizedSalaryMonthly })
        .eq('alumni_email', payload.alumni_email);
    }

    // 6. Calculate Pipeline suggestions if discussed
    const suggestions: PipelineSuggestion[] = [];
    if (outcome.code === 'discussed') {
      if (payload.placement_interest) {
        suggestions.push({
          pipelineCode: 'placement',
          pipelineLabel: 'Placement support',
          reason: 'Alumnus indicated interest in placement / job guidance',
        });
      }
      if (payload.mentoring_interest) {
        suggestions.push({
          pipelineCode: 'mentoring',
          pipelineLabel: 'Mentoring / Career support',
          reason: 'Alumnus indicated interest in mentoring or skill improvement',
        });
      }
      if (payload.pay_forward_interest) {
        suggestions.push({
          pipelineCode: 'pay_forward',
          pipelineLabel: 'Pay-Forward',
          reason: 'Alumnus indicated capacity or interest in paying forward',
        });
      }
    }

    revalidatePath('/engagement/queue');
    revalidatePath(`/engagement/alumni/${encodeURIComponent(payload.alumni_email)}`);
    revalidatePath('/engagement/follow-ups');

    return {
      success: true,
      data: {
        interactionId: interaction.id,
        suggestions,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

export async function updateAlumniProfileFieldsAction(payload: {
  alumni_email: string;
  company?: string;
  salary_amount?: number;
  salary_unit?: 'monthly' | 'lpa';
  linkedin_url?: string;
  phone_number?: string;
  technology_stack?: string;
  updated_by: string;
}) {
  try {
    const supabase = await createClient();
    const email = payload.alumni_email;
    const masterUpdates: Record<string, any> = {};
    const profileUpdates: Record<string, any> = {};

    if (payload.company !== undefined && payload.company.trim() !== '') {
      masterUpdates.company = payload.company;
      profileUpdates.current_company = payload.company;
      await supabase.from('audit_log').insert({
        record_id: email,
        action_type: 'UPDATE',
        field_name: 'company',
        new_value: payload.company,
        changed_by_user_id: payload.updated_by,
        changed_at: new Date().toISOString(),
      });
    }

    if (payload.linkedin_url !== undefined && payload.linkedin_url.trim() !== '') {
      masterUpdates.linkedin_url = payload.linkedin_url;
      profileUpdates.linkedin_profile = payload.linkedin_url;
      await supabase.from('audit_log').insert({
        record_id: email,
        action_type: 'UPDATE',
        field_name: 'linkedin_url',
        new_value: payload.linkedin_url,
        changed_by_user_id: payload.updated_by,
        changed_at: new Date().toISOString(),
      });
    }

    if (payload.phone_number !== undefined && payload.phone_number.trim() !== '') {
      masterUpdates.phone_number = payload.phone_number;
      profileUpdates.phone_number = payload.phone_number;
      await supabase.from('audit_log').insert({
        record_id: email,
        action_type: 'UPDATE',
        field_name: 'phone_number',
        new_value: payload.phone_number,
        changed_by_user_id: payload.updated_by,
        changed_at: new Date().toISOString(),
      });
    }

    if (payload.technology_stack !== undefined && payload.technology_stack.trim() !== '') {
      masterUpdates.technology_stack = payload.technology_stack;
      await supabase.from('audit_log').insert({
        record_id: email,
        action_type: 'UPDATE',
        field_name: 'technology_stack',
        new_value: payload.technology_stack,
        changed_by_user_id: payload.updated_by,
        changed_at: new Date().toISOString(),
      });
    }

    if (Object.keys(masterUpdates).length > 0) {
      await supabase.from('alumni_master').update(masterUpdates).eq('email', email);
    }
    if (Object.keys(profileUpdates).length > 0) {
      await supabase.from('alumni_profile').update(profileUpdates).eq('alumni_email', email);
    }

    if (payload.salary_amount && payload.salary_amount > 0 && payload.salary_unit) {
      const amount = payload.salary_amount;
      const unit = payload.salary_unit;
      const normalizedMonthly = unit === 'lpa' ? Math.round((amount * 100000) / 12) : amount;

      await supabase.from('alumni_salary_records').insert({
        alumni_email: email,
        amount,
        unit,
        recorded_by: payload.updated_by,
      });

      await supabase.from('alumni_master').update({ starting_salary: normalizedMonthly * 12 }).eq('email', email);
      await supabase.from('alumni_profile').update({ current_salary: normalizedMonthly }).eq('alumni_email', email);
      await supabase.from('audit_log').insert({
        record_id: email,
        action_type: 'UPDATE',
        field_name: 'salary',
        new_value: `₹${normalizedMonthly.toLocaleString()}/mo`,
        changed_by_user_id: payload.updated_by,
        changed_at: new Date().toISOString(),
      });
    }

    revalidatePath(`/alumni-growth/alumni/${encodeURIComponent(email)}`);
    revalidatePath('/alumni-growth/workspace');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updatePipelineMembershipAction(payload: {
  alumni_email: string;
  pipeline_code: string;
  stage_id?: string;
  status?: string;
  is_active?: boolean;
  added_by: string;
}) {
  try {
    const supabase = await createClient();

    // Find pipeline
    const { data: pipeline } = await supabase
      .from('pipelines')
      .select('id, label')
      .eq('code', payload.pipeline_code)
      .single();

    if (!pipeline) {
      return { success: false, error: 'Pipeline not found' };
    }

    const isActive = payload.is_active ?? true;
    let finalStatus = payload.status || 'active';
    let finalStageId: string | null = payload.stage_id && !payload.stage_id.startsWith('default-') ? payload.stage_id : null;

    // Resolve stage_id or status if needed
    if (payload.stage_id && !payload.stage_id.startsWith('default-')) {
      const { data: stg } = await supabase
        .from('pipeline_stages')
        .select('id, label')
        .eq('id', payload.stage_id)
        .maybeSingle();

      if (stg) {
        finalStageId = stg.id;
        finalStatus = stg.label;
      }
    } else if (payload.status) {
      const { data: stg } = await supabase
        .from('pipeline_stages')
        .select('id, label')
        .eq('pipeline_id', pipeline.id)
        .or(`code.eq.${payload.status.toLowerCase().replace(/\s+/g, '_')},label.ilike.${payload.status}`)
        .maybeSingle();

      if (stg) {
        finalStageId = stg.id;
        finalStatus = stg.label;
      }
    }

    const recordToUpsert: any = {
      alumni_email: payload.alumni_email,
      pipeline_id: pipeline.id,
      status: finalStatus,
      added_by: payload.added_by,
      is_active: isActive,
    };

    if (finalStageId) {
      recordToUpsert.stage_id = finalStageId;
    }

    const { data, error } = await supabase
      .from('alumni_pipeline_membership')
      .upsert(recordToUpsert, { onConflict: 'alumni_email,pipeline_id' })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/alumni-growth/pipelines/${payload.pipeline_code}`);
    revalidatePath(`/engagement/pipelines/${payload.pipeline_code}`);
    revalidatePath(`/alumni-growth/alumni/${encodeURIComponent(payload.alumni_email)}`);
    revalidatePath(`/engagement/alumni/${encodeURIComponent(payload.alumni_email)}`);

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function managePipelineStageAction(payload: {
  pipeline_id: string;
  code: string;
  label: string;
  sort_order?: number;
  is_terminal?: boolean;
  is_active?: boolean;
}) {
  try {
    const role = await getUserRole();
    if (role !== 'Admin' && role !== 'Super Admin') {
      return { success: false, error: 'Admin access required' };
    }

    const supabase = await createClient();
    const cleanCode = payload.code.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const { data, error } = await supabase.from('pipeline_stages').upsert(
      {
        pipeline_id: payload.pipeline_id,
        code: cleanCode,
        label: payload.label.trim(),
        sort_order: payload.sort_order ?? 1,
        is_terminal: payload.is_terminal ?? false,
        is_custom: true,
        is_active: payload.is_active ?? true,
      },
      { onConflict: 'pipeline_id,code' }
    );

    if (error) return { success: false, error: error.message };

    revalidatePath('/alumni-growth/settings');
    revalidatePath('/engagement/settings');
    revalidatePath('/alumni-growth/pipelines/pay-forward');
    revalidatePath('/alumni-growth/pipelines/mentoring');
    revalidatePath('/alumni-growth/pipelines/placement');

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function recordContributionAction(payload: {
  alumni_email: string;
  contribution_type_id: string;
  amount_inr?: number;
  non_monetary_detail?: string;
  contributed_at?: string;
  recorded_by: string;
  source_interaction_id?: string;
}) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('pay_forward_contributions')
      .insert({
        alumni_email: payload.alumni_email,
        contribution_type_id: payload.contribution_type_id,
        amount_inr: payload.amount_inr || null,
        non_monetary_detail: payload.non_monetary_detail || null,
        contributed_at: payload.contributed_at || new Date().toISOString().split('T')[0],
        recorded_by: payload.recorded_by,
        source_interaction_id: payload.source_interaction_id || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/engagement/pipelines/pay-forward');
    revalidatePath(`/engagement/alumni/${encodeURIComponent(payload.alumni_email)}`);

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateOrgSettingsAction(payload: {
  pay_forward_cap_inr?: number;
  pay_forward_min_salary_monthly_inr?: number;
  followup_cooldown_days?: number;
  active_criteria_coursera?: boolean;
  active_criteria_mentoring?: boolean;
  active_criteria_watch_time?: boolean;
  weight_name?: number;
  weight_email?: number;
  weight_phone?: number;
  weight_gender?: number;
  weight_campus?: number;
  weight_course?: number;
  weight_entry_year?: number;
  weight_location?: number;
  weight_company?: number;
  weight_salary?: number;
  weight_linkedin?: number;
  weight_tech_stack?: number;
  profile_score_red_threshold?: number;
  profile_score_amber_threshold?: number;
  profile_score_green_threshold?: number;
  updated_by: string;
}) {
  try {
    const role = await getUserRole();
    if (role !== 'Admin' && role !== 'Super Admin') {
      return { success: false, error: 'Admin access required to change org settings' };
    }

    const supabase = await createClient();

    if (payload.pay_forward_cap_inr !== undefined) {
      await supabase.from('org_settings').upsert({
        key: 'pay_forward_cap_inr',
        value: JSON.stringify(payload.pay_forward_cap_inr),
        description: 'Lifetime pay-forward contribution considered complete (INR)',
        updated_by: payload.updated_by,
        updated_at: new Date().toISOString(),
      });
    }

    if (payload.pay_forward_min_salary_monthly_inr !== undefined) {
      await supabase.from('org_settings').upsert({
        key: 'pay_forward_min_salary_monthly_inr',
        value: JSON.stringify(payload.pay_forward_min_salary_monthly_inr),
        description: 'Minimum normalized monthly salary to pitch pay-forward (INR)',
        updated_by: payload.updated_by,
        updated_at: new Date().toISOString(),
      });
    }

    if (payload.followup_cooldown_days !== undefined) {
      await supabase.from('org_settings').upsert({
        key: 'followup_cooldown_days',
        value: JSON.stringify(payload.followup_cooldown_days),
        description: 'Default days before suggesting a re-attempt after no answer',
        updated_by: payload.updated_by,
        updated_at: new Date().toISOString(),
      });
    }

    if (payload.active_criteria_coursera !== undefined) {
      await supabase.from('org_settings').upsert({
        key: 'active_criteria_coursera',
        value: JSON.stringify(payload.active_criteria_coursera),
        description: 'Active member rule: Has active Coursera subscription',
        updated_by: payload.updated_by,
        updated_at: new Date().toISOString(),
      });
    }

    if (payload.active_criteria_mentoring !== undefined) {
      await supabase.from('org_settings').upsert({
        key: 'active_criteria_mentoring',
        value: JSON.stringify(payload.active_criteria_mentoring),
        description: 'Active member rule: Attended live mentoring sessions or workshops',
        updated_by: payload.updated_by,
        updated_at: new Date().toISOString(),
      });
    }

    if (payload.active_criteria_watch_time !== undefined) {
      await supabase.from('org_settings').upsert({
        key: 'active_criteria_watch_time',
        value: JSON.stringify(payload.active_criteria_watch_time),
        description: 'Active member rule: Logged watch hours from recorded video sessions',
        updated_by: payload.updated_by,
        updated_at: new Date().toISOString(),
      });
    }

    const weightsToUpsert: [string, number | undefined, string][] = [
      ['weight_name', payload.weight_name, 'Profile score weight: Full Name'],
      ['weight_email', payload.weight_email, 'Profile score weight: Email Address'],
      ['weight_phone', payload.weight_phone, 'Profile score weight: Phone Number'],
      ['weight_gender', payload.weight_gender, 'Profile score weight: Gender'],
      ['weight_campus', payload.weight_campus, 'Profile score weight: Campus'],
      ['weight_course', payload.weight_course, 'Profile score weight: Course'],
      ['weight_entry_year', payload.weight_entry_year, 'Profile score weight: Entry Cohort'],
      ['weight_location', payload.weight_location, 'Profile score weight: Location'],
      ['weight_company', payload.weight_company, 'Profile score weight: Company'],
      ['weight_salary', payload.weight_salary, 'Profile score weight: Salary'],
      ['weight_linkedin', payload.weight_linkedin, 'Profile score weight: LinkedIn'],
      ['weight_tech_stack', payload.weight_tech_stack, 'Profile score weight: Tech Stack'],
      ['profile_score_red_threshold', payload.profile_score_red_threshold, 'Profile score threshold for RED stage'],
      ['profile_score_amber_threshold', payload.profile_score_amber_threshold, 'Profile score threshold for AMBER stage'],
      ['profile_score_green_threshold', payload.profile_score_green_threshold, 'Profile score threshold for GREEN stage (100%)'],
    ];

    for (const [key, val, desc] of weightsToUpsert) {
      if (val !== undefined) {
        await supabase.from('org_settings').upsert({
          key,
          value: JSON.stringify(val),
          description: desc,
          updated_by: payload.updated_by,
          updated_at: new Date().toISOString(),
        });
      }
    }

    revalidatePath('/alumni-growth/settings');
    revalidatePath('/alumni-growth/workspace');
    revalidatePath('/engagement/settings');
    revalidatePath('/engagement/pipelines/pay-forward');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function manageOutcomeAction(payload: {
  code: string;
  label: string;
  requires_followup_datetime?: boolean;
  is_terminal?: boolean;
  is_active?: boolean;
}) {
  try {
    const role = await getUserRole();
    if (role !== 'Admin' && role !== 'Super Admin') {
      return { success: false, error: 'Admin access required' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.from('interaction_outcomes').upsert(
      {
        code: payload.code,
        label: payload.label,
        requires_followup_datetime: payload.requires_followup_datetime ?? false,
        is_terminal: payload.is_terminal ?? false,
        is_custom: true,
        is_active: payload.is_active ?? true,
      },
      { onConflict: 'code' }
    );

    if (error) return { success: false, error: error.message };

    revalidatePath('/engagement/settings');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function manageContributionTypeAction(payload: {
  code: string;
  label: string;
  is_monetary?: boolean;
  is_active?: boolean;
}) {
  try {
    const role = await getUserRole();
    if (role !== 'Admin' && role !== 'Super Admin') {
      return { success: false, error: 'Admin access required' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.from('contribution_types').upsert(
      {
        code: payload.code,
        label: payload.label,
        is_monetary: payload.is_monetary ?? false,
        is_custom: true,
        is_active: payload.is_active ?? true,
      },
      { onConflict: 'code' }
    );

    if (error) return { success: false, error: error.message };

    revalidatePath('/engagement/settings');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function completeFollowupAction(interactionId: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('alumni_interactions')
      .update({ followup_completed: true })
      .eq('id', interactionId);

    if (error) return { success: false, error: error.message };

    revalidatePath('/alumni-growth/workspace');
    revalidatePath('/alumni-growth/follow-ups');
    revalidatePath('/engagement/queue');
    revalidatePath('/engagement/follow-ups');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

import { getKanbanColumnCards } from './queries';

export async function getKanbanColumnCardsAction(
  pipelineCode: string,
  stageId: string,
  filters: { campus?: string; year?: string; supporter?: string },
  page: number = 1
) {
  try {
    const role = await getUserRole();
    const hasAccess = await checkAccess(role, 'crm');
    if (!hasAccess && role !== 'Admin' && role !== 'Super Admin') {
      return { success: false, error: 'Unauthorized: insufficient permissions' };
    }
    
    const cards = await getKanbanColumnCards(pipelineCode, stageId, filters, page);
    return { success: true, data: cards };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
