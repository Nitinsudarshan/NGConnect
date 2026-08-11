-- ============================================================
-- NGConnect: Alumni Engagement CRM schema additions
-- Builds on existing alumni_master, alumni_profile, ng_campuses,
-- audit_log, role_permissions
-- ============================================================

-- ---------- 1. Org-level configurable settings ----------
CREATE TABLE IF NOT EXISTS public.org_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by TEXT REFERENCES public.alumni_master(email) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.org_settings (key, value, description) VALUES
  ('pay_forward_cap_inr', '120000', 'Lifetime pay-forward contribution considered "complete" (INR)'),
  ('pay_forward_min_salary_monthly_inr', '15000', 'Minimum normalized monthly salary to actively pitch pay-forward (INR)'),
  ('followup_cooldown_days', '3', 'Default days before suggesting a re-attempt after no answer')
ON CONFLICT (key) DO NOTHING;

-- ---------- 2. Contribution types (monetary + non-monetary, extensible) ----------
CREATE TABLE IF NOT EXISTS public.contribution_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  is_monetary BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.contribution_types (code, label, is_monetary) VALUES
  ('monetary', 'Monetary contribution', true),
  ('mentoring_hours', 'Mentoring hours given', false),
  ('guest_session', 'Guest session / talk delivered', false),
  ('referral', 'Referral made (job or donor)', false),
  ('in_kind_skill_work', 'In-kind skill work', false),
  ('lc_visit_hosted', 'Hosted a learning-center visit', false)
ON CONFLICT (code) DO NOTHING;

-- ---------- 3. Outcome tags (curated + custom, semi-open enum) ----------
CREATE TABLE IF NOT EXISTS public.interaction_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  requires_followup_datetime BOOLEAN NOT NULL DEFAULT FALSE,
  is_terminal BOOLEAN NOT NULL DEFAULT FALSE,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.interaction_outcomes (code, label, requires_followup_datetime, is_terminal) VALUES
  ('invalid_number', 'Invalid / wrong number', false, false),
  ('no_answer', 'No answer / did not connect', false, false),
  ('callback_requested', 'Connected — requested callback', true, false),
  ('discussed', 'Connected — discussed', false, false),
  ('declined_not_interested', 'Connected — declined / not interested', false, true),
  ('salary_undisclosed', 'Connected — would not disclose salary/status', false, false)
ON CONFLICT (code) DO NOTHING;

-- ---------- 4. Pipelines (semi-open, multi-membership) ----------
CREATE TABLE IF NOT EXISTS public.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO public.pipelines (code, label) VALUES
  ('pay_forward', 'Pay-Forward'),
  ('mentoring', 'Mentoring / Career support'),
  ('placement', 'Placement support')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.alumni_pipeline_membership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_email TEXT NOT NULL REFERENCES public.alumni_master(email) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id),
  status TEXT NOT NULL DEFAULT 'active',
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (alumni_email, pipeline_id)
);

-- ---------- 5. Interaction log — the core table ----------
CREATE TABLE IF NOT EXISTS public.alumni_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_email TEXT NOT NULL REFERENCES public.alumni_master(email) ON DELETE CASCADE,
  logged_by TEXT NOT NULL,
  interaction_channel TEXT NOT NULL DEFAULT 'call',
  outcome_id UUID NOT NULL REFERENCES public.interaction_outcomes(id),
  notes TEXT,
  mentoring_interest BOOLEAN,
  placement_interest BOOLEAN,
  pay_forward_interest BOOLEAN,
  followup_at TIMESTAMPTZ,
  followup_assigned_to TEXT,
  followup_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- enforce: outcomes flagged requires_followup_datetime must have followup_at set
CREATE OR REPLACE FUNCTION public.enforce_followup_datetime() RETURNS TRIGGER AS $$
DECLARE
  requires BOOLEAN;
BEGIN
  SELECT requires_followup_datetime INTO requires
  FROM public.interaction_outcomes WHERE id = NEW.outcome_id;

  IF requires AND NEW.followup_at IS NULL THEN
    RAISE EXCEPTION 'This outcome requires a follow-up date and time';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_followup ON public.alumni_interactions;
CREATE TRIGGER trg_enforce_followup
  BEFORE INSERT OR UPDATE ON public.alumni_interactions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_followup_datetime();

-- ---------- 6. Support areas (mentoring/career granularity) ----------
CREATE TABLE IF NOT EXISTS public.interaction_support_areas (
  interaction_id UUID NOT NULL REFERENCES public.alumni_interactions(id) ON DELETE CASCADE,
  support_area TEXT NOT NULL CHECK (support_area IN ('mentor', 'skill_improvement', 'career_guidance')),
  PRIMARY KEY (interaction_id, support_area)
);

-- ---------- 7. Salary tracking with explicit units ----------
CREATE TABLE IF NOT EXISTS public.alumni_salary_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_email TEXT NOT NULL REFERENCES public.alumni_master(email) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('monthly', 'lpa')),
  amount_monthly_inr NUMERIC GENERATED ALWAYS AS (
    CASE WHEN unit = 'lpa' THEN ROUND(amount * 100000 / 12.0, 2) ELSE amount END
  ) STORED,
  recorded_by TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_interaction_id UUID REFERENCES public.alumni_interactions(id) ON DELETE SET NULL
);

-- ---------- 8. Pay-forward contributions (monetary + non-monetary) ----------
CREATE TABLE IF NOT EXISTS public.pay_forward_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_email TEXT NOT NULL REFERENCES public.alumni_master(email) ON DELETE CASCADE,
  contribution_type_id UUID NOT NULL REFERENCES public.contribution_types(id),
  amount_inr NUMERIC,
  non_monetary_detail TEXT,
  contributed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by TEXT,
  source_interaction_id UUID REFERENCES public.alumni_interactions(id) ON DELETE SET NULL
);

-- convenience view: lifetime monetary total + cap progress
CREATE OR REPLACE VIEW public.v_pay_forward_progress AS
SELECT
  a.alumni_email,
  COALESCE(SUM(a.amount_inr) FILTER (
    WHERE ct.is_monetary AND a.amount_inr <= (SELECT (value#>>'{}')::numeric FROM public.org_settings WHERE key='pay_forward_cap_inr')
  ), 0) AS counted_toward_cap,
  COALESCE(SUM(a.amount_inr) FILTER (WHERE ct.is_monetary), 0) AS lifetime_monetary_total,
  (SELECT (value#>>'{}')::numeric FROM public.org_settings WHERE key='pay_forward_cap_inr') AS cap_inr
FROM public.pay_forward_contributions a
JOIN public.contribution_types ct ON ct.id = a.contribution_type_id
GROUP BY a.alumni_email;

-- ---------- 9. Mentor / session / attendance ----------
CREATE TABLE IF NOT EXISTS public.mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  areas TEXT[],
  sourced_by TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mentoring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES public.mentors(id) ON DELETE SET NULL,
  alumni_pipeline_membership_id UUID REFERENCES public.alumni_pipeline_membership(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ,
  topic TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mentoring_attendance (
  session_id UUID REFERENCES public.mentoring_sessions(id) ON DELETE CASCADE,
  alumni_email TEXT REFERENCES public.alumni_master(email) ON DELETE CASCADE,
  attended BOOLEAN,
  PRIMARY KEY (session_id, alumni_email)
);

-- ---------- 10. Profile completeness view ----------
CREATE OR REPLACE VIEW public.v_alumni_profile_completeness AS
SELECT
  am.email AS alumni_email,
  (ap.linkedin_profile IS NULL OR ap.linkedin_profile = '') AS missing_linkedin,
  (ap.current_company IS NULL OR ap.current_company = '') AS missing_company,
  (NOT EXISTS (SELECT 1 FROM public.alumni_salary_records s WHERE s.alumni_email = am.email)) AS missing_salary
FROM public.alumni_master am
LEFT JOIN public.alumni_profile ap ON ap.alumni_email = am.email;

-- ---------- 11. Indexes ----------
CREATE INDEX IF NOT EXISTS idx_interactions_alumni ON public.alumni_interactions(alumni_email);
CREATE INDEX IF NOT EXISTS idx_interactions_followup ON public.alumni_interactions(followup_at) WHERE followup_completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_pipeline_membership_alumni ON public.alumni_pipeline_membership(alumni_email);
CREATE INDEX IF NOT EXISTS idx_pf_contributions_alumni ON public.pay_forward_contributions(alumni_email);

-- ---------- 12. RLS Policies ----------
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_pipeline_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_support_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pay_forward_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentoring_attendance ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users SELECT on config tables
CREATE POLICY "Allow select org_settings" ON public.org_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select contribution_types" ON public.contribution_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select interaction_outcomes" ON public.interaction_outcomes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select pipelines" ON public.pipelines FOR SELECT TO authenticated USING (true);

-- Allow authenticated users full CRUD on operational CRM tables
CREATE POLICY "Allow authenticated pipeline_membership" ON public.alumni_pipeline_membership FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated interactions" ON public.alumni_interactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated support_areas" ON public.interaction_support_areas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated salary_records" ON public.alumni_salary_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated pf_contributions" ON public.pay_forward_contributions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated mentors" ON public.mentors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated mentoring_sessions" ON public.mentoring_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated mentoring_attendance" ON public.mentoring_attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);
