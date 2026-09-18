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
3. Gate the route. In a Server Component page:
   ```tsx
   const denied = await denyUnlessAccess('crm.new_feature');
   if (denied) return denied;
   ```
   If the page is a Client Component, put the same guard in a sibling
   `layout.tsx` (see `src/app/(dashboard)/data-management/import/layout.tsx`).
4. Hide the entry point. Add the resource check to the sidebar entry in
   `src/components/app-sidebar.tsx` (`can('crm.new_feature')`) and to the hub
   card list, so nobody is shown a link they cannot open.
5. **Seed the permission** in a migration. The engine is fail-closed, so a newly
   registered resource grants nobody anything — including Admins who already
   have rows for other resources — until a `rbac_permissions` row exists. See
   `supabase/migrations/20260918000001_rbac_full_route_coverage.sql`.
6. Once added to `PERMISSION_RESOURCES`, the UI at `/manage/rbac` will automatically render checkboxes for it.

## Denying Access: hide first, explain second

Never bounce a user to the homepage as the primary access control.

1. **Hide or disable the entry point.** Sidebar entries, hub cards, and row
   actions are rendered from the user's permission map, so a restricted area is
   simply not offered. Client components read it with `useCan()` /
   `useCanAny()` from `@/contexts/permission-context`; server components read it
   with `getCurrentUserPermissions()`.
2. **Explain on direct navigation.** A user who follows a bookmark or a shared
   link to a restricted page gets the `<AccessDenied />` card naming the
   resource, with a link back to the nearest hub. The guards in
   `src/lib/guard.tsx` return it for you.
3. **A redirect is the fallback only** — for unauthenticated users (handled by
   the middleware) and for legacy route stubs that forward to their canonical
   URL.

## How the Engine Works

- The access rights are stored in the `rbac_permissions` table in the Supabase database.
- A centralized helper `checkAccess(userId, resourceId, action)` in `src/lib/permissions.ts` is the single source of truth for authorization.
- `getCurrentUserPermissions()` resolves the whole map once per request (memoised with React `cache`), and feeds the page guards, the sidebar, and the hub cards.
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
