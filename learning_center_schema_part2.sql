-- Mentor Soft Delete
ALTER TABLE mentors ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL;

-- Member LMS & Watch Tracking
CREATE TABLE watch_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  video_source_type TEXT NOT NULL, -- 'session_recording' | 'course_item'
  video_source_id UUID NOT NULL,
  watched_seconds INTEGER DEFAULT 0,
  percent_watched INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_source_type, video_source_id)
);

-- Content Hub (Courses & Quizzes)
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  audience TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE course_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'video' | 'article' | 'pdf' | 'quiz'
  title TEXT NOT NULL,
  video_url TEXT,
  article_body TEXT,
  pdf_url TEXT,
  quiz_id UUID -- References quizzes(id)
);

CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  pass_threshold_pct INTEGER DEFAULT 80
);

CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  type TEXT NOT NULL, -- 'mcq' | 'true_false'
  explanation TEXT
);

CREATE TABLE quiz_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false
);

CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score_pct INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE course_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  items_completed INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE(course_id, user_id)
);

-- Mentor Stats View
CREATE VIEW mentor_stats AS
SELECT 
    m.id AS mentor_id,
    COUNT(DISTINCT s.id) AS total_sessions,
    COALESCE(SUM(s.duration), 0) AS total_duration_minutes,
    COALESCE(AVG(fr.overall_rating), 0) AS avg_overall_rating,
    COALESCE(AVG(fr.mentor_rating), 0) AS avg_mentor_rating,
    COALESCE(AVG(fr.relevance_rating), 0) AS avg_relevance_rating,
    COUNT(fr.id) AS total_feedback_responses
FROM mentors m
LEFT JOIN sessions s ON m.id = s.mentor_id
LEFT JOIN feedback_responses fr ON s.id = fr.session_id
WHERE m.archived_at IS NULL
GROUP BY m.id;

-- RLS Policies
ALTER TABLE watch_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for admins" ON courses USING (((auth.jwt() ->> 'role')::text = ANY (ARRAY['Admin'::text, 'Super Admin'::text, 'Program'::text])));
CREATE POLICY "Enable all access for admins" ON course_items USING (((auth.jwt() ->> 'role')::text = ANY (ARRAY['Admin'::text, 'Super Admin'::text, 'Program'::text])));
CREATE POLICY "Enable all access for admins" ON quizzes USING (((auth.jwt() ->> 'role')::text = ANY (ARRAY['Admin'::text, 'Super Admin'::text, 'Program'::text])));
CREATE POLICY "Enable all access for admins" ON quiz_questions USING (((auth.jwt() ->> 'role')::text = ANY (ARRAY['Admin'::text, 'Super Admin'::text, 'Program'::text])));
CREATE POLICY "Enable all access for admins" ON quiz_options USING (((auth.jwt() ->> 'role')::text = ANY (ARRAY['Admin'::text, 'Super Admin'::text, 'Program'::text])));

-- Members read published courses
CREATE POLICY "Enable read access for all authenticated users" ON courses FOR SELECT USING (auth.role() = 'authenticated' AND status = 'published');
CREATE POLICY "Enable read access for all authenticated users" ON course_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all authenticated users" ON quizzes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all authenticated users" ON quiz_questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all authenticated users" ON quiz_options FOR SELECT USING (auth.role() = 'authenticated');

-- Members can insert/update their own watch_progress and attempts
CREATE POLICY "Enable read/write for own progress" ON watch_progress USING (user_id = auth.uid());
CREATE POLICY "Enable read/write for own progress" ON quiz_attempts USING (user_id = auth.uid());
CREATE POLICY "Enable read/write for own progress" ON course_progress USING (user_id = auth.uid());

-- Learning Center Audit Logs
CREATE TABLE IF NOT EXISTS learning_center_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE learning_center_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users" 
ON learning_center_audit_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert for authenticated users" 
ON learning_center_audit_logs FOR INSERT TO authenticated WITH CHECK (true);

