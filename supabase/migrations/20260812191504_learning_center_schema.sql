-- ==========================================
-- NGConnect Learning Center Schema
-- Run this entire script in the Supabase SQL Editor
-- ==========================================

-- 1. User Integrations (Google Meet, Zoom)
CREATE TABLE IF NOT EXISTS public.user_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    connected_account TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own integrations"
    ON public.user_integrations
    FOR ALL
    USING (auth.uid() = user_id);

-- 2. Audiences (Settings)
CREATE TABLE IF NOT EXISTS public.learning_audiences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    is_campus_specific BOOLEAN DEFAULT FALSE,
    campuses TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.learning_audiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read audiences" ON public.learning_audiences FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Session Types (Settings)
CREATE TABLE IF NOT EXISTS public.learning_session_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.learning_session_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read session types" ON public.learning_session_types FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Mentors
CREATE TABLE IF NOT EXISTS public.mentors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable if they are just tracked by email initially
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT,
    status TEXT DEFAULT 'Active', -- Active, Inactive, Waitlisted
    expertise TEXT[] DEFAULT '{}',
    rating NUMERIC DEFAULT 0.0,
    total_sessions INTEGER DEFAULT 0,
    contact_number TEXT,
    linkedin_url TEXT,
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read mentors" ON public.mentors FOR SELECT USING (auth.role() = 'authenticated');

-- 5. Sessions
CREATE TABLE IF NOT EXISTS public.learning_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID REFERENCES public.mentors(id) ON DELETE SET NULL,
    topic TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    mode TEXT DEFAULT 'Online', -- Online, Offline
    platform TEXT, -- Zoom, Google Meet
    meeting_link TEXT,
    recording_url TEXT,
    audience_id UUID REFERENCES public.learning_audiences(id) ON DELETE SET NULL,
    session_type_id UUID REFERENCES public.learning_session_types(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read sessions" ON public.learning_sessions FOR SELECT USING (auth.role() = 'authenticated');

-- 6. Content Hub (Courses/Recordings)
CREATE TABLE IF NOT EXISTS public.learning_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    status TEXT DEFAULT 'draft', -- draft, published
    total_time_minutes INTEGER DEFAULT 0,
    audience_id UUID REFERENCES public.learning_audiences(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.learning_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read published or all if admin" ON public.learning_courses FOR SELECT USING ( (auth.role() = 'authenticated' AND status = 'published') OR ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin')) );

-- 7. User Course Progress
CREATE TABLE IF NOT EXISTS public.learning_course_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.learning_courses(id) ON DELETE CASCADE,
    progress_percentage INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

ALTER TABLE public.learning_course_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read and update their own progress" ON public.learning_course_progress FOR ALL USING (auth.uid() = user_id);

-- Note: In a real production setup, you will need to add INSERT/UPDATE/DELETE RLS policies 
-- restricted to Admin/Super roles based on your custom claims or RBAC table.
