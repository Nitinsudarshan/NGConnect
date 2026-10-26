-- ============================================================
-- Migration: 20261026000001_coursera_prune_runs.sql
-- Coursera prune-inactive: run log (scans, previews, executions),
-- protected accounts, and the RBAC resource that gates the tool.
-- ============================================================
-- Depends on 20261026000000_coursera_removal_log.sql.
-- Safe to re-run: IF NOT EXISTS everywhere, RBAC seeds are ON CONFLICT DO NOTHING.
-- ============================================================

-- Every overview scan, preview, and execution. Previews keep their full
-- candidate list so an execution can be checked against what was reviewed.
create table if not exists public.coursera_prune_runs (
  id                uuid primary key default gen_random_uuid(),
  kind              text not null check (kind in ('scan', 'preview', 'execute')),
  created_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id),
  created_by_email  text,
  mode              text check (mode in ('inactive_days', 'free_seats')),
  threshold         integer,                    -- days or seats, per mode
  grace_days        integer,
  soft_delete       boolean,                    -- executions only
  total_members     integer,
  eligible_members  integer,
  candidate_count   integer,
  succeeded         integer,
  failed            integer,
  spared            integer,
  preview_id        uuid references public.coursera_prune_runs(id),   -- execution -> its preview
  executed_run_id   uuid references public.coursera_prune_runs(id),   -- preview -> its execution (single use)
  details           jsonb not null default '{}'::jsonb,
  -- A days-based prune never goes below 90 days, whatever the caller sends.
  constraint coursera_prune_runs_min_days check (mode is distinct from 'inactive_days' or threshold >= 90)
);

create index if not exists coursera_prune_runs_kind_created_idx on public.coursera_prune_runs (kind, created_at desc);
create unique index if not exists coursera_prune_runs_preview_once_idx
  on public.coursera_prune_runs (preview_id) where kind = 'execute';

alter table public.coursera_prune_runs enable row level security;

-- Each removal row belongs to an execution run.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'coursera_removal_log_run_fk'
  ) then
    alter table public.coursera_removal_log
      add constraint coursera_removal_log_run_fk
      foreign key (run_id) references public.coursera_prune_runs(id);
  end if;
end $$;

-- Accounts that prune runs must never remove (staff, test accounts, etc.).
create table if not exists public.coursera_prune_protected (
  email           text primary key check (email = lower(email)),
  note            text,
  added_at        timestamptz not null default now(),
  added_by        uuid references auth.users(id),
  added_by_email  text
);

alter table public.coursera_prune_protected enable row level security;

-- Service-role only for all three tables; reads go through the API routes' RBAC checks.

-- ── RBAC: data_management.coursera_prune ──
-- view   = open the page, overview, history, download removal lists
-- edit   = run previews, prune (soft delete), manage protected accounts
-- delete = permanent (hard) delete
DO $$
DECLARE
  grant_row RECORD;
BEGIN
  FOR grant_row IN
    SELECT * FROM (VALUES
      ('data_management.coursera_prune', 'Super Admin', true, true,  true ),
      ('data_management.coursera_prune', 'Admin',       true, true,  true ),
      ('data_management.coursera_prune', 'Program',     true, true,  true ),
      ('data_management.coursera_prune', 'Manager',     true, false, false),
      ('data_management.coursera_prune', 'Operations',  true, false, false)
    ) AS t(resource_id, role_name, can_view, can_edit, can_delete)
  LOOP
    INSERT INTO public.rbac_permissions (resource_id, subject_type, subject_id, can_view, can_edit, can_delete)
    VALUES (grant_row.resource_id, 'role', grant_row.role_name, grant_row.can_view, grant_row.can_edit, grant_row.can_delete)
    ON CONFLICT (resource_id, subject_type, subject_id) DO NOTHING;
  END LOOP;
END $$;
