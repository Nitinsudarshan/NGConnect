-- Add is_substantive_conversation flag
ALTER TABLE public.interaction_outcomes
  ADD COLUMN IF NOT EXISTS is_substantive_conversation BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.interaction_outcomes
  SET is_substantive_conversation = TRUE
  WHERE code IN ('discussed', 'salary_undisclosed');

-- RLS Cleanup for pipeline_poc_eligibility
DROP POLICY IF EXISTS "pipeline_poc_eligibility_insert_admin" ON public.pipeline_poc_eligibility;
DROP POLICY IF EXISTS "pipeline_poc_eligibility_update_admin" ON public.pipeline_poc_eligibility;
CREATE POLICY "pipeline_poc_eligibility_write_admin" ON public.pipeline_poc_eligibility
  FOR ALL TO authenticated
  USING ( (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Super Admin'::text, 'Admin'::text])) );

-- RLS Cleanup for call_reasons
DROP POLICY IF EXISTS "call_reasons_insert_admin" ON public.call_reasons;
DROP POLICY IF EXISTS "call_reasons_update_admin" ON public.call_reasons;
CREATE POLICY "call_reasons_write_admin" ON public.call_reasons
  FOR ALL TO authenticated
  USING ( (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['Super Admin'::text, 'Admin'::text])) );
