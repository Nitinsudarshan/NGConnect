# Role-Based Access Control (RBAC) Settings

This project uses a highly granular, resource-based Role-Based Access Control (RBAC) system. Access is assigned at the **Role** level and can be overridden at the **Individual User** level.

> **Team-based permissions are retired.** A user's team (`CEO's Office`, `Alumni Growth`, `PNC`, `Finance`, `None`) is an organisational label only — it never grants or revokes access. `subject_type = 'team'` rows were dropped in migration `20260918000000_drop_team_rbac.sql` and the database now rejects them.

## CRITICAL RULE: Registering New Features
**Every time a new feature, page, or module is built, it MUST be added to the RBAC Matrix.** 
If you build something new, you are strictly required to ensure it is manageable from `http://localhost:3000/manage/rbac`.

To do this:
1. Open `src/lib/resource-tree.ts`.
2. Add a new `PermissionResource` entry to the `PERMISSION_RESOURCES` array.
   - Example: `{ id: 'crm.new_feature', label: 'My New Feature', cluster: 'crm', actions: ['view', 'edit'] }`
3. Ensure that your new route/component uses `checkAccess(userId, 'crm.new_feature', 'view')` to enforce the permission.
4. Once added to `PERMISSION_RESOURCES`, the UI at `/manage/rbac` will automatically render checkboxes for it.

## How the Engine Works

- The access rights are stored in the `rbac_permissions` table in the Supabase database.
- A centralized helper `checkAccess(userId, resourceId, action)` in `src/lib/permissions.ts` is the single source of truth for authorization.
- Access is enforced at the individual component level or the layout level.
- **Fail-Closed Design:** If neither a user nor their role has an explicit `true` value for a resource in the database, access is **denied**.
- **Super Admins:** Hardcoded bypasses exist for Super Admins. They implicitly pass all `checkAccess` gates without needing database records.

## Database Schema 

The system relies on two tables. (If you ever need to recreate them, you can run the `rbac_setup.sql` script located in the root directory).

1. **`rbac_permissions`**: 
   - `subject_type`: 'role' or 'user' (enforced by a CHECK constraint)
   - `subject_id`: The role name or the user's UUID
   - `resource_id`: The ID string from `resource-tree.ts`
   - `can_view`, `can_edit`, `can_delete`: Boolean toggles

2. **`rbac_audit_logs`**:
   - Stores snapshots of changes made via the RBAC UI so that Admins can instantly rollback accidental lockouts.

## Hierarchy & Precedence
When evaluating if a user has access to edit `crm.workspace`:
1. Check if the **User ID** has a specific override. If found, use it.
2. If not, fallback to the user's base **Role**.
3. If no records exist anywhere, deny access.

Only these two tiers exist. Do **not** reintroduce a team tier — it made effective
access ambiguous whenever a role grant and a team grant disagreed.
