-- Mentors Table
CREATE TABLE mentors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  linkedin TEXT,
  domain TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions Table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID REFERENCES mentors(id),
  topic TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER NOT NULL,
  mode TEXT NOT NULL,
  platform TEXT NOT NULL,
  audience TEXT NOT NULL,
  zoom_meeting_id TEXT,
  join_url TEXT,
  start_url TEXT,
  recording_url TEXT,
  feedback_form_link TEXT,
  status TEXT DEFAULT 'Scheduled',
  trigger_overrides JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Center Settings & Templates
CREATE TABLE learning_center_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  master_trigger_config JSONB NOT NULL
);

CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  channel TEXT NOT NULL,
  body TEXT NOT NULL,
  variables JSONB
);

CREATE TABLE reminders_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id),
  type TEXT NOT NULL,
  channel TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL
);

CREATE TABLE feedback_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id),
  email TEXT NOT NULL,
  respondent_type TEXT,
  overall_rating INTEGER,
  mentor_rating INTEGER,
  relevance_rating INTEGER,
  liked_text TEXT,
  suggestions_text TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_center_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;

-- Note: The following policies allow read access to everyone for frontend listing
-- and full access to authenticated admins/programs.
CREATE POLICY "Enable read access for all authenticated users" ON mentors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all authenticated users" ON sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for admins" ON mentors USING (((auth.jwt() ->> 'role')::text = ANY (ARRAY['Admin'::text, 'Super Admin'::text, 'Program'::text])));
CREATE POLICY "Enable all access for admins" ON sessions USING (((auth.jwt() ->> 'role')::text = ANY (ARRAY['Admin'::text, 'Super Admin'::text, 'Program'::text])));

-- Seed data for master settings
INSERT INTO learning_center_settings (id, master_trigger_config) VALUES (
  1,
  '{
    "announcement": {"enabled": true, "offsetDays": 2},
    "invitation": {"enabled": true},
    "reminder_1": {"enabled": true, "offsetDays": 1},
    "reminder_2": {"enabled": true, "offsetHours": 9},
    "welcome": {"enabled": true, "offsetMinutes": 2},
    "feedback": {"enabled": true, "channels": ["email"]},
    "mentor_thankyou": {"enabled": true}
  }'::jsonb
);
