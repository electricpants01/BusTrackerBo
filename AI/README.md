# AI Documentation — BusTrackerBo

This folder contains project documentation for AI agents (Cursor, Claude) and human contributors. Read these files before implementing features.

## What is BusTrackerBo?

A **Bolivia intercity bus price tracker**. Users search a route (origin → destination, date) and see **historical and current prices** in a Busbud-inspired UI: search bar on top, price chart below.

## Reading order

1. [`plan.txt`](plan.txt) — phased roadmap and current status
2. [`skills/project-overview.md`](skills/project-overview.md) — goals, scope, Bolivia context
3. [`skills/architecture.md`](skills/architecture.md) — folder layout, data flow
4. [`skills/ui-design-system.md`](skills/ui-design-system.md) — **read before any UI work**
5. [`skills/txt-database-schema.md`](skills/txt-database-schema.md) — price data format
6. [`skills/data-pipeline.md`](skills/data-pipeline.md) — how daily fetch → TXT → chart works
7. [`skills/data-sources.md`](skills/data-sources.md) — where prices come from
8. [`skills/cicd-github-actions.md`](skills/cicd-github-actions.md) — CI and daily fetch workflows
9. [`skills/tech-stack.md`](skills/tech-stack.md) — libraries and versions

## Agent instructions

- **UI changes**: follow [`skills/ui-design-system.md`](skills/ui-design-system.md). Reuse components from `src/components/`; do not one-off inline styles.
- **Price data**: never edit `data/prices.txt` by hand in production logic — append via `scripts/fetch-prices.mjs` or documented seed scripts only.
- **Dev server**: use `astro dev --background` (see root [`AGENTS.md`](../AGENTS.md)).
- **Language**: UI labels in Spanish (`es-BO`) first; code and docs in English.

## Quick links

| Topic | File |
|-------|------|
| Roadmap | [`plan.txt`](plan.txt) |
| Components | [`skills/ui-design-system.md`](skills/ui-design-system.md) |
| TXT database | [`skills/txt-database-schema.md`](skills/txt-database-schema.md) |
| GitHub Actions | [`skills/cicd-github-actions.md`](skills/cicd-github-actions.md) |
