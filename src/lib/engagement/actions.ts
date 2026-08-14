"use server";

import { createClient } from '@/lib/supabase/server';
import { checkAccess, checkClusterAccess } from '@/lib/permissions';
import { auth } from '@/lib/auth';
import { getUserRole, getSupabaseUserEmail } from '@/lib/roles';
import { LogInteractionPayload, OutcomeMappingRow, PipelineSuggestion, PipelineStage } from '@/types/engagement';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTeamAlumni } from '@/lib/engagement/queries';


/**
 * Writes an audit log entry to the shared learning_center_audit_logs table
 * with an alumni_-prefixed entity_type so it can be filtered per module.
 */
async function logAlumniGrowthAudit(
  entityType: string,
  entityId: string | null,
  action: "create" | "update" | "delete" | "archive",
  details: string
) {
  try {
    const supabase = await createClient();
    const userEmail = await getSupabaseUserEmail();
    await supabase.from('learning_center_audit_logs').insert({
      entity_type: entityType,
      entity_id: entityId,
      action,
      details,
      user_email: userEmail || 'alumni-growth-admin',
      created_at: new Date().toISOString(),
    });
  } catch {
    // Non-critical — silently skip if audit log table missing
  }
}

export async function logInteractionAction(payload: LogInteractionPayload) {
  try {
    const role = await getUserRole();
    const { userId } = await auth();
    const hasAccess = await checkAccess(userId, 'crm.workspace', 'edit');
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

    // 1.5. Check do_not_contact suppression
    const { data: alumniProfile } = await supabase
      .from('alumni_master')
      .select('do_not_contact')
      .eq('email', payload.alumni_email)
      .single();

    if (alumniProfile?.do_not_contact) {
      return { success: false, error: 'Cannot log interactions for alumni who have opted out of contact (do_not_contact is true)' };
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
        call_reason_id: payload.call_reason_id || null,
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
    if (outcome.is_substantive_conversation) {
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
        .eq('pipeline_id', pipeline.id)
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

    // Fallback: If no stage is resolved, assign them to the first active stage in the pipeline
    if (!finalStageId) {
      const { data: firstStage } = await supabase
        .from('pipeline_stages')
        .select('id, label')
        .eq('pipeline_id', pipeline.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (firstStage) {
        finalStageId = firstStage.id;
        finalStatus = firstStage.label;
      }
    }

    const recordToUpsert: any = {
      alumni_email: payload.alumni_email,
      pipeline_id: pipeline.id,
      status: finalStatus,
      added_by: payload.added_by,
      is_active: isActive,
    };

    if (payload.pipeline_code === 'mentoring' || payload.pipeline_code === 'placement') {
      const siblingCode = payload.pipeline_code === 'mentoring' ? 'placement' : 'mentoring';
      const { data: siblingPipeline } = await supabase
        .from('pipelines')
        .select('id')
        .eq('code', siblingCode)
        .single();
        
      if (siblingPipeline) {
        const { data: siblingMembership } = await supabase
          .from('alumni_pipeline_membership')
          .select('poc_email')
          .eq('alumni_email', payload.alumni_email)
          .eq('pipeline_id', siblingPipeline.id)
          .not('poc_email', 'is', null)
          .maybeSingle();

        if (siblingMembership?.poc_email) {
          recordToUpsert.poc_email = siblingMembership.poc_email;
        }
      }
    }

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
  archive?: boolean;
}) {
  try {
    const role = await getUserRole();
    if (role !== 'Admin' && role !== 'Super Admin') {
      return { success: false, error: 'Admin access required' };
    }

    const supabase = await createClient();
    const cleanCode = payload.code.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const { data: existing } = await supabase.from('pipeline_stages').select('id').match({ pipeline_id: payload.pipeline_id, code: cleanCode }).maybeSingle();
    const isUpdate = !!existing;

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

    const action = payload.archive ? 'archive' : (isUpdate ? 'update' : 'create');
    const msg = payload.archive 
      ? `Archived pipeline stage '${payload.label}' (code: ${cleanCode}) in pipeline ${payload.pipeline_id}`
      : `${isUpdate ? 'Updated' : 'Created'} pipeline stage '${payload.label}' (code: ${cleanCode}) in pipeline ${payload.pipeline_id}`;

    await logAlumniGrowthAudit(
      'alumni_pipeline_stage',
      null,
      action as any,
      msg
    );

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

    if (payload.amount_inr !== undefined) {
      if (payload.amount_inr <= 0) {
        return { success: false, error: 'Amount must be greater than 0' };
      }

      // Check remaining cap
      const adminSupabase = createAdminClient();
      const { data: capSetting } = await adminSupabase
        .from('org_settings')
        .select('value')
        .eq('key', 'pay_forward_cap_inr')
        .single();
      const cap = capSetting?.value ? Number(capSetting.value) : 120000;

      const { data: contributions } = await supabase
        .from('pay_forward_contributions')
        .select('amount_inr, contribution_types(is_monetary)')
        .eq('alumni_email', payload.alumni_email);

      let counted = 0;
      for (const row of contributions || []) {
        if ((row.contribution_types as any)?.is_monetary) {
          counted += row.amount_inr || 0;
        }
      }

      if (counted + payload.amount_inr > cap) {
        return { success: false, error: `Contribution exceeds the remaining cap. Remaining: ${Math.max(0, cap - counted)}` };
      }
    }

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

    const adminSupabase = createAdminClient();
    const { data: currentData } = await adminSupabase.from('org_settings').select('key, value');
    const currentSettings: Record<string, any> = {};
    if (currentData) {
      currentData.forEach(row => {
        try { 
          currentSettings[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value; 
        } catch {
          currentSettings[row.key] = row.value;
        }
      });
    }

    const changes: string[] = [];

    const tryUpdate = async (key: string, newVal: any, label: string, desc: string) => {
      if (newVal !== undefined && newVal !== currentSettings[key]) {
        const { error } = await adminSupabase.from('org_settings').upsert({
          key,
          value: JSON.stringify(newVal),
          description: desc,
          // Omitting updated_by to avoid foreign key violation if the admin is not an alumni
          updated_at: new Date().toISOString(),
        });
        
        if (error) {
          throw new Error(`Failed to update ${key}: ${error.message}`);
        }
        
        changes.push(`Updated ${label} from ${currentSettings[key] ?? 'none'} to ${newVal}`);
      }
    };

    await tryUpdate('pay_forward_cap_inr', payload.pay_forward_cap_inr, 'Pay-Forward cap', 'Lifetime pay-forward contribution considered complete (INR)');
    await tryUpdate('pay_forward_min_salary_monthly_inr', payload.pay_forward_min_salary_monthly_inr, 'minimum pitch salary floor', 'Minimum normalized monthly salary to pitch pay-forward (INR)');
    await tryUpdate('followup_cooldown_days', payload.followup_cooldown_days, 'follow-up cooldown', 'Default days before suggesting a re-attempt after no answer');
    await tryUpdate('active_criteria_coursera', payload.active_criteria_coursera, 'active criteria (Coursera)', 'Active member rule: Has active Coursera subscription');
    await tryUpdate('active_criteria_mentoring', payload.active_criteria_mentoring, 'active criteria (Mentoring)', 'Active member rule: Attended live mentoring sessions or workshops');
    await tryUpdate('active_criteria_watch_time', payload.active_criteria_watch_time, 'active criteria (Watch Time)', 'Active member rule: Logged watch hours from recorded video sessions');

    const weightsToUpsert: [string, any, string, string][] = [
      ['weight_name', payload.weight_name, 'Profile weight: Name', 'Profile score weight: Full Name'],
      ['weight_email', payload.weight_email, 'Profile weight: Email', 'Profile score weight: Email Address'],
      ['weight_phone', payload.weight_phone, 'Profile weight: Phone', 'Profile score weight: Phone Number'],
      ['weight_gender', payload.weight_gender, 'Profile weight: Gender', 'Profile score weight: Gender'],
      ['weight_campus', payload.weight_campus, 'Profile weight: Campus', 'Profile score weight: Campus'],
      ['weight_course', payload.weight_course, 'Profile weight: Course', 'Profile score weight: Course'],
      ['weight_entry_year', payload.weight_entry_year, 'Profile weight: Entry Cohort', 'Profile score weight: Entry Cohort'],
      ['weight_location', payload.weight_location, 'Profile weight: Location', 'Profile score weight: Location'],
      ['weight_company', payload.weight_company, 'Profile weight: Company', 'Profile score weight: Company'],
      ['weight_salary', payload.weight_salary, 'Profile weight: Salary', 'Profile score weight: Salary'],
      ['weight_linkedin', payload.weight_linkedin, 'Profile weight: LinkedIn', 'Profile score weight: LinkedIn'],
      ['weight_tech_stack', payload.weight_tech_stack, 'Profile weight: Tech Stack', 'Profile score weight: Tech Stack'],
      ['profile_score_red_threshold', payload.profile_score_red_threshold, 'Profile RED threshold', 'Profile score threshold for RED stage'],
      ['profile_score_amber_threshold', payload.profile_score_amber_threshold, 'Profile AMBER threshold', 'Profile score threshold for AMBER stage'],
      ['profile_score_green_threshold', payload.profile_score_green_threshold, 'Profile GREEN threshold', 'Profile score threshold for GREEN stage (100%)'],
    ];

    for (const [key, val, label, desc] of weightsToUpsert) {
      await tryUpdate(key, val, label, desc);
    }

    revalidatePath('/alumni-growth/settings');
    revalidatePath('/alumni-growth/workspace');
    revalidatePath('/engagement/settings');
    revalidatePath('/engagement/pipelines/pay-forward');

    if (changes.length > 0) {
      const summary = changes.join('; ');
      await logAlumniGrowthAudit(
        'alumni_org_settings',
        null,
        'update',
        summary
      );
    }

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
  is_substantive_conversation?: boolean;
  is_active?: boolean;
  archive?: boolean;
}) {
  try {
    const role = await getUserRole();
    if (role !== 'Admin' && role !== 'Super Admin') {
      return { success: false, error: 'Admin access required' };
    }

    const supabase = await createClient();
    const { data: existing } = await supabase.from('interaction_outcomes').select('id').eq('code', payload.code).maybeSingle();
    const isUpdate = !!existing;

    const { data, error } = await supabase.from('interaction_outcomes').upsert(
      {
        code: payload.code,
        label: payload.label,
        requires_followup_datetime: payload.requires_followup_datetime ?? false,
        is_terminal: payload.is_terminal ?? false,
        is_substantive_conversation: payload.is_substantive_conversation ?? false,
        is_custom: true,
        is_active: payload.is_active ?? true,
        archived_at: payload.archive ? new Date().toISOString() : null,
      },
      { onConflict: 'code' }
    );

    if (error) return { success: false, error: error.message };

    revalidatePath('/engagement/settings');
    revalidatePath('/alumni-growth/settings');
    
    const action = payload.archive ? 'archive' : (isUpdate ? 'update' : 'create');
    const msg = payload.archive 
      ? `Archived interaction outcome '${payload.label}' (code: ${payload.code})` 
      : `${isUpdate ? 'Updated' : 'Created'} interaction outcome '${payload.label}' (code: ${payload.code})`;

    await logAlumniGrowthAudit(
      'alumni_outcome',
      null,
      action as any,
      msg
    );
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
  archive?: boolean;
}) {
  try {
    const role = await getUserRole();
    if (role !== 'Admin' && role !== 'Super Admin') {
      return { success: false, error: 'Admin access required' };
    }

    const supabase = await createClient();
    const { data: existing } = await supabase.from('contribution_types').select('id').eq('code', payload.code).maybeSingle();
    const isUpdate = !!existing;

    const { data, error } = await supabase.from('contribution_types').upsert(
      {
        code: payload.code,
        label: payload.label,
        is_monetary: payload.is_monetary ?? false,
        is_custom: true,
        is_active: payload.is_active ?? true,
        archived_at: payload.archive ? new Date().toISOString() : null,
      },
      { onConflict: 'code' }
    );

    if (error) return { success: false, error: error.message };

    revalidatePath('/engagement/settings');
    revalidatePath('/alumni-growth/settings');
    
    const action = payload.archive ? 'archive' : (isUpdate ? 'update' : 'create');
    const msg = payload.archive 
      ? `Archived contribution type '${payload.label}' (code: ${payload.code})` 
      : `${isUpdate ? 'Updated' : 'Created'} contribution type '${payload.label}' (code: ${payload.code}, monetary: ${payload.is_monetary ?? false})`;

    await logAlumniGrowthAudit(
      'alumni_contribution_type',
      null,
      action as any,
      msg
    );
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

import { getKanbanColumnCards, getKanbanBoardCards, getPipelineEligibleStaff, getCallReasons, getPipelineListView } from './queries';

export async function getCallReasonsAction() {
  try {
    const reasons = await getCallReasons();
    return { success: true, data: reasons };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getPipelineEligibleStaffAction(pipelineCode: string) {
  try {
    const role = await getUserRole();
    if (!role) return { success: false, error: 'Unauthorized' };
    const staff = await getPipelineEligibleStaff(pipelineCode);
    return { success: true, data: staff };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getKanbanColumnCardsAction(
  pipelineCode: string,
  stageId: string,
  filters: { campus?: string; year?: string; supporter?: string; poc?: string },
  page: number = 1
) {
  try {
    const role = await getUserRole();
    const { userId } = await auth();
    const hasAccess = await checkAccess(userId, 'crm.workspace', 'view');
    if (!hasAccess && role !== 'Admin' && role !== 'Super Admin') {
      return { success: false, error: 'Unauthorized: insufficient permissions' };
    }
    
    const cards = await getKanbanColumnCards(pipelineCode, stageId, filters, page);
    return { success: true, data: cards };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getKanbanBoardCardsAction(
  pipelineCode: string,
  stages: any[],
  filters: { campus?: string; year?: string; supporter?: string; poc?: string }
) {
  try {
    const role = await getUserRole();
    const { userId } = await auth();
    const hasAccess = await checkAccess(userId, 'crm.workspace', 'view');
    if (!hasAccess && role !== 'Admin' && role !== 'Super Admin') {
      return { success: false, error: 'Unauthorized: insufficient permissions' };
    }
    
    // Fetch all cards for all stages at once, limit to 500 per stage to prevent memory overflow
    const cardsByStage = await getKanbanBoardCards(pipelineCode, stages, filters, 500);
    return { success: true, data: cardsByStage };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function transferPocAction(payload: {
  alumni_email: string;
  pipeline_code: string;
  new_poc_email: string;
  transferred_by: string;
  reason?: string;
}) {
  try {
    const supabase = await createClient();

    const targetPipelines = payload.pipeline_code === 'career_support' 
      ? ['mentoring', 'placement'] 
      : [payload.pipeline_code];

    const { data: pipelines } = await supabase
      .from('pipelines')
      .select('id, code')
      .in('code', targetPipelines);

    if (!pipelines || pipelines.length === 0) {
      return { success: false, error: 'Pipeline not found' };
    }

    // For career_support, checking eligibility on 'mentoring' is sufficient as they are paired
    const checkPipelineId = pipelines.find(p => p.code === (payload.pipeline_code === 'career_support' ? 'mentoring' : payload.pipeline_code))?.id || pipelines[0].id;

    const { data: eligibility } = await supabase
      .from('pipeline_poc_eligibility')
      .select('id')
      .eq('pipeline_id', checkPipelineId)
      .eq('staff_email', payload.new_poc_email)
      .eq('is_active', true)
      .single();

    if (!eligibility) {
      return { success: false, error: 'Selected staff member is not eligible to own leads in this pipeline' };
    }

    const pipelineIds = pipelines.map(p => p.id);

    const { data: memberships } = await supabase
      .from('alumni_pipeline_membership')
      .select('id, poc_email, pipeline_id')
      .eq('alumni_email', payload.alumni_email)
      .in('pipeline_id', pipelineIds);

    if (!memberships || memberships.length === 0) {
      return { success: false, error: 'Alumnus is not active in this pipeline' };
    }

    const role = await getUserRole();
    const isAdmin = role === 'Admin' || role === 'Super Admin';

    for (const membership of memberships) {
      if (!isAdmin && membership.poc_email !== payload.transferred_by) {
         return { success: false, error: 'Unauthorized: Only the current owner or an Admin can transfer this lead' };
      }
    }

    const membershipIds = memberships.map(m => m.id);

    const { error: updateErr } = await supabase
      .from('alumni_pipeline_membership')
      .update({ poc_email: payload.new_poc_email })
      .in('id', membershipIds);

    if (updateErr) {
      return { success: false, error: 'Failed to transfer lead' };
    }

    await supabase.from('audit_log').insert({
      record_id: payload.alumni_email,
      action_type: 'TRANSFER_POC',
      field_name: payload.pipeline_code,
      new_value: payload.new_poc_email,
      changed_by_user_id: payload.transferred_by,
      changed_at: new Date().toISOString(),
    });

    revalidatePath(`/alumni-growth/alumni/${encodeURIComponent(payload.alumni_email)}`);
    revalidatePath(`/engagement/alumni/${encodeURIComponent(payload.alumni_email)}`);
    if (payload.pipeline_code === 'career_support') {
      revalidatePath(`/alumni-growth/pipelines/mentoring`);
      revalidatePath(`/engagement/pipelines/mentoring`);
      revalidatePath(`/alumni-growth/pipelines/placement`);
      revalidatePath(`/engagement/pipelines/placement`);
    } else {
      revalidatePath(`/alumni-growth/pipelines/${payload.pipeline_code}`);
      revalidatePath(`/engagement/pipelines/${payload.pipeline_code}`);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unexpected error' };
  }
}

export async function saveOutcomeMappingAction(rows: OutcomeMappingRow[], actionType: 'create' | 'update' | 'delete', details: string) {
  try {
    const role = await getUserRole();
    if (role !== 'Admin' && role !== 'Super Admin') {
      return { success: false, error: 'Admin access required' };
    }

    const supabase = await createClient();
    const userEmail = await getSupabaseUserEmail();

    const { error } = await supabase.from('org_settings').upsert({
      key: 'outcome_mapping_rows',
      value: JSON.stringify(rows),
      description: 'Outcome mapping reference rows for legacy data migration',
      updated_by: userEmail || 'admin',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

    if (error) return { success: false, error: error.message };

    revalidatePath('/alumni-growth/settings');
    revalidatePath('/engagement/settings');

    await logAlumniGrowthAudit('alumni_outcome_mapping', null, actionType, details);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function manageCallReasonAction(payload: {
  id?: string;
  code: string;
  label: string;
  is_active?: boolean;
  archive?: boolean;
}) {
  try {
    const role = await getUserRole();
    if (role !== 'Admin' && role !== 'Super Admin') {
      return { success: false, error: 'Admin access required' };
    }

    const supabase = await createClient();
    
    if (payload.archive && payload.id) {
      const { error } = await supabase.from('call_reasons').delete().eq('id', payload.id);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from('call_reasons').upsert(
        {
          id: payload.id,
          code: payload.code,
          label: payload.label,
          is_active: payload.is_active ?? true,
        },
        { onConflict: 'code' }
      );
      if (error) return { success: false, error: error.message };
    }

    revalidatePath('/alumni-growth/settings');
    
    const action = payload.archive ? 'delete' : (payload.id ? 'update' : 'create');
    await logAlumniGrowthAudit('call_reasons', null, action as any, `Action ${action} on call reason ${payload.label}`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function managePipelinePocAction(payload: {
  id?: string;
  pipeline_id: string;
  staff_email: string;
  is_active?: boolean;
  archive?: boolean;
}) {
  try {
    const role = await getUserRole();
    if (role !== 'Admin' && role !== 'Super Admin') {
      return { success: false, error: 'Admin access required' };
    }

    const supabase = await createClient();
    
    if (payload.archive && payload.id) {
      const { error } = await supabase.from('pipeline_poc_eligibility').delete().eq('id', payload.id);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from('pipeline_poc_eligibility').upsert(
        {
          id: payload.id,
          pipeline_id: payload.pipeline_id,
          staff_email: payload.staff_email,
          is_active: payload.is_active ?? true,
        },
        { onConflict: 'pipeline_id,staff_email' }
      );
      if (error) return { success: false, error: error.message };
    }

    revalidatePath('/alumni-growth/settings');
    
    const action = payload.archive ? 'delete' : (payload.id ? 'update' : 'create');
    await logAlumniGrowthAudit('pipeline_poc_eligibility', null, action as any, `Action ${action} on pipeline POC ${payload.staff_email}`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getPipelineListViewAction(
  pipelineCode: string,
  filters: { campus?: string; year?: string; supporter?: string; poc?: string; stage?: string },
  sort: { field: 'name' | 'stage' | 'campus' | 'year' | 'poc'; direction: 'asc' | 'desc' },
  page: number,
  pageSize: number = 25
) {
  try {
    const role = await getUserRole();
    const { userId } = await auth();
    const hasAccess = await checkAccess(userId, 'crm.workspace', 'view');
    if (!hasAccess && role !== 'Admin' && role !== 'Super Admin') {
      return { success: false, error: 'Unauthorized: insufficient permissions' };
    }

    const { data, totalCount } = await getPipelineListView(pipelineCode, filters, sort, page, pageSize);
    return { success: true, data, totalCount };
  } catch (error: any) {
    console.error("Failed to fetch pipeline list view:", error);
    return { success: false, error: error.message };
  }
}

export async function assignToMeAction(payload: {
  alumni_email: string;
  pipeline_code: string;
  assigned_by: string;
}) {
  try {
    const supabase = await createClient();

    const targetPipelines = (payload.pipeline_code === 'career_support' || payload.pipeline_code === 'mentoring' || payload.pipeline_code === 'placement')
      ? ['mentoring', 'placement']
      : [payload.pipeline_code];

    const { data: pipelines } = await supabase
      .from('pipelines')
      .select('id, code')
      .in('code', targetPipelines);

    if (!pipelines || pipelines.length === 0) {
      return { success: false, error: 'Pipeline not found' };
    }

    const pipelineIds = pipelines.map(p => p.id);

    // Fetch target memberships
    const { data: memberships } = await supabase
      .from('alumni_pipeline_membership')
      .select('id, poc_email, pipeline_id')
      .eq('alumni_email', payload.alumni_email)
      .in('pipeline_id', pipelineIds)
      .eq('is_active', true);

    if (!memberships || memberships.length === 0) {
      return { success: false, error: 'Alumnus has no active membership in this pipeline' };
    }

    // Check race condition: if any membership already has a non-null poc_email
    const alreadyAssigned = memberships.find(m => m.poc_email !== null && m.poc_email !== '');
    if (alreadyAssigned) {
      return { success: false, error: `Already assigned to ${alreadyAssigned.poc_email}` };
    }

    const membershipIds = memberships.map(m => m.id);

    const { data: updated, error: updateErr } = await supabase
      .from('alumni_pipeline_membership')
      .update({ poc_email: payload.assigned_by })
      .in('id', membershipIds)
      .is('poc_email', null)
      .select('id');

    if (updateErr) {
      return { success: false, error: 'Failed to assign lead' };
    }

    if (!updated || updated.length < membershipIds.length) {
      return { success: false, error: 'This lead was just claimed by someone else — refresh and try again' };
    }


    await supabase.from('audit_log').insert({
      record_id: payload.alumni_email,
      action_type: 'ASSIGN_POC',
      field_name: payload.pipeline_code,
      new_value: payload.assigned_by,
      changed_by_user_id: payload.assigned_by,
      changed_at: new Date().toISOString(),
    });

    revalidatePath(`/alumni-growth/workspace`);
    revalidatePath(`/alumni-growth/alumni/${encodeURIComponent(payload.alumni_email)}`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unexpected error' };
  }
}

export async function getTeamAlumniAction(payload: { page: number; pageSize: number }) {
  try {
    const { userId } = await auth();
    const canView = await checkAccess(userId, 'crm.all_data', 'view');
    if (!canView) {
      return { success: false, error: 'Unauthorized: crm.all_data view permission required' };
    }
    const res = await getTeamAlumni({ page: payload.page, pageSize: payload.pageSize });
    return { success: true, ...res };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unexpected error' };
  }
}


