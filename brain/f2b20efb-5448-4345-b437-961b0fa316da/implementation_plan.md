# Add User Autocomplete to RBAC Grid

The goal is to replace the dumb text input on the "Individual User" tab of the RBAC matrix with a smart, debounced autocomplete search that queries Supabase Auth for users matching their name, email, or exact UUID.

## Proposed Changes

### 1. New Server Action
#### [NEW] [users.ts](file:///D:/Projects/NGConnect/src/app/actions/users.ts)
- Create a new server action `searchUsersAction(query: string)`.
- Uses `createAdminClient().auth.admin.listUsers()` to fetch all users (or paginate if necessary, but `listUsers` usually grabs up to 50 or 500, which is sufficient for an initial text match on small to medium orgs, though we'll filter it in memory).
- Filters the users where `email`, `user_metadata.full_name`, `user_metadata.name`, or `id` matches the query (case-insensitive).
- Returns a lightweight array: `Array<{ id: string, name: string, email: string }>`, capped at ~10 suggestions for UI performance.

### 2. Update RBAC Grid UI
#### [MODIFY] [rbac-grid.tsx](file:///D:/Projects/NGConnect/src/app/(dashboard)/manage/rbac/_components/rbac-grid.tsx)
- Add a new state variable `userSearchQuery` to track the input.
- Add `userSearchResults` to store the autocomplete dropdown items.
- Add `isSearching` boolean state.
- Add a `useEffect` hook that debounces `userSearchQuery` by ~300ms. If it has a value, it calls `searchUsersAction`.
- Render a dropdown container (`absolute top-full w-full bg-card shadow-md z-50 rounded-md border`) directly below the Input if `userSearchResults` has items.
- When a user clicks a suggestion from the dropdown, it sets `selectedSubject` to the user's UUID, updates the input to show their name/email (or clears it and uses a Badge to show the selected user), and closes the dropdown.

## Verification Plan
1. Type a partial name (e.g., "Nit") into the user search box.
2. Verify the dropdown appears with matching names/emails.
3. Click a user, verify the RBAC matrix loads their specific overrides (or an empty slate if none exist) based on their UUID.
