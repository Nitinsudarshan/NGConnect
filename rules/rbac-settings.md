# Role-Based Access Control (RBAC) Settings

This project uses a Role-Based Access Control (RBAC) system to manage which user roles have access to which page clusters (e.g., Dashboard, CRM, Data Management, Reports).

## How it works

The access rights are stored in the `role_permissions` table in the Supabase database.
- A centralized helper `checkAccess(role, cluster)` in `src/lib/permissions.ts` fetches and validates access.
- Access is enforced at the layout level for protected routes (e.g., `src/app/(dashboard)/data-management/layout.tsx`).
- Super Admins and Admins can manage these permissions dynamically using the interactive grid at `/manage/rbac`.

## Adding a new feature/cluster

Every time a **new feature** or **page cluster** is added to the application that requires access control:
1. You **MUST** add a new boolean column to the `role_permissions` table representing the new feature.
2. Update the `PageCluster` type in `src/lib/permissions.ts`.
3. Update the `CLUSTERS` array and `RolePermissionData` type in `src/app/(dashboard)/manage/rbac/_components/rbac-grid.tsx` so Admins can toggle it.
4. Add a layout check for the new route using `checkAccess`.

## Database Schema / SQL Editor

If you are initializing the database or adding a new cluster, use the following SQL script in the Supabase SQL Editor.

```sql
-- Create table (if not exists)
CREATE TABLE IF NOT EXISTS role_permissions (
    role text PRIMARY KEY,
    dashboard boolean DEFAULT false,
    reports boolean DEFAULT false,
    crm boolean DEFAULT false,
    data_management boolean DEFAULT false,
    manage_users boolean DEFAULT false,
    manage_alumni_network boolean DEFAULT false,
    master_data boolean DEFAULT false,
    rbac boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT now()
);

-- Insert baseline permissions if the table is empty
INSERT INTO role_permissions (role, dashboard, reports, crm, data_management, manage_users, manage_alumni_network, master_data, rbac) VALUES 
('Super Admin', true, true, true, true, true, true, true, true),
('Admin', true, true, true, true, true, true, true, true),
('Manager', true, true, true, false, false, true, false, false),
('Program', true, true, true, false, false, true, false, false),
('Operations', true, true, true, false, false, true, false, false),
('Viewer', true, false, false, false, false, false, false, false),
('Member', true, false, false, false, false, false, false, false)
ON CONFLICT (role) DO NOTHING;

-- Enable RLS and add a policy for Admins/Super Admins
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Note: Drop existing policies first if you are updating them, otherwise they will throw an error
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON role_permissions;
CREATE POLICY "Allow read access for authenticated users" 
ON role_permissions FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Allow update for Super Admin and Admin" ON role_permissions;
CREATE POLICY "Allow update for Super Admin and Admin" 
ON role_permissions FOR UPDATE 
TO authenticated 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Super Admin', 'Admin') 
);

-- Create Edit Log Table
CREATE TABLE IF NOT EXISTS rbac_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    changed_by text NOT NULL,
    snapshot jsonb NOT NULL
);

ALTER TABLE rbac_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access for authenticated users" ON rbac_audit_logs;
CREATE POLICY "Allow read access for authenticated users" 
ON rbac_audit_logs FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Allow insert for Super Admin and Admin" ON rbac_audit_logs;
CREATE POLICY "Allow insert for Super Admin and Admin" 
ON rbac_audit_logs FOR INSERT 
TO authenticated 
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') IN ('Super Admin', 'Admin') 
);
```
