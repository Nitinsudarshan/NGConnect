# NGConnect Roles and User Categories

This document outlines the various authentication roles and teams into which users are split within the NGConnect application. These are primarily defined in `src/lib/roles.ts` and `src/types/globals.d.ts`.

## 1. Authentication Roles (`UserRole`)
These roles define the primary permission level and access capabilities of a user across the platform.

- **Super Admin**: Has complete access to all system features, bypassing all role checks. (Also manually configurable via `MASTER_USER_ID` or specific `SUPER_ADMIN_EMAILS`).
- **Admin**: Full administrative access, though slightly below Super Admin in hardcoded override hierarchies.
- **Manager**: Managerial access for overseeing operations or specific domains.
- **Program**: Role specifically designated for users belonging to the Program team.
- **Operations**: Role specifically designated for users belonging to the Operations team.
- **Viewer**: Read-only access to various modules.
- **Member**: Standard registered member of the platform. This is the default fallback role for any authenticated user without an explicit role assigned.

---

## 2. Teams (`UserTeam`)
Users can be categorized into specific teams for organizational structure.

- **CEO's Office**
- **Alumni Growth**
- **PNC**
- **Finance**
- **None**: Default for users not assigned to any specific internal team.
