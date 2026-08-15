-- Migration: Create alumni_member_requests table for Coursera access and Pay-Forward requests
-- Date: 2026-08-16

CREATE TABLE IF NOT EXISTS public.alumni_member_requests (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('coursera', 'pay_forward')),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'received', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_by TEXT
);

-- Index for fast lookup by user email and request status
CREATE INDEX IF NOT EXISTS idx_member_requests_email_type ON public.alumni_member_requests (user_email, type);
CREATE INDEX IF NOT EXISTS idx_member_requests_status ON public.alumni_member_requests (status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.alumni_member_requests ENABLE ROW LEVEL SECURITY;

-- Policy 1: Members can view their own requests, Staff/Admins can view all requests
DROP POLICY IF EXISTS "Users can view their own requests or staff can view all" ON public.alumni_member_requests;
CREATE POLICY "Users can view their own requests or staff can view all"
  ON public.alumni_member_requests
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = user_email
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Admin', 'Super Admin')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin')
  );

-- Policy 2: Members can submit requests for themselves
DROP POLICY IF EXISTS "Users can insert their own requests" ON public.alumni_member_requests;
CREATE POLICY "Users can insert their own requests"
  ON public.alumni_member_requests
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' = user_email
    OR auth.role() = 'authenticated'
  );

-- Policy 3: Staff and Admins can update request status (Grant Access / Mark Received)
DROP POLICY IF EXISTS "Staff can update request status" ON public.alumni_member_requests;
CREATE POLICY "Staff can update request status"
  ON public.alumni_member_requests
  FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Admin', 'Super Admin')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin')
  );
