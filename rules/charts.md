---
globs: **/*.tsx
---

# Charts, Graphs, and Data Visualizations

CONTEXT: This applies specifically to CHARTS, GRAPHS, and DATA VISUALIZATIONS 
in NGConnect (Recharts components) — not general UI colors, buttons, or badges.

Use this decision framework whenever you write or edit a chart:

## Color Tokens

Already defined in globals.css `@theme`:
- `--color-chart-primary` (brand green, #77bc45 light / #8fd35f dark)
- `--color-chart-accent` (teal, #0d9488 light / #2dd4bf dark)
- `--color-chart-success` (#16a34a light / #4ade80 dark)
- `--color-chart-danger` (#dc2626 light / #f87171 dark)
- `--color-chart-warning` (#d97706 light / #fbbf24 dark)
- `--color-chart-neutral` (#9ca3af light / #6b7280 dark)
- `--color-chart-grid`, `--color-chart-text`, `--color-chart-surface`

## How Many Colors to Use

Decide by what the chart is actually showing:

### 1 Color (`--color-chart-primary` only)
Use when: a single metric, single series over time, or one hero number.
Examples: "Total alumni over time" line chart, "New signups this month" bar chart.
Everything else in the chart (axis, grid, labels) uses neutral/gray tokens — never invent a second data color just to fill space.

### 2 Colors (`--color-chart-primary` + `--color-chart-accent`)
Use when: comparing exactly two series or two time periods.
Examples: "This year vs last year," "Active vs inactive alumni," "Mentors vs mentees" side-by-side bars.
Primary = the subject being emphasized; accent = the comparison point.

### 3 Colors (`--color-chart-primary` + `--color-chart-accent` + `--color-chart-neutral`)
Use when: comparing two meaningful series PLUS a residual/other category.
Examples: a donut/bar with "Engineering," "Design," and "Other" — the first two get primary/accent, everything long-tail gets neutral (never a 3rd bright hue).
Also use 3 colors for semantic delta charts: primary (current value) + success (increase) + danger (decrease).

### 4+ Colors
AVOID for standard charts. If a chart seems to need 4+ distinct data colors, that's a signal to change the CHART TYPE, not add more hues:
- Convert to a stacked/grouped bar with ONE hue at varying opacity, OR
- Break into small multiples (several 1-color charts side by side), OR
- Fold minor categories into "Other" (neutral gray) and keep only the top 2-3 as named colors, OR
- Use a table instead of a chart if there are more than ~5-7 categories that all matter individually.

## Semantic Colors

Success/danger/warning are reserved ONLY for:
- Trend indicators (up/down arrows, delta badges)
- Status/alert states (e.g. "at risk," "flagged")

Never use success/danger/warning as general categorical colors for unrelated data series — they carry meaning and must stay reserved for that.

## Hard Rules

- **Never** cycle through all 6 tokens like a rainbow palette.
- **Every chart** must work in both light and dark mode via the CSS variables — never hardcode hex values directly in a Recharts component.
- **Gridlines, axis text, and chart background** always use `--color-chart-grid` / `--color-chart-text` / `--color-chart-surface`, never primary/accent/success/danger/warning.
- **When in doubt, use fewer colors.** A chart that needs a legend to explain 6 colors is a chart that should be redesigned.
