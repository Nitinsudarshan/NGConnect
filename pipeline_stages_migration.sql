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

-- Pay-Forward stages (unchanged vocabulary, now formalized as rows)
insert into pipeline_stages (pipeline_id, code, label, sort_order, is_terminal)
select id, 'paid', 'Paid', 1, true from pipelines where code = 'pay_forward'
union all
select id, 'communicated', 'Communicated', 2, false from pipelines where code = 'pay_forward'
union all
select id, 'waiting', 'Waiting', 3, false from pipelines where code = 'pay_forward'
union all
select id, 'not_paying_right_now', 'Not Paying Right Now', 4, false from pipelines where code = 'pay_forward'
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
