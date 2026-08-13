-- 1. Pipeline POC Eligibility
CREATE TABLE IF NOT EXISTS public.pipeline_poc_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  staff_email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pipeline_id, staff_email)
);

-- Seed: all 3 callers eligible for pay_forward, 2 of them also eligible
-- for mentoring + placement.
INSERT INTO public.pipeline_poc_eligibility (pipeline_id, staff_email)
SELECT id, email FROM public.pipelines, (VALUES
  ('pay_forward', 'caller1@navgurukul.org'),
  ('pay_forward', 'caller2@navgurukul.org'),
  ('pay_forward', 'caller3@navgurukul.org'),
  ('mentoring',   'caller1@navgurukul.org'),
  ('mentoring',   'caller2@navgurukul.org'),
  ('placement',   'caller1@navgurukul.org'),
  ('placement',   'caller2@navgurukul.org')
) AS seed(pipeline_code, email)
WHERE pipelines.code = seed.pipeline_code
ON CONFLICT (pipeline_id, staff_email) DO NOTHING;

-- RLS for pipeline_poc_eligibility
ALTER TABLE public.pipeline_poc_eligibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select pipeline_poc_eligibility" ON public.pipeline_poc_eligibility FOR SELECT TO authenticated USING (true);
CREATE POLICY "pipeline_poc_eligibility_insert_admin" ON public.pipeline_poc_eligibility FOR INSERT TO authenticated WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') );
CREATE POLICY "pipeline_poc_eligibility_update_admin" ON public.pipeline_poc_eligibility FOR UPDATE TO authenticated USING ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') ) WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') );

-- 2. POC Email on alumni_pipeline_membership
ALTER TABLE public.alumni_pipeline_membership
  ADD COLUMN IF NOT EXISTS poc_email TEXT;

CREATE INDEX IF NOT EXISTS idx_apm_poc_email ON public.alumni_pipeline_membership(poc_email);

-- 3. Call Reasons
CREATE TABLE IF NOT EXISTS public.call_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.call_reasons (code, label) VALUES
  ('needs_assessment', 'Needs assessment'),
  ('pay_forward', 'Pay-Forward'),
  ('data_collection', 'Data collection'),
  ('survey_information', 'Survey / information gathering'),
  ('general_checkin', 'General check-in')
ON CONFLICT (code) DO NOTHING;

-- RLS for call_reasons
ALTER TABLE public.call_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select call_reasons" ON public.call_reasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "call_reasons_insert_admin" ON public.call_reasons FOR INSERT TO authenticated WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') );
CREATE POLICY "call_reasons_update_admin" ON public.call_reasons FOR UPDATE TO authenticated USING ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') ) WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') );

-- 4. Call Reason ID on alumni_interactions
ALTER TABLE public.alumni_interactions
  ADD COLUMN IF NOT EXISTS call_reason_id UUID REFERENCES public.call_reasons(id);
