-- ============================================================================
-- NGConnect: Complete Alumni Growth Module SQL Schema
-- ============================================================================
-- Single, self-contained, production-ready SQL script for the entire Alumni Growth domain.
-- Covers identity master, CRM config, pipeline tracking, interactions, salary logs,
-- pay-forward contributions, mentors directory, audit logs, RLS policies & seed data.
-- ============================================================================

-- ---------- 0. Extensions ----------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ---------- 1. Helper Security & Config Functions ----------
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT (
    auth.jwt() ->> 'email' IN ('nitin@navgurukul.org', 'nitinsudarshan@gmail.com')
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_member()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'Member'
  )
$$;

CREATE OR REPLACE FUNCTION public.set_config(parameter text, value text, is_local boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN pg_catalog.set_config(parameter, value, is_local);
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ---------- 2. Master Lookups ----------
CREATE TABLE IF NOT EXISTS public.ng_campuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.highest_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ng_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- 3. Import Batches & Alumni Master ----------
CREATE TABLE IF NOT EXISTS public.import_batches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name           TEXT NOT NULL,
    file_type           TEXT NOT NULL CHECK (file_type IN ('csv', 'xlsx')),
    file_size           BIGINT,
    uploaded_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    uploaded_by_name    TEXT NOT NULL,
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    records_processed   INTEGER NOT NULL DEFAULT 0,
    records_created     INTEGER NOT NULL DEFAULT 0,
    records_updated     INTEGER NOT NULL DEFAULT 0,
    records_failed      INTEGER NOT NULL DEFAULT 0,
    status              TEXT NOT NULL DEFAULT 'processing'
                            CHECK (status IN ('processing', 'completed', 'failed', 'rolled_back')),
    notes               TEXT
);

CREATE TABLE IF NOT EXISTS public.alumni_master (
    email               TEXT PRIMARY KEY,
    import_batch_id     UUID REFERENCES public.import_batches(id) ON DELETE SET NULL,
    name                TEXT,
    phone_number        TEXT,
    gender              TEXT,
    city                TEXT,
    state               TEXT,
    campus              TEXT,
    course              TEXT,
    entry_year          INTEGER,
    technology_stack    TEXT,
    donor               TEXT,
    cycle               TEXT,
    company             TEXT,
    starting_position   TEXT,
    starting_salary     NUMERIC(12, 2),
    month_of_placement  TEXT,
    year_of_placement   INTEGER,
    linkedin_profile    TEXT,
    status              TEXT
                            CHECK (status IN (
                                'Active',
                                'Placed',
                                'DropOut',
                                'Intern (Out Campus)',
                                'Intern (In Campus)',
                                'Completed',
                                'Completed-Opted out for placement',
                                'InActive'
                            )),
    dropout_date        DATE,
    reason              TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alumni_profile (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumni_email         TEXT NOT NULL UNIQUE REFERENCES public.alumni_master(email) ON DELETE CASCADE,
    phone_number         TEXT,
    city                 TEXT,
    state                TEXT,
    profile_photo        TEXT,
    highest_education    TEXT,
    batch_year           INTEGER,
    bio                  TEXT,
    skills               TEXT[],
    linkedin_profile     TEXT,
    github_profile       TEXT,
    current_company      TEXT,
    current_position     TEXT,
    current_salary       NUMERIC(12, 2),
    career_progression   JSONB DEFAULT '[]'::jsonb,
    mentoring_interests  TEXT[],
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by           UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.import_batch_records (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_batch_id  UUID NOT NULL REFERENCES public.import_batches(id) ON DELETE CASCADE,
    alumni_email     TEXT REFERENCES public.alumni_master(email) ON DELETE SET NULL,
    action           TEXT NOT NULL CHECK (action IN ('created', 'updated', 'skipped', 'failed')),
    status           TEXT NOT NULL CHECK (status IN ('success', 'error')),
    error_message    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- 4. Alumni Growth CRM Configuration ----------
CREATE TABLE IF NOT EXISTS public.org_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by TEXT REFERENCES public.alumni_master(email) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contribution_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  is_monetary BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------- 5. Alumni Growth Operational CRM ----------
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

CREATE TABLE IF NOT EXISTS public.interaction_support_areas (
  interaction_id UUID NOT NULL REFERENCES public.alumni_interactions(id) ON DELETE CASCADE,
  support_area TEXT NOT NULL CHECK (support_area IN ('mentor', 'skill_improvement', 'career_guidance')),
  PRIMARY KEY (interaction_id, support_area)
);

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

-- ---------- 6. Mentors Directory & Mentoring Sessions ----------
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

-- ---------- 7. Unified Audit Logs ----------
CREATE TABLE IF NOT EXISTS public.audit_log (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name           TEXT NOT NULL,
    record_id            TEXT NOT NULL,
    field_name           TEXT NOT NULL,
    old_value            TEXT,
    new_value            TEXT,
    action_type          TEXT NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE', 'IMPORT', 'RESTORE')),
    changed_by_user_id   UUID,
    changed_by_name      TEXT,
    changed_by_role      TEXT,
    changed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address           TEXT
);

CREATE TABLE IF NOT EXISTS public.learning_center_audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id   TEXT,
    action      TEXT NOT NULL,
    details     TEXT,
    user_id     TEXT,
    user_email  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- 8. Views ----------
DROP VIEW IF EXISTS public.v_pay_forward_progress CASCADE;
CREATE OR REPLACE VIEW public.v_pay_forward_progress AS
SELECT
  a.alumni_email,
  COALESCE(SUM(a.amount_inr) FILTER (
    WHERE ct.is_monetary AND a.amount_inr <= (
      SELECT COALESCE((value#>>'{}')::numeric, 120000) FROM public.org_settings WHERE key='pay_forward_cap_inr'
    )
  ), 0) AS counted_toward_cap,
  COALESCE(SUM(a.amount_inr) FILTER (WHERE ct.is_monetary), 0) AS lifetime_monetary_total,
  (SELECT COALESCE((value#>>'{}')::numeric, 120000) FROM public.org_settings WHERE key='pay_forward_cap_inr') AS cap_inr
FROM public.pay_forward_contributions a
JOIN public.contribution_types ct ON ct.id = a.contribution_type_id
GROUP BY a.alumni_email;

DROP VIEW IF EXISTS public.v_alumni_profile_completeness CASCADE;
CREATE OR REPLACE VIEW public.v_alumni_profile_completeness AS
SELECT
  am.email AS alumni_email,
  (ap.linkedin_profile IS NULL OR ap.linkedin_profile = '') AS missing_linkedin,
  (ap.current_company IS NULL OR ap.current_company = '') AS missing_company,
  (NOT EXISTS (SELECT 1 FROM public.alumni_salary_records s WHERE s.alumni_email = am.email)) AS missing_salary
FROM public.alumni_master am
LEFT JOIN public.alumni_profile ap ON ap.alumni_email = am.email;

-- ---------- 9. Indexes ----------
CREATE INDEX IF NOT EXISTS idx_alumni_master_campus       ON public.alumni_master(campus);
CREATE INDEX IF NOT EXISTS idx_alumni_master_course       ON public.alumni_master(course);
CREATE INDEX IF NOT EXISTS idx_alumni_master_status       ON public.alumni_master(status);
CREATE INDEX IF NOT EXISTS idx_alumni_master_entry_year   ON public.alumni_master(entry_year);
CREATE INDEX IF NOT EXISTS idx_alumni_master_import_batch ON public.alumni_master(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_alumni_master_name_trgm    ON public.alumni_master USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_interactions_alumni        ON public.alumni_interactions(alumni_email);
CREATE INDEX IF NOT EXISTS idx_interactions_followup      ON public.alumni_interactions(followup_at) WHERE followup_completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_pipeline_membership_alumni ON public.alumni_pipeline_membership(alumni_email);
CREATE INDEX IF NOT EXISTS idx_pf_contributions_alumni    ON public.pay_forward_contributions(alumni_email);

CREATE INDEX IF NOT EXISTS idx_audit_record_id            ON public.audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_table_name           ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at           ON public.audit_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_lc_audit_created_at        ON public.learning_center_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lc_audit_entity_type       ON public.learning_center_audit_logs(entity_type);

-- ---------- 10. Triggers ----------
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

DROP TRIGGER IF EXISTS trg_updated_at_alumni_master ON public.alumni_master;
CREATE TRIGGER trg_updated_at_alumni_master
    BEFORE UPDATE ON public.alumni_master
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at_alumni_profile ON public.alumni_profile;
CREATE TRIGGER trg_updated_at_alumni_profile
    BEFORE UPDATE ON public.alumni_profile
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ---------- 11. Row Level Security (RLS) Policies ----------
ALTER TABLE public.ng_campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highest_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ng_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batch_records ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_center_audit_logs ENABLE ROW LEVEL SECURITY;

-- Master & Config Select Policies
DROP POLICY IF EXISTS "Allow select campuses" ON public.ng_campuses;
CREATE POLICY "Allow select campuses" ON public.ng_campuses FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow select highest_education" ON public.highest_education;
CREATE POLICY "Allow select highest_education" ON public.highest_education FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow select ng_courses" ON public.ng_courses;
CREATE POLICY "Allow select ng_courses" ON public.ng_courses FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow select org_settings" ON public.org_settings;
CREATE POLICY "Allow select org_settings" ON public.org_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow select contribution_types" ON public.contribution_types;
CREATE POLICY "Allow select contribution_types" ON public.contribution_types FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow select interaction_outcomes" ON public.interaction_outcomes;
CREATE POLICY "Allow select interaction_outcomes" ON public.interaction_outcomes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow select pipelines" ON public.pipelines;
CREATE POLICY "Allow select pipelines" ON public.pipelines FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "alumni_master_select_all" ON public.alumni_master;
CREATE POLICY "alumni_master_select_all" ON public.alumni_master FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "alumni_profile_select_all" ON public.alumni_profile;
CREATE POLICY "alumni_profile_select_all" ON public.alumni_profile FOR SELECT TO authenticated USING (true);

-- CRM Operational CRUD Policies
DROP POLICY IF EXISTS "Allow authenticated pipeline_membership" ON public.alumni_pipeline_membership;
CREATE POLICY "Allow authenticated pipeline_membership" ON public.alumni_pipeline_membership FOR ALL TO authenticated USING ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') ) WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') );

DROP POLICY IF EXISTS "Allow authenticated interactions" ON public.alumni_interactions;
CREATE POLICY "Allow authenticated interactions" ON public.alumni_interactions FOR ALL TO authenticated USING ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') ) WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') );

DROP POLICY IF EXISTS "Allow authenticated support_areas" ON public.interaction_support_areas;
CREATE POLICY "Allow authenticated support_areas" ON public.interaction_support_areas FOR ALL TO authenticated USING ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') ) WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') );

DROP POLICY IF EXISTS "Allow authenticated salary_records" ON public.alumni_salary_records;
CREATE POLICY "Allow authenticated salary_records" ON public.alumni_salary_records FOR ALL TO authenticated USING ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') ) WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') );

DROP POLICY IF EXISTS "Allow authenticated pf_contributions" ON public.pay_forward_contributions;
CREATE POLICY "Allow authenticated pf_contributions" ON public.pay_forward_contributions FOR ALL TO authenticated USING ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') ) WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') );

DROP POLICY IF EXISTS "Allow authenticated mentors" ON public.mentors;
CREATE POLICY "Allow authenticated mentors" ON public.mentors FOR ALL TO authenticated USING ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') ) WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') );

DROP POLICY IF EXISTS "Allow authenticated mentoring_sessions" ON public.mentoring_sessions;
CREATE POLICY "Allow authenticated mentoring_sessions" ON public.mentoring_sessions FOR ALL TO authenticated USING ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') ) WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') );

DROP POLICY IF EXISTS "Allow authenticated mentoring_attendance" ON public.mentoring_attendance;
CREATE POLICY "Allow authenticated mentoring_attendance" ON public.mentoring_attendance FOR ALL TO authenticated USING ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') ) WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') );

DROP POLICY IF EXISTS "Allow authenticated lc_audit_logs" ON public.learning_center_audit_logs;
CREATE POLICY "Allow authenticated lc_audit_logs" ON public.learning_center_audit_logs FOR ALL TO authenticated USING ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') ) WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin') );

-- ---------- 12. Seed Initial Data ----------
INSERT INTO public.ng_campuses (name, status)
VALUES 
    ('Bangalore', 'active'),
    ('Dantewada', 'active'),
    ('Dharamshala', 'active'),
    ('Jashpur', 'active'),
    ('Kishanganj', 'active'),
    ('Pune', 'active'),
    ('Raigarh', 'active'),
    ('Amravati', 'closed'),
    ('Delhi', 'closed'),
    ('Raipur', 'closed'),
    ('Udaipur', 'closed')
ON CONFLICT (name) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO public.highest_education (name)
VALUES 
    ('High School (10th)'),
    ('Intermediate (12th)'),
    ('Diploma'),
    ('Undergraduate (Bachelors)'),
    ('Postgraduate (Masters)'),
    ('PhD / Doctorate'),
    ('Other')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.ng_courses (name)
VALUES 
    ('School of Programming'),
    ('School of Business'),
    ('School of Finance')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.org_settings (key, value, description) VALUES
  ('pay_forward_cap_inr', '120000', 'Lifetime pay-forward contribution considered "complete" (INR)'),
  ('pay_forward_min_salary_monthly_inr', '15000', 'Minimum normalized monthly salary to actively pitch pay-forward (INR)'),
  ('followup_cooldown_days', '3', 'Default days before suggesting a re-attempt after no answer'),
  ('outcome_mapping', '[
    {"outcome_code": "declined_not_interested", "pipeline_code": "pay_forward", "action": "remove"},
    {"outcome_code": "declined_not_interested", "pipeline_code": "mentoring", "action": "remove"},
    {"outcome_code": "discussed", "pipeline_code": "pay_forward", "action": "move_stage", "target_stage": "Pitched — Considering"},
    {"outcome_code": "discussed", "pipeline_code": "mentoring", "action": "move_stage", "target_stage": "Interested — Needs Mentor Match"}
  ]', 'Default outcome-to-pipeline progression mapping rules')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.contribution_types (code, label, is_monetary) VALUES
  ('monetary', 'Monetary contribution', true),
  ('mentoring_hours', 'Mentoring hours given', false),
  ('guest_session', 'Guest session / talk delivered', false),
  ('referral', 'Referral made (job or donor)', false),
  ('in_kind_skill_work', 'In-kind skill work', false),
  ('lc_visit_hosted', 'Hosted a learning-center visit', false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.interaction_outcomes (code, label, requires_followup_datetime, is_terminal) VALUES
  ('invalid_number', 'Invalid / wrong number', false, false),
  ('no_answer', 'No answer / did not connect', false, false),
  ('callback_requested', 'Connected — requested callback', true, false),
  ('discussed', 'Connected — discussed', false, false),
  ('declined_not_interested', 'Connected — declined / not interested', false, true),
  ('salary_undisclosed', 'Connected — would not disclose salary/status', false, false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.pipelines (code, label) VALUES
  ('pay_forward', 'Pay-Forward'),
  ('mentoring', 'Mentoring / Career support'),
  ('placement', 'Placement support')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- End of Alumni Growth SQL Schema
-- ============================================================================

