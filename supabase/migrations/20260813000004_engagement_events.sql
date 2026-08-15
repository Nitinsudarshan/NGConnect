-- ============================================================
-- NGConnect: Unified Engagement Events Schema & Ledger
-- Migration: 20260813000004_engagement_events.sql
-- Adds engagement_event_types lookup and alumni_engagement_events ledger
-- ============================================================

-- ---------- 1. Engagement Event Types Lookup ----------
CREATE TABLE IF NOT EXISTS public.engagement_event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  channel TEXT NOT NULL,
  label TEXT NOT NULL,
  default_score INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- 2. Alumni Engagement Events Append-Only Ledger ----------
CREATE TABLE IF NOT EXISTS public.alumni_engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_email TEXT NOT NULL REFERENCES public.alumni_master(email) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  event_type_id UUID NOT NULL REFERENCES public.engagement_event_types(id),
  related_entity_type TEXT,
  related_entity_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient querying by alumni, channel, and timeframe
CREATE INDEX IF NOT EXISTS idx_alumni_engagement_events_email_channel_occurred 
  ON public.alumni_engagement_events (alumni_email, channel, occurred_at DESC);

-- ---------- 3. Enable Row Level Security (RLS) ----------
ALTER TABLE public.engagement_event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_engagement_events ENABLE ROW LEVEL SECURITY;

-- RLS for engagement_event_types (Admin write / read)
DROP POLICY IF EXISTS "admin_all_engagement_event_types" ON public.engagement_event_types;
CREATE POLICY "admin_all_engagement_event_types" ON public.engagement_event_types
  FOR ALL TO authenticated
  USING ( (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Super Admin'::text, 'Admin'::text])) );

-- RLS for alumni_engagement_events
-- EXACTLY TWO POLICIES: SELECT (admin) and INSERT (admin/service).
-- Deliberately NO UPDATE or DELETE policy to enforce append-only ledger semantics.
DROP POLICY IF EXISTS "admin_select_alumni_engagement_events" ON public.alumni_engagement_events;
CREATE POLICY "admin_select_alumni_engagement_events" ON public.alumni_engagement_events
  FOR SELECT TO authenticated
  USING ( (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Super Admin'::text, 'Admin'::text])) );

DROP POLICY IF EXISTS "admin_service_insert_alumni_engagement_events" ON public.alumni_engagement_events;
CREATE POLICY "admin_service_insert_alumni_engagement_events" ON public.alumni_engagement_events
  FOR INSERT TO authenticated, service_role
  WITH CHECK (
    (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Super Admin'::text, 'Admin'::text]))
    OR (auth.role() = 'service_role')
  );

-- ---------- 4. Seed Initial Engagement Event Types ----------
INSERT INTO public.engagement_event_types (code, channel, label, default_score) VALUES
  ('email_sent', 'email', 'Email Sent', 5),
  ('email_opened', 'email', 'Email Opened', 10),
  ('call_substantive', 'call', 'Substantive Call Conversation', 80),
  ('platform_login', 'platform', 'Platform Login', 75),
  ('mentoring_session_attended', 'session', 'Mentoring Session Attended', 60),
  ('profile_updated', 'platform', 'Profile Details Updated', 40)
ON CONFLICT (code) DO NOTHING;

-- ---------- 5. Trigger: Substantive Call Event ----------
CREATE OR REPLACE FUNCTION public.log_substantive_call_event() RETURNS trigger AS $$
DECLARE
  is_substantive BOOLEAN;
  event_type_uuid UUID;
BEGIN
  -- Look up outcome's is_substantive_conversation flag
  SELECT is_substantive_conversation INTO is_substantive
  FROM public.interaction_outcomes
  WHERE id = NEW.outcome_id;

  IF is_substantive = TRUE THEN
    SELECT id INTO event_type_uuid
    FROM public.engagement_event_types
    WHERE code = 'call_substantive';

    IF event_type_uuid IS NOT NULL THEN
      INSERT INTO public.alumni_engagement_events (
        alumni_email,
        channel,
        event_type_id,
        related_entity_type,
        related_entity_id,
        occurred_at
      ) VALUES (
        NEW.alumni_email,
        'call',
        event_type_uuid,
        'alumni_interactions',
        NEW.id::text,
        NEW.created_at
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_substantive_call_event ON public.alumni_interactions;
CREATE TRIGGER trg_log_substantive_call_event
  AFTER INSERT ON public.alumni_interactions
  FOR EACH ROW EXECUTE FUNCTION public.log_substantive_call_event();

-- ---------- 6. Trigger: Mentoring Session Attendance Event ----------
CREATE OR REPLACE FUNCTION public.log_mentoring_attendance_event() RETURNS trigger AS $$
DECLARE
  event_type_uuid UUID;
  session_occurred_at TIMESTAMPTZ;
BEGIN
  IF NEW.attended = TRUE AND (TG_OP = 'INSERT' OR OLD.attended IS DISTINCT FROM TRUE) THEN
    SELECT COALESCE(scheduled_at, created_at) INTO session_occurred_at
    FROM public.mentoring_sessions
    WHERE id = NEW.session_id;

    SELECT id INTO event_type_uuid
    FROM public.engagement_event_types
    WHERE code = 'mentoring_session_attended';

    IF event_type_uuid IS NOT NULL AND NEW.alumni_email IS NOT NULL THEN
      INSERT INTO public.alumni_engagement_events (
        alumni_email,
        channel,
        event_type_id,
        related_entity_type,
        related_entity_id,
        occurred_at
      ) VALUES (
        NEW.alumni_email,
        'session',
        event_type_uuid,
        'mentoring_sessions',
        NEW.session_id::text,
        COALESCE(session_occurred_at, NOW())
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_mentoring_attendance_event ON public.mentoring_attendance;
CREATE TRIGGER trg_log_mentoring_attendance_event
  AFTER INSERT OR UPDATE ON public.mentoring_attendance
  FOR EACH ROW EXECUTE FUNCTION public.log_mentoring_attendance_event();
