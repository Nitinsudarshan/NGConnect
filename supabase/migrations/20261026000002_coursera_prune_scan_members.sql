-- ============================================================
-- Migration: 20261026000002_coursera_prune_scan_members.sql
-- Coursera prune-inactive: live member checks run in small batches.
-- ============================================================
-- A scan reads the program's member list from Coursera, then checks each
-- member's last activity live, a batch per request, so no single request
-- runs into the platform timeout. Progress lives here.
-- Depends on 20261026000001_coursera_prune_runs.sql. Safe to re-run.
-- ============================================================

alter table public.coursera_prune_runs
  add column if not exists status        text check (status in ('running', 'done', 'failed')),
  add column if not exists checked_count integer,
  add column if not exists completed_at  timestamptz;

create table if not exists public.coursera_prune_scan_members (
  scan_id                 uuid not null references public.coursera_prune_runs(id) on delete cascade,
  external_id             text not null,
  email                   text not null,
  full_name               text,
  joined_at               timestamptz,
  checked_at              timestamptz,             -- null = not checked yet
  attempts                integer not null default 0,
  lookup_ok               boolean,                 -- false = Coursera never answered for this member
  latest_activity_at      timestamptz,
  earliest_enrollment_at  timestamptz,
  courses_count           integer,
  primary key (scan_id, external_id)
);

create index if not exists coursera_prune_scan_members_pending_idx
  on public.coursera_prune_scan_members (scan_id) where checked_at is null;

-- Service-role only; reads go through the API routes' RBAC checks.
alter table public.coursera_prune_scan_members enable row level security;
