-- Fix RLS policies for learning_sessions table
-- Run this script in the Supabase SQL Editor

-- 1. Ensure RLS is enabled
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users to view sessions
DROP POLICY IF EXISTS "Authenticated users can read sessions" ON public.learning_sessions;
CREATE POLICY "Authenticated users can read sessions"
    ON public.learning_sessions FOR SELECT
    USING (auth.role() = 'authenticated');

-- 3. Allow authenticated users to insert new sessions
DROP POLICY IF EXISTS "Authenticated users can insert sessions" ON public.learning_sessions;
CREATE POLICY "Authenticated users can insert sessions"
    ON public.learning_sessions FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 4. Allow authenticated users to update sessions
DROP POLICY IF EXISTS "Authenticated users can update sessions" ON public.learning_sessions;
CREATE POLICY "Authenticated users can update sessions"
    ON public.learning_sessions FOR UPDATE
    USING (auth.role() = 'authenticated');

-- 5. Allow authenticated users to delete sessions
DROP POLICY IF EXISTS "Authenticated users can delete sessions" ON public.learning_sessions;
CREATE POLICY "Authenticated users can delete sessions"
    ON public.learning_sessions FOR DELETE
    USING (auth.role() = 'authenticated');
