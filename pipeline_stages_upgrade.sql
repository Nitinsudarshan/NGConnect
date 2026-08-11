-- ============================================================
-- NGConnect upgrade: per-pipeline configurable stages
-- Run AFTER the original Alumni Engagement CRM migration.
-- Purely additive: new table + one nullable FK column. Nothing
-- existing is dropped, renamed, or made non-nullable.
-- ============================================================

create table if not exists pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references pipelines(id),
  code text not null,
  label text not null,
  sort_order int not null default 0,
  is_terminal boolean not null default false,
  is_custom boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (pipeline_id, code)
);

-- Pay-Forward stages — expanded from the original 4-stage list (see §6 below for why).
-- 'not_eligible' is intentionally non-terminal: alumni move out of it automatically
-- whenever a new salary record crosses the configured floor (trigger further down).
insert into pipeline_stages (pipeline_id, code, label, sort_order, is_terminal)
select id, 'not_eligible', 'Not eligible (below salary threshold)', 0, false from pipelines where code = 'pay_forward'
union all
select id, 'eligible_not_contacted', 'Eligible, not yet contacted', 1, false from pipelines where code = 'pay_forward'
union all
select id, 'communicated', 'Communicated — discussion in progress', 2, false from pipelines where code = 'pay_forward'
union all
select id, 'committed_not_started', 'Committed — first payment pending', 3, false from pipelines where code = 'pay_forward'
union all
select id, 'paying_monthly', 'Paying — regular monthly', 4, false from pipelines where code = 'pay_forward'
union all
select id, 'paying_irregular', 'Paying — irregular / inconsistent', 5, false from pipelines where code = 'pay_forward'
union all
select id, 'paused_expected_return', 'Paused — expects to resume', 6, false from pipelines where code = 'pay_forward'
union all
select id, 'not_paying_no_plan', 'Not paying — no resume plan', 7, false from pipelines where code = 'pay_forward'
union all
select id, 'unreachable', 'Lost contact / unreachable', 8, false from pipelines where code = 'pay_forward'
union all
select id, 'declined_opted_out', 'Declined / opted out', 9, true from pipelines where code = 'pay_forward'
union all
select id, 'completed', 'Completed (target contribution reached)', 10, true from pipelines where code = 'pay_forward'
union all
select id, 'completed_continuing', 'Completed — still contributing beyond cap', 11, false from pipelines where code = 'pay_forward'
on conflict (pipeline_id, code) do nothing;

-- Mentoring stages
insert into pipeline_stages (pipeline_id, code, label, sort_order, is_terminal)
select id, 'needs_assessment', 'Needs assessment', 1, false from pipelines where code = 'mentoring'
union all
select id, 'matched_with_mentor', 'Matched with mentor', 2, false from pipelines where code = 'mentoring'
union all
select id, 'in_session', 'In session', 3, false from pipelines where code = 'mentoring'
union all
select id, 'closed', 'Closed', 4, true from pipelines where code = 'mentoring'
on conflict (pipeline_id, code) do nothing;

-- Placement stages
insert into pipeline_stages (pipeline_id, code, label, sort_order, is_terminal)
select id, 'needs_identified', 'Needs identified', 1, false from pipelines where code = 'placement'
union all
select id, 'searching_matched', 'Actively searching / matched to opportunity', 2, false from pipelines where code = 'placement'
union all
select id, 'interviewing', 'Interviewing', 3, false from pipelines where code = 'placement'
union all
select id, 'placed', 'Placed', 4, true from pipelines where code = 'placement'
union all
select id, 'not_placed_closed', 'Not placed (closed)', 5, true from pipelines where code = 'placement'
on conflict (pipeline_id, code) do nothing;

-- Link alumni_pipeline_membership to a stage without breaking the existing free-text status column.
-- stage_id is nullable so existing rows keep working; the app should prefer stage_id going
-- forward and treat the free-text `status` column as a fallback for any custom/unlisted stage.
alter table alumni_pipeline_membership
  add column if not exists stage_id uuid references pipeline_stages(id);

create index if not exists idx_pipeline_stages_pipeline on pipeline_stages(pipeline_id);
create index if not exists idx_membership_stage on alumni_pipeline_membership(stage_id);

-- Auto-move an alumnus out of 'not_eligible' the moment a new salary record
-- crosses the configured monthly floor. Never auto-moves them further than
-- 'eligible_not_contacted' — staff still decide when to actually reach out.
create or replace function reevaluate_pay_forward_eligibility() returns trigger as $$
declare
  floor_inr numeric;
  pf_pipeline_id uuid;
  not_eligible_stage_id uuid;
  eligible_stage_id uuid;
  membership_id uuid;
  current_stage_code text;
begin
  select (value#>>'{}')::numeric into floor_inr
  from org_settings where key = 'pay_forward_min_salary_monthly_inr';

  if new.amount_monthly_inr < floor_inr then
    return new; -- still below floor, nothing to do
  end if;

  select id into pf_pipeline_id from pipelines where code = 'pay_forward';

  select apm.id, ps.code into membership_id, current_stage_code
  from alumni_pipeline_membership apm
  left join pipeline_stages ps on ps.id = apm.stage_id
  where apm.alumni_email = new.alumni_email and apm.pipeline_id = pf_pipeline_id;

  if membership_id is null then
    -- not in the pipeline yet at all: leave to the app's suggested-add flow, don't force-add
    return new;
  end if;

  if current_stage_code = 'not_eligible' then
    select id into eligible_stage_id from pipeline_stages
    where pipeline_id = pf_pipeline_id and code = 'eligible_not_contacted';

    update alumni_pipeline_membership
    set stage_id = eligible_stage_id
    where id = membership_id;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_reevaluate_eligibility
  after insert on alumni_salary_records
  for each row execute function reevaluate_pay_forward_eligibility();


-- ============================================================
-- NGConnect upgrade: expanded interaction_outcomes + contribution_types
-- Run AFTER the original migration and the pipeline_stages migration above.
-- Additive only — no existing codes are removed or renamed.
-- ============================================================

insert into interaction_outcomes (code, label, requires_followup_datetime, is_terminal) values
  ('left_voicemail', 'Connected to voicemail — message left', false, false),
  ('do_not_contact', 'Requested no further contact — any pipeline', false, true)
on conflict (code) do nothing;


insert into contribution_types (code, label, is_monetary) values
  ('employer_matching_gift', 'Employer matching gift (on a monetary contribution)', true),
  ('goods_in_kind', 'Goods/equipment donated', false)
on conflict (code) do nothing;


create table if not exists alumni_contact_suppression (
  alumni_email text primary key references alumni_master(email) on delete cascade,
  suppressed_since timestamptz not null default now(),
  set_by_interaction_id uuid references alumni_interactions(id)
);

create or replace function apply_do_not_contact() returns trigger as $$
declare
  outcome_code text;
begin
  select code into outcome_code from interaction_outcomes where id = new.outcome_id;
  if outcome_code = 'do_not_contact' then
    insert into alumni_contact_suppression (alumni_email, set_by_interaction_id)
    values (new.alumni_email, new.id)
    on conflict (alumni_email) do nothing;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_apply_do_not_contact
  after insert on alumni_interactions
  for each row execute function apply_do_not_contact();
