-- Audit trail for Coursera seat reclamation (prune-inactive)
create table if not exists public.coursera_removal_log (
  id              uuid primary key default gen_random_uuid(),
  run_id          uuid not null,
  removed_at      timestamptz not null default now(),
  removed_by      uuid references auth.users(id),
  mode            text not null check (mode in ('inactive_days', 'free_seats')),
  threshold       integer not null,          -- days or seats, per mode
  email           text not null,
  external_id     text not null,
  full_name       text,
  last_seen_at    timestamptz,
  last_seen_source text,
  days_inactive   integer,
  courses_count   integer,
  soft_delete     boolean not null,
  success         boolean not null,
  message         text
);

create index if not exists coursera_removal_log_run_idx on public.coursera_removal_log (run_id);
create index if not exists coursera_removal_log_email_idx on public.coursera_removal_log (email);
create index if not exists coursera_removal_log_removed_at_idx on public.coursera_removal_log (removed_at desc);

-- Service-role only; reads go through the API route's permission check.
alter table public.coursera_removal_log enable row level security;
