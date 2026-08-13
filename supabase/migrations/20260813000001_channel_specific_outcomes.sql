-- 1. Create alumni_contact_suppression (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.alumni_contact_suppression (
  alumni_email text primary key references public.alumni_master(email) on delete cascade,
  suppressed_since timestamptz not null default now(),
  set_by_interaction_id uuid references public.alumni_interactions(id)
);

-- Add reason column to alumni_contact_suppression
ALTER TABLE public.alumni_contact_suppression ADD COLUMN IF NOT EXISTS reason TEXT;

-- 2. Update the trigger function to handle invalid_number and update on conflict
CREATE OR REPLACE FUNCTION public.apply_do_not_contact() RETURNS trigger AS $$
DECLARE
  outcome_code TEXT;
BEGIN
  SELECT code INTO outcome_code FROM interaction_outcomes WHERE id = NEW.outcome_id;
  
  IF outcome_code = 'do_not_contact' THEN
    INSERT INTO alumni_contact_suppression (alumni_email, set_by_interaction_id, reason)
    VALUES (NEW.alumni_email, NEW.id, 'do_not_contact')
    ON CONFLICT (alumni_email) DO UPDATE 
      SET reason = EXCLUDED.reason, 
          set_by_interaction_id = EXCLUDED.set_by_interaction_id,
          suppressed_since = NOW();
          
  ELSIF outcome_code = 'invalid_number' THEN
    INSERT INTO alumni_contact_suppression (alumni_email, set_by_interaction_id, reason)
    VALUES (NEW.alumni_email, NEW.id, 'invalid_number')
    ON CONFLICT (alumni_email) DO UPDATE 
      SET reason = EXCLUDED.reason, 
          set_by_interaction_id = EXCLUDED.set_by_interaction_id,
          suppressed_since = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS trg_apply_do_not_contact ON public.alumni_interactions;
CREATE TRIGGER trg_apply_do_not_contact
  AFTER INSERT ON public.alumni_interactions
  FOR EACH ROW EXECUTE FUNCTION public.apply_do_not_contact();

-- 3. Insert new outcomes
INSERT INTO public.interaction_outcomes (code, label, requires_followup_datetime, is_substantive_conversation) VALUES
  ('invalid_number', 'Invalid / wrong number', false, false),
  ('do_not_contact', 'Requested no further contact — any pipeline', false, false),
  ('connected_declined', 'Connected — declined', false, false),
  ('connected_not_interested', 'Connected — not interested', false, false),
  ('replied_requested_callback', 'Replied — requested callback', false, false),
  ('replied_not_interested', 'Replied — not interested', false, false),
  ('replied_pipeline_add', 'Replied — to be added to a pipeline', false, true),
  ('email_received', 'Received on Inbox', false, true),
  ('email_sent', 'Sent from platform', false, false)
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label, 
  is_substantive_conversation = EXCLUDED.is_substantive_conversation;

-- 4. Deprecate removed outcomes
UPDATE public.interaction_outcomes SET is_active = false WHERE code IN ('salary_undisclosed', 'left_voicemail', 'declined_not_interested');
UPDATE public.interaction_outcomes SET is_substantive_conversation = true WHERE code = 'discussed';
