-- Migration: 20260813000003_suppression_channel_fix.sql
-- Fix suppression scope downgrade & backfill legacy all-channel suppressions

-- 1. Update apply_do_not_contact() trigger function to explicitly set and maintain channel = 'all'
CREATE OR REPLACE FUNCTION public.apply_do_not_contact() RETURNS trigger AS $$
DECLARE
  outcome_code TEXT;
BEGIN
  SELECT code INTO outcome_code FROM interaction_outcomes WHERE id = NEW.outcome_id;
  
  IF outcome_code = 'do_not_contact' THEN
    INSERT INTO alumni_contact_suppression (alumni_email, set_by_interaction_id, reason, channel)
    VALUES (NEW.alumni_email, NEW.id, 'do_not_contact', 'all')
    ON CONFLICT (alumni_email) DO UPDATE 
      SET channel = 'all',
          reason = EXCLUDED.reason, 
          set_by_interaction_id = EXCLUDED.set_by_interaction_id,
          suppressed_since = NOW();
          
  ELSIF outcome_code = 'invalid_number' THEN
    INSERT INTO alumni_contact_suppression (alumni_email, set_by_interaction_id, reason, channel)
    VALUES (NEW.alumni_email, NEW.id, 'invalid_number', 'all')
    ON CONFLICT (alumni_email) DO UPDATE 
      SET channel = 'all',
          reason = EXCLUDED.reason, 
          set_by_interaction_id = EXCLUDED.set_by_interaction_id,
          suppressed_since = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Backfill existing legacy do_not_contact / invalid_number rows to channel = 'all'
UPDATE public.alumni_contact_suppression
SET channel = 'all'
WHERE reason IN ('do_not_contact', 'invalid_number')
  AND channel <> 'all';
