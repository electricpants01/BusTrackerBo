# Tech Stack: BusTrackerBo

## Framework & Runtime

| Technology | Version / Details |
|------------|-------------------|
| **Astro** | ^7.0.9 |
| **Node.js** | >= 22.12.0 |
| **TypeScript** | Via `tsconfig.json` |
| **Package manager** | npm |

## Styling

| Tool | Purpose |
|------|---------|
| **Tailwind CSS v4** | Utility-first styling (add via `astro add tailwind`) |
| **`src/styles/tokens.css`** | CSS custom properties for design tokens (colors, radius, shadows) |

Design tokens are defined in [`ui-design-system.md`](ui-design-system.md) and mirrored in `tokens.css`.

## Charts

| Library | Purpose |
|---------|---------|
| **Chart.js 4** | Price history line/area chart in `PriceChart.astro` |

Chart.js runs client-side via an Astro `<script>` block or a small island component. Configuration defaults live in `src/lib/chart-config.ts`.

## Data Layer

| Component | Details |
|-----------|---------|
| **Storage** | Tab-delimited TXT file at `data/prices.txt` |
| **Route list** | `data/routes.txt` — origin/destination slugs per line |
| **Parser** | `src/lib/prices.ts` — read, filter, aggregate for chart |
| **City registry** | `src/lib/cities.ts` — slug → display name (`es-BO`) |

No external database in v1. Migration path to SQLite or Postgres is noted in [architecture.md](architecture.md) for when row volume grows.

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/fetch-prices.mjs` | Daily fetch: read routes, get prices, append to `prices.txt` |
| `scripts/validate-prices.mjs` | Validate TXT schema before GHA commit |

Run locally: `node scripts/fetch-prices.mjs` (requires network if hitting external sources).

## CI/CD

| Tool | Details |
|------|---------|
| **GitHub Actions** | `build.yml` (push/PR), `fetch-prices.yml` (daily cron) |
| **Deploy** | GitHub Pages or Netlify (Phase 5 — TBD) |

See [cicd-github-actions.md](cicd-github-actions.md) for workflow details.

## Dev Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server at `localhost:4321` |
| `astro dev --background` | Start dev server in background (preferred for agents) |
| `npm run build` | Production build to `./dist/` |
| `npm run preview` | Preview production build |

## Planned Dependencies (Phase 1–3)

Add when implementing:

```json
{
  "dependencies": {
    "chart.js": "^4"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4",
    "tailwindcss": "^4"
  }
}
```

Exact versions pinned at install time via `astro add tailwind` and `npm install chart.js`.

## i18n

- UI strings: Spanish (`es-BO`) — hardcoded in components for v1.
- Code, comments, AI docs: English.
- Future: Astro i18n or a simple `src/lib/i18n.ts` string map if English locale is added.

## Related Docs

- [UI Design System](ui-design-system.md)
- [Architecture](architecture.md)
- [TXT Database Schema](txt-database-schema.md)
