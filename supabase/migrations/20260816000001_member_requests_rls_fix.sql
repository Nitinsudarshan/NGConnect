-- Migration: Fix RLS policies for alumni_member_requests table
-- Date: 2026-08-16
-- Enforces app_metadata role checks exclusively and restricts INSERT to session identity matching

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Users can view their own requests or staff can view all" ON public.alumni_member_requests;
DROP POLICY IF EXISTS "Users can insert their own requests" ON public.alumni_member_requests;
DROP POLICY IF EXISTS "Staff can update request status" ON public.alumni_member_requests;

-- 2. Policy 1: SELECT
-- Members can view their own requests; Staff (Admin / Super Admin via app_metadata) can view all requests
CREATE POLICY "Users can view their own requests or staff can view all"
  ON public.alumni_member_requests
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = user_email
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin')
  );

-- 3. Policy 2: INSERT
-- Authenticated users can strictly insert requests where user_email matches their JWT email claim
CREATE POLICY "Users can insert their own requests"
  ON public.alumni_member_requests
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' = user_email
  );

-- 4. Policy 3: UPDATE
-- Staff (Admin / Super Admin via app_metadata) can update request status
CREATE POLICY "Staff can update request status"
  ON public.alumni_member_requests
  FOR UPDATE
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Admin', 'Super Admin')
  );
