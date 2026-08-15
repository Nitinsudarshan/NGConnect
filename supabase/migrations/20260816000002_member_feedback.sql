-- Migration: Create alumni_member_feedback table for member feedback persistence
-- Date: 2026-08-16

CREATE TABLE IF NOT EXISTS public.alumni_member_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_email TEXT,
  category TEXT NOT NULL,
  focus_area TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT NOT NULL,
  category_specific_suggestion TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by user email and category
CREATE INDEX IF NOT EXISTS idx_member_feedback_user_email ON public.alumni_member_feedback (user_email);
CREATE INDEX IF NOT EXISTS idx_member_feedback_category ON public.alumni_member_feedback (category);

-- Enable Row Level Security (RLS)
ALTER TABLE public.alumni_member_feedback ENABLE ROW LEVEL SECURITY;

-- Policy 1: Members can insert their feedback
CREATE POLICY "Authenticated users can insert feedback"
  ON public.alumni_member_feedback
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
  );

-- Policy 2: Members can view their own non-anonymous submissions, Staff/Admins can view all
CREATE POLICY "Users can view their own feedback or staff can view all"
  ON public.alumni_member_feedback
  FOR SELECT
  USING (
    (auth.jwt() ->> 'email' = user_email AND is_anonymous = false)
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin')
  );
