# NGConnect

**NGConnect** is a comprehensive internal platform designed to manage alumni engagement, career growth tracking, and learning center analytics (including Coursera integrations). It serves as both a CRM for alumni networks and a Learning Management System (LMS) analytics dashboard.

## 🚀 Key Features

* **Alumni Growth CRM:** Track alumni across multiple pipeline stages (Mentoring, Pay-forward, Placement). Record interaction outcomes, support areas, and follow-ups.
* **Learning Center Analytics:** Deep integration with Coursera data via XLSX imports. Track lifetime learners, active learning hours, compliance, and course completions via dynamic radial and pie charts.
* **Role-Based Access Control (RBAC):** Fine-grained permissions powered by database-backed resource permissions (`rbac_permissions`), Supabase RLS, and Next.js Middleware (`src/middleware.ts` for auth session management). Roles include **Super Admin**, **Admin**, **Manager**, **Program**, **Operations**, **Viewer**, and **Member**, categorized into teams (**CEO's Office**, **Alumni Growth**, **PNC**, **Finance**, **None**). See [`docs/ROLES.md`](docs/ROLES.md).
* **Modern Design System:** Built with Tailwind CSS v4 and `shadcn/ui`. Features a fully standardized OKLCH-based theme (Indigo primary, semantic status tokens), glassmorphism UI, and dark/light mode support.
* **Data Visualization:** Interactive and responsive charts powered by `recharts` for tracking campus distribution, gender stats, and learning KPIs.
* **Knowledge Graph:** Integrated `graphify` knowledge graph (`graphify-out/`) for seamless architectural visualization and AST-based AI codebase assistance.

## 🛠 Tech Stack

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
* **Language:** TypeScript
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
* **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security)
* **Forms & Validation:** React Hook Form + Zod
* **Charts:** Recharts
* **Emails:** Nodemailer

## 📦 Getting Started

### Prerequisites

* Node.js (v18 or higher recommended)
* A Supabase project (for Postgres DB and Authentication)

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   git clone https://github.com/Nitinsudarshan/NGConnect.git
   cd NGConnect
   npm install
   ```

2. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory based on `.env.example` (if provided), and fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
   *(Note: Never expose the `SUPABASE_SERVICE_ROLE_KEY` to the browser or client components).*

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗 Architecture & Code Standards

NGConnect enforces strict architectural boundaries and coding standards. Please review the `rules/` directory before contributing:

* **`rules/global.md`**: Master index and precedence rules.
* **`rules/server-client-boundary.md`**: Guidelines for Next.js App Router Server vs Client components.
* **`rules/data-access.md` & `rules/security.md`**: Safe Supabase client usage, RLS expectations, and credential management.
* **`rules/design-system.md` & `rules/charts.md`**: Design tokens, OKLCH color rules, and chart guidelines.
* **`rules/data-import.md`**: Safety requirements for Excel/CSV data imports (Alumni, Coursera).

> **Note on Graphify:** This project uses an automated knowledge graph. If you make architectural changes, you can run `graphify update .` locally to keep the `graphify-out/` index current for AI coding assistants.

## 🗄️ Database Schema

The backend relies on Supabase PostgreSQL with rigorous Row-Level Security (RLS) policies. Key domains include:
* **Core:** `alumni_master`, `alumni_profile`, `org_settings`
* **CRM Pipeline:** `alumni_interactions`, `interaction_outcomes`, `pipeline_stages`, `mentoring_attendance`
* **Learning Center:** `learning_courses`, `learning_sessions`, `learning_audiences`, `feedback_responses`
* **Integrations:** `import_batches`, `import_batch_records`, `user_integrations`

For raw SQL schemas, refer to the `.sql` files in the repository root.

## 📄 License

MIT
