-- Migration: 20260813000002_email_notifications_system.sql
-- Email Notifications System Schema & Initial Seed Data

-- 1. Templates Table
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  module text NOT NULL CHECK (module IN ('crm', 'learning_center')),
  subject_template text NOT NULL,
  body_html_template text NOT NULL,
  variables_hint text,
  is_active boolean NOT NULL DEFAULT true,
  archived_at timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Trigger Definitions Table
CREATE TABLE IF NOT EXISTS public.notification_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  module text NOT NULL CHECK (module IN ('crm', 'learning_center')),
  event_type text NOT NULL CHECK (event_type IN
    ('pipeline_stage_change', 'interaction_outcome_logged', 'followup_due', 'session_reminder', 'session_cancelled', 'custom')),
  conditions jsonb NOT NULL DEFAULT '{}',
  template_id uuid NOT NULL REFERENCES public.notification_templates(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Notification Queue Table
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id uuid REFERENCES public.notification_triggers(id) ON DELETE SET NULL,
  alumni_email text REFERENCES public.alumni_master(email) ON DELETE CASCADE,
  related_entity_type text,
  related_entity_id uuid,
  context jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped_suppressed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

-- 4. Durable Send Log Table
CREATE TABLE IF NOT EXISTS public.notification_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid REFERENCES public.notification_queue(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.notification_templates(id) ON DELETE SET NULL,
  trigger_id uuid REFERENCES public.notification_triggers(id) ON DELETE SET NULL,
  alumni_email text REFERENCES public.alumni_master(email) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  subject_rendered text,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  skip_reason text CHECK (skip_reason IN ('unsubscribed', 'do_not_contact', 'inactive_email', 'duplicate_recent_send')),
  error_message text,
  provider text NOT NULL DEFAULT 'dry_run',
  provider_message_id text,
  tracking_token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  opened_at timestamptz,
  open_count int NOT NULL DEFAULT 0,
  bounced_at timestamptz,
  bounce_reason text,
  logged_interaction_id uuid REFERENCES public.alumni_interactions(id) ON DELETE SET NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Extend alumni_contact_suppression with channel column
ALTER TABLE public.alumni_contact_suppression
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'all' CHECK (channel IN ('all', 'email', 'call'));

-- 6. Per-Channel Activity Rollup Table
CREATE TABLE IF NOT EXISTS public.alumni_channel_activity (
  alumni_email text NOT NULL REFERENCES public.alumni_master(email) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email', 'call')),
  last_positive_signal_at timestamptz,
  status text NOT NULL DEFAULT 'unknown' CHECK (status IN ('active', 'inactive', 'unknown')),
  computed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (alumni_email, channel)
);

-- 7. Provider / Settings Config (Single Row)
CREATE TABLE IF NOT EXISTS public.notification_provider_settings (
  id int PRIMARY KEY DEFAULT 1,
  active_provider text NOT NULL DEFAULT 'dry_run'
    CHECK (active_provider IN ('dry_run', 'ethereal', 'gmail_smtp', 'ses', 'resend')),
  from_name text NOT NULL DEFAULT 'NGConnect',
  from_email text,
  reply_to text,
  sandbox_mode boolean NOT NULL DEFAULT true,
  sandbox_redirect_email text,
  kill_switch boolean NOT NULL DEFAULT false,
  ses_region text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (id = 1)
);

INSERT INTO public.notification_provider_settings (id, active_provider, from_name, sandbox_mode)
VALUES (1, 'dry_run', 'NGConnect', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_provider_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_channel_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Admin / Super Admin
DROP POLICY IF EXISTS "admin_write_notification_templates" ON public.notification_templates;
CREATE POLICY "admin_write_notification_templates" ON public.notification_templates
  FOR ALL TO authenticated
  USING ( (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Super Admin'::text, 'Admin'::text])) );

DROP POLICY IF EXISTS "admin_write_notification_triggers" ON public.notification_triggers;
CREATE POLICY "admin_write_notification_triggers" ON public.notification_triggers
  FOR ALL TO authenticated
  USING ( (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Super Admin'::text, 'Admin'::text])) );

DROP POLICY IF EXISTS "admin_write_notification_queue" ON public.notification_queue;
CREATE POLICY "admin_write_notification_queue" ON public.notification_queue
  FOR ALL TO authenticated
  USING ( (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Super Admin'::text, 'Admin'::text])) );

DROP POLICY IF EXISTS "admin_write_notification_sends" ON public.notification_sends;
CREATE POLICY "admin_write_notification_sends" ON public.notification_sends
  FOR ALL TO authenticated
  USING ( (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Super Admin'::text, 'Admin'::text])) );

DROP POLICY IF EXISTS "admin_write_notification_provider_settings" ON public.notification_provider_settings;
CREATE POLICY "admin_write_notification_provider_settings" ON public.notification_provider_settings
  FOR ALL TO authenticated
  USING ( (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Super Admin'::text, 'Admin'::text])) );

DROP POLICY IF EXISTS "admin_write_alumni_channel_activity" ON public.alumni_channel_activity;
CREATE POLICY "admin_write_alumni_channel_activity" ON public.alumni_channel_activity
  FOR ALL TO authenticated
  USING ( (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Super Admin'::text, 'Admin'::text])) );

-- 8. Seed Initial Templates and Triggers
INSERT INTO public.notification_templates (code, module, subject_template, body_html_template, variables_hint) VALUES
('crm_pay_forward_intro', 'crm', 'Welcome to NGConnect Pay-Forward Program, {{alumni_name}}', '<p>Hi {{alumni_name}},</p><p>Thank you for participating in our Pay-Forward initiative. We are excited to partner with you in helping fellow alumni!</p><p>Best regards,<br>NGConnect Team</p>', 'alumni_name'),
('crm_pay_forward_paused', 'crm', 'NGConnect Pay-Forward: Check-in & Updates', '<p>Hi {{alumni_name}},</p><p>We noticed your Pay-Forward activity is currently paused. Please let us know if you need any support or wish to resume.</p><p>Warm regards,<br>NGConnect Team</p>', 'alumni_name'),
('crm_callback_confirmation', 'crm', 'Callback Request Confirmed — NGConnect', '<p>Hi {{alumni_name}},</p><p>We have received your request for a callback. A team member will reach out to you soon.</p><p>Best regards,<br>NGConnect Team</p>', 'alumni_name'),
('lc_session_reminder', 'learning_center', 'Reminder: Upcoming Session - {{session_title}}', '<p>Hi {{alumni_name}},</p><p>This is a reminder that your session <strong>{{session_title}}</strong> starts at {{session_time}}.</p><p><a href="{{session_link}}">Join Session Here</a></p>', 'alumni_name, session_title, session_time, session_link'),
('lc_session_cancelled', 'learning_center', 'Notice: {{session_title}} Session Cancelled', '<p>Hi {{alumni_name}},</p><p>Please note that the upcoming session <strong>{{session_title}}</strong> has been cancelled.</p><p>We apologize for the inconvenience.</p>', 'alumni_name, session_title')
ON CONFLICT (code) DO UPDATE SET
  subject_template = EXCLUDED.subject_template,
  body_html_template = EXCLUDED.body_html_template,
  variables_hint = EXCLUDED.variables_hint;

-- Seed Triggers
INSERT INTO public.notification_triggers (code, module, event_type, conditions, template_id, is_active)
SELECT 'trg_pay_forward_communicated', 'crm', 'pipeline_stage_change', '{"target_stage": "communicated", "pipeline": "pay_forward"}'::jsonb, id, true
FROM public.notification_templates WHERE code = 'crm_pay_forward_intro'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.notification_triggers (code, module, event_type, conditions, template_id, is_active)
SELECT 'trg_pay_forward_paused', 'crm', 'pipeline_stage_change', '{"target_stage": "paused_expected_return", "pipeline": "pay_forward"}'::jsonb, id, true
FROM public.notification_templates WHERE code = 'crm_pay_forward_paused'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.notification_triggers (code, module, event_type, conditions, template_id, is_active)
SELECT 'trg_callback_requested', 'crm', 'interaction_outcome_logged', '{"outcome": "replied_requested_callback"}'::jsonb, id, true
FROM public.notification_templates WHERE code = 'crm_callback_confirmation'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.notification_triggers (code, module, event_type, conditions, template_id, is_active)
SELECT 'trg_session_reminder_24h', 'learning_center', 'session_reminder', '{"hours_before": 24}'::jsonb, id, true
FROM public.notification_templates WHERE code = 'lc_session_reminder'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.notification_triggers (code, module, event_type, conditions, template_id, is_active)
SELECT 'trg_session_cancelled', 'learning_center', 'session_cancelled', '{}'::jsonb, id, true
FROM public.notification_templates WHERE code = 'lc_session_cancelled'
ON CONFLICT (code) DO NOTHING;
