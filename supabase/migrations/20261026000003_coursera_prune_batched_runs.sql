-- ============================================================
-- Migration: 20261026000003_coursera_prune_batched_runs.sql
-- Coursera prune-inactive: saved prune lists and batched, resumable prunes.
-- ============================================================
-- A prune now runs a few members per request from a saved preview, logging
-- each member as it is handled, so a run that stops can be resumed.
-- Depends on 20261026000002_coursera_prune_scan_members.sql. Safe to re-run.
-- ============================================================

-- What happened to each member in a run: removed, failed, or spared
-- (became active or protected since the preview). success stays true only for removed.
alter table public.coursera_removal_log
  add column if not exists outcome text check (outcome in ('removed', 'failed', 'spared'));

-- A member is handled at most once per run.
create unique index if not exists coursera_removal_log_run_email_idx
  on public.coursera_removal_log (run_id, email);

-- Short lease so two tabs can't process the same scan or prune batch at once.
alter table public.coursera_prune_runs
  add column if not exists step_lock_until timestamptz;
