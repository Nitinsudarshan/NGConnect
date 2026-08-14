export interface OrgSettings {
  pay_forward_cap_inr: number;
  pay_forward_min_salary_monthly_inr: number;
  followup_cooldown_days: number;
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
}

/** A row in the outcome-mapping reference table (stored as JSON in org_settings). */
export interface OutcomeMappingRow {
  id: string;           // client-generated UUID
  source: string;       // e.g. "Placement Dashboard"
  old_value: string;    // e.g. "No Response"
  new_code: string;     // e.g. "no_answer"
  note: string;         // optional admin note
}

export const DEFAULT_OUTCOME_MAPPINGS: OutcomeMappingRow[] = [
  { id: 'om-1', source: 'Placement Dashboard', old_value: 'No Response', new_code: 'no_answer', note: '' },
  { id: 'om-2', source: 'Placement Dashboard', old_value: 'Call Back', new_code: 'callback_requested', note: '' },
  { id: 'om-3', source: 'Placement Dashboard', old_value: 'Did Not Connect', new_code: 'no_answer', note: '' },
  { id: 'om-4', source: 'Placement Dashboard', old_value: 'Discussed', new_code: 'discussed', note: '' },
  { id: 'om-5', source: 'Placement Dashboard', old_value: 'Invalid Number', new_code: 'invalid_number', note: '' },
  { id: 'om-6', source: 'Pay-Forward Data sheet', old_value: '(free text — not auto-mapped)', new_code: 'discussed / no_answer / callback_requested', note: 'Review manually' },
  { id: 'om-7', source: 'Pay-Forward Data sheet', old_value: "(free text mentioning 'don't contact again')", new_code: 'do_not_contact', note: 'Human review only — not auto-classified' },
  { id: 'om-8', source: 'N/A — new code', old_value: '(no historical source)', new_code: 'left_voicemail', note: 'Only applies going forward' },
];

export interface ContributionType {
  id: string;
  code: string;
  label: string;
  is_monetary: boolean;
  is_active: boolean;
  is_custom: boolean;
  created_at?: string;
  archived_at?: string | null;
}

export interface InteractionOutcome {
  id: string;
  code: string;
  label: string;
  requires_followup_datetime: boolean;
  is_terminal: boolean;
  is_substantive_conversation: boolean;
  is_custom: boolean;
  is_active: boolean;
  created_at?: string;
  archived_at?: string | null;
}

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  code: string;
  label: string;
  sort_order: number;
  is_terminal: boolean;
  is_custom: boolean;
  is_active: boolean;
  requires_outcome: boolean;
  created_at?: string;
  archived_at?: string | null;
}

export interface Pipeline {
  id: string;
  code: 'pay_forward' | 'mentoring' | 'placement' | string;
  label: string;
  is_active: boolean;
}

export interface CallReason {
  id: string;
  code: string;
  label: string;
  is_active: boolean;
  sort_order?: number;
  created_at?: string;
}

export interface PipelinePocEligibility {
  id: string;
  pipeline_id: string;
  staff_email: string;
  is_active: boolean;
  created_at?: string;
}

export interface AlumniPipelineMembership {
  id: string;
  alumni_email: string;
  pipeline_id: string;
  stage_id?: string | null;
  status: string;
  added_at: string;
  added_by: string | null;
  is_active: boolean;
  poc_email?: string | null;
  pipelines?: Pipeline;
  pipeline_stages?: PipelineStage | null;
}

export interface AlumniInteraction {
  id: string;
  alumni_email: string;
  logged_by: string;
  interaction_channel: string;
  outcome_id: string;
  call_reason_id?: string | null;
  notes: string | null;
  mentoring_interest: boolean | null;
  placement_interest: boolean | null;
  pay_forward_interest: boolean | null;
  followup_at: string | null;
  followup_assigned_to: string | null;
  followup_completed: boolean;
  created_at: string;
  interaction_outcomes?: InteractionOutcome;
  support_areas?: string[];
}

export interface AlumniSalaryRecord {
  id: string;
  alumni_email: string;
  amount: number;
  unit: 'monthly' | 'lpa';
  amount_monthly_inr: number;
  recorded_by: string | null;
  recorded_at: string;
  source_interaction_id: string | null;
}

export interface PayForwardContribution {
  id: string;
  alumni_email: string;
  contribution_type_id: string;
  amount_inr: number | null;
  non_monetary_detail: string | null;
  contributed_at: string;
  recorded_by: string | null;
  source_interaction_id: string | null;
  contribution_types?: ContributionType;
}

export interface Mentor {
  id: string;
  name: string;
  email: string | null;
  areas: string[] | null;
  sourced_by: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface MentoringSession {
  id: string;
  mentor_id: string | null;
  alumni_pipeline_membership_id: string | null;
  scheduled_at: string | null;
  topic: string | null;
  status: string;
  created_at?: string;
  mentors?: Mentor;
}

export interface PayForwardProgress {
  alumni_email: string;
  counted_toward_cap: number;
  lifetime_monetary_total: number;
  cap_inr: number;
}

export interface ProfileCompleteness {
  alumni_email: string;
  missing_linkedin: boolean;
  missing_company: boolean;
  missing_salary: boolean;
}

export interface PipelineSuggestion {
  pipelineCode: 'pay_forward' | 'mentoring' | 'placement';
  pipelineLabel: string;
  reason: string;
}

export interface LogInteractionPayload {
  alumni_email: string;
  logged_by: string;
  interaction_channel?: string;
  outcome_id: string;
  call_reason_id?: string;
  notes?: string;
  mentoring_interest?: boolean;
  placement_interest?: boolean;
  pay_forward_interest?: boolean;
  support_areas?: ('mentor' | 'skill_improvement' | 'career_guidance')[];
  followup_at?: string | null;
  followup_assigned_to?: string | null;
  salary_amount?: number;
  salary_unit?: 'monthly' | 'lpa';
  updated_company?: string;
  updated_linkedin?: string;
  skipped_missing_fields?: string[];
  skip_reason?: string;
}

export type PipelineOwnershipState = 'owned' | 'unassigned' | 'n/a';

export interface PipelineOwnership {
  payForward: {
    state: PipelineOwnershipState;
    owner: string | null;
  };
  careerSupport: {
    state: PipelineOwnershipState;
    owner: string | null;
    mismatch: boolean;
  };
}

