# NGConnect AI Agent Guidelines

This is a **Next.js + TypeScript + Supabase + shadcn/ui** project (NGConnect). You **must follow** all rules in the `rules/` directory for any code change in this repo.

## Rule Index

- [global.md](rules/global.md): Master index and precedence rules.
- [code-standards.md](rules/code-standards.md): TypeScript and React conventions.
- [component-architecture.md](rules/component-architecture.md): Component organization and splitting.
- [project-structure.md](rules/project-structure.md): Folder layout and where new files go.
- [design-system.md](rules/design-system.md): Design tokens (colors, spacing, radius, typography).
- [ui-components.md](rules/ui-components.md): shadcn/ui usage and styling conventions, including charts.
- [charts.md](rules/charts.md): Charts, graphs, and data visualizations.
- [responsive-design.md](rules/responsive-design.md): Mobile-first responsive layout rules.
- [accessibility.md](rules/accessibility.md): Accessibility requirements for UI.
- [documentation.md](rules/documentation.md): Code commenting and documentation format.
- [data-access.md](rules/data-access.md): Supabase client usage, RLS, and data-fetching.
- [security.md](rules/security.md): Secrets, environment variables, and auth handling.
- [server-client-boundary.md](rules/server-client-boundary.md): Server vs Client Component usage in the App Router.
- [forms-and-validation.md](rules/forms-and-validation.md): Standard form pattern (shadcn Form + react-hook-form + zod).
- [testing.md](rules/testing.md): What to test, framework, and file placement.
- [data-import.md](rules/data-import.md): Excel/CSV import safety (alumni, Coursera).
- [api-conventions.md](rules/api-conventions.md): Route handler response shape, validation, and error handling.
- [performance.md](rules/performance.md): Bundle size, lazy loading, and memoization basics.
- [rbac-settings.md](rules/rbac-settings.md): RBAC system architecture and SQL configuration.

## Knowledge Graph

This project has a graphify knowledge graph at `graphify-out/`.

- Use `graphify query "<question>"` (CLI) for codebase/architecture questions when `graphify-out/graph.json` exists.
- Use `graphify path "<A>" "<B>"` to trace relationships between files/symbols.
- Use `graphify explain "<concept>"` for focused concept lookups.
- Read `graphify-out/GRAPH_REPORT.md` for a broad architecture overview.
- After modifying source files, run `graphify update .` to keep the graph current (AST-only, no API cost).
- The `/graphify` slash command re-runs the full graph pipeline.

## Precedence

If two rules conflict, resolve in this order (most specific wins):
1. A rule scoped to the exact file/folder being edited.
2. `security.md` / `data-access.md` / `data-import.md` (safety/correctness > style).
3. `server-client-boundary.md` / `api-conventions.md` (architecture correctness).
4. `code-standards.md` / `component-architecture.md` / `project-structure.md`.
5. `forms-and-validation.md` / `testing.md` / `performance.md`.
6. `design-system.md` / `ui-components.md` / `charts.md` / `responsive-design.md` / `accessibility.md`.
7. `documentation.md`.

## Known Drift

- `ui-components.md` mandates shadcn's chart wrapper (`ChartContainer`) for all charts/graphs. Several existing files still import `recharts` directly instead — see the "Known drift to clean up" section in that file before touching chart code.
- No test framework, form/validation library (`react-hook-form`/`zod`), is installed yet — `testing.md` and `forms-and-validation.md` define the standard to adopt going forward rather than what's already in place.

## Safety Requirements

- **Never** hardcode secrets or credentials in source code.
- **Never** bypass RLS assumptions; queries missing matching policies should fail closed.
- **Never** expose the Supabase service-role key to the browser or a Client Component.
- **Always** confirm with the user before running any script that mutates production data.
- **Always** re-validate file imports (alumni/Coursera spreadsheets) server-side, even if validated client-side first.