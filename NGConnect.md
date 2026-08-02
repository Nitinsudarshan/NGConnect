# NGConnect Web Application Documentation (Comprehensive)

## 1. Overview
**NGConnect** is a robust, full-stack administrative platform built to serve as the central nervous system for managing the NavGurukul alumni network. It acts as an overarching workspace where administrators, program managers, and operators can manage massive datasets (such as GHAR-imported data and Coursera learner metrics) securely. Simultaneously, it serves as a self-service profile portal for alumni (Members) to update their personal and professional details.

## 2. Technology Stack & Core Tooling
The application uses a highly modern, bleeding-edge React ecosystem to ensure high performance, security, and developer experience.

### 2.1 Framework & Core Libraries
- **Framework:** [Next.js](https://nextjs.org/) version 16.1.6 using the App Router (`src/app`) for seamless Server Components, streaming, and nested layouts.
- **Language:** TypeScript 5+ for end-to-end type safety.
- **React:** React & React DOM version 19.2.3, leveraging the latest concurrent features.

### 2.2 Styling & UI Components
- **CSS Engine:** [Tailwind CSS v4](https://tailwindcss.com/) with PostCSS.
- **Component Library:** [Shadcn UI](https://ui.shadcn.com/) which provides unstyled, accessible React components built on top of Radix UI primitives.
- **Icons:** `lucide-react` for consistent SVG iconography.
- **Animations:** `tw-animate-css` integrated with Tailwind for micro-interactions.
- **Data Visualization:** `recharts` for rendering interactive dashboard metrics and charts.
- **Toast Notifications:** `sonner` for highly responsive, non-intrusive alerts.

### 2.3 Backend & Infrastructure
- **Database:** PostgreSQL hosted on [Supabase](https://supabase.com/).
- **Authentication:** `@supabase/ssr` (Server-Side Rendering Auth) and `@supabase/supabase-js`.
- **Data Parsing:** `xlsx` for parsing complex Excel and CSV imports directly within API routes or client components.

## 3. Application Architecture

### 3.1 Routing & Middleware
- **`src/middleware.ts`**: The application's frontline defense. It intercepts requests, validates the Supabase auth session, refreshes tokens via `updateSession`, and redirects unauthorized users away from protected routes.
- **App Router (`src/app`)**:
  - **`(dashboard)/`**: The primary layout encompassing the Sidebar, Header, and main workspace. It fetches the user's role on the server and wraps the UI in a `UserProvider` Context.
  - **`api/alumni/`**: Contains endpoints like `/import` (for bulk GHAR imports), `/admin` (for administrative overrides), and `/[email]` (for retrieving specific alumni records).
  - **`api/coursera/`**: Contains heavy data-processing endpoints for Coursera (`/import`, `/learner`, `/metrics`, `/recalculate`, `/rollback`, `/template`).
  - **`auth/` & `login/`**: Handles login flows and Supabase OAuth callbacks.

### 3.2 Utilities & State Management
- **`src/contexts/user-context.tsx`**: Provides the current user's ID, Name, Email, Avatar, Role, and `isAlumni` flag to all child Client Components.
- **`src/components/ui/`**: Houses all base Shadcn UI components (buttons, dialogs, dropdowns).
- **`src/components/`**: Houses composite, domain-specific components like `app-sidebar.tsx`, `site-header.tsx`, `dashboard-greeting.tsx`, and `dashboard-stats.tsx`.
- **`src/lib/supabase/`**: Contains initialized Supabase clients for different contexts: `server.ts` (for Server Components), `client.ts` (for Client Components), and `admin.ts` (using the Service Role key to bypass Row Level Security for critical internal tasks).

## 4. Roles, Teams, & Access Control
Access control in NGConnect is highly granular and managed via `src/lib/roles.ts`.

### 4.1 System Roles
A user can have one of the following primary roles:
- **Super Admin**: Highest level access, hardcoded by specific emails (e.g., `nitin@navgurukul.org`). Bypasses all Role and RLS checks.
- **Admin**: Full administrative access. A `MASTER_USER_ID` environment variable allows omnipresent fallback access.
- **Manager**: Specific administrative functions with tailored read/write permissions.
- **Program / Operations**: Internal staff roles.
- **Viewer**: Read-only access to specific dashboards.
- **Member**: Standard Alumni user. This is the default fallback role for unassigned users.

### 4.2 Teams
- **Teams:** `CEO's Office`, `Alumni Growth`, `PNC`, `Finance`, or `None`.

### 4.3 Developer Overrides
The `getUserRole` utility supports a `dev-role-override` cookie, allowing Admins or Super Admins to safely spoof their role (e.g., viewing the UI exactly as a 'Member' would see it) without altering the actual database claims.

## 5. The Audit & Data Management Engine
Because NGConnect handles critical organizational data, it incorporates a foolproof audit engine (`src/lib/audit.ts`).

### 5.1 Setting Audit Context
Before any server-side database write (like an import), the API calls `setAuditContext`. This executes a PostgreSQL `set_config` RPC call to inject the current user's name and role into the database's local transaction context.

### 5.2 Row-Level Database Triggers
Whenever a row in tables like `alumni_master` is modified, a database trigger (`trg_audit_alumni_master`) fires. This trigger reads the local transaction context (set by `setAuditContext`) and automatically appends a detailed record into the `audit_log` table, guaranteeing that no change goes untracked, even if it happens via raw SQL.

## 6. Core Modules & Dashboards

### 6.1 The Data Management Hub (`/data-management`)
This is the most complex module, handling bulk data ingestion:
- **GHAR Imports (`/import`)**: Ingests thousands of alumni records from GHAR via CSV/XLSX. Creates an `import_batch` and generates `import_batch_records` for every row, noting successes, skips, and failures.
- **Coursera Imports (`/import-coursera`)**: Processes learner metrics and course completions from Coursera exports.
- **Rollback (`/rollback`)**: Allows an Admin to undo a specific import batch, utilizing the `audit_log` to restore prior values.

### 6.2 The Master Data Hub (`/manage/master-data`)
Provides a UI for Admins to maintain lookup tables to ensure data consistency during imports:
- **Campuses (`ng_campuses`)**: Active/Closed operational hubs.
- **Courses (`ng_courses`)**: E.g., School of Programming, School of Finance.
- **Education (`highest_education`)**: Permitted education strings.

### 6.3 The Profile System (`/profile` vs `/manage/alumni-network`)
To prevent alumni from modifying official organizational records (like their starting salary or placement status), the data model is split:
- **`alumni_master`**: Admin-only table containing official GHAR data.
- **`alumni_profile`**: Self-service table linked via a foreign key, where alumni can update their bio, GitHub profile, current salary, and mentoring interests.
The Alumni Network page (`/manage/alumni-network`) seamlessly merges these two tables in the UI to give admins a complete 360-degree view of an individual.
