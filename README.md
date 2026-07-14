# BusTrackerBo

Bolivia intercity **bus price tracker**. Search a route, compare operators, and view price history in a Busbud-inspired UI (Spanish, `es-BO`).

Built with [Astro](https://astro.build) (SSR), [Chart.js](https://www.chartjs.org/), and Tailwind CSS.

## Features

- **Route search** — 9 cities, all bidirectional pairs (72 routes), city combobox with autocomplete
- **Date carousel** — 7-day price tabs with minimum fare per day
- **Operator chart** — one line per bus company on the selected route
- **Operator list** — prices for the selected travel date
- **TXT database** — tab-delimited `data/prices.txt`, append-only, committed to git

## Data sources

Prices come from real websites (no mock data):

| Source | Tag | Notes |
|--------|-----|-------|
| [Tickets Bolivia](https://www.ticketsbolivia.com) travel pages | `ticketsbolivia-travel` | Multiple operators per route; reference “from” prices |
| [Busbud](https://www.busbud.com) route pages | `busbud` | Bolivia routes where listed (e.g. Santa Cruz ↔ Tarija) |

Configure sources in `data/fetch-config.json`.

## Price fetch (production)

The fetch script reads **all routes** from `data/routes.txt` and appends rows to `data/prices.txt`.

**Window logic (weekly cron):**

1. Read the **latest `travel_date`** already in `prices.txt`
2. Fetch the **next 7 days** starting **the day after** that date (no overlap)
3. If the file is empty, start from **tomorrow** for 7 days
4. Append one row per **operator × travel day × source**

```bash
# Sync 72 bidirectional routes (9×8 cities)
npm run fetch-prices:sync-routes

# Fetch all routes (both sources, 7-day window)
npm run fetch-prices

# Validate prices.txt
npm run validate-prices

# Test a subset
node scripts/fetch-prices.mjs --limit-routes=10
node scripts/fetch-prices.mjs --days=7
```

### GitHub Actions

Workflow [`.github/workflows/fetch-prices.yml`](.github/workflows/fetch-prices.yml):

| Trigger | Schedule |
|---------|----------|
| **Automatic** | Every **Monday** at 06:00 UTC (~02:00 Bolivia) |
| **Manual** | Actions → **Fetch Prices** → **Run workflow** |

Each run commits updates to `data/prices.txt` when rows change.

## Local development

**Requirements:** Node.js ≥ 22.12

```bash
npm install
npm run dev          # http://localhost:4321
```

Example URL with query params:

```text
http://localhost:4321/?origin=la-paz&destination=uyuni&date=2026-07-15
```

The home page uses **SSR** (`@astrojs/node`) so search params resolve against live `prices.txt`.

```bash
npm run build
npm run preview
```

## Project structure

```text
/
├── data/
│   ├── cities.json         # City slugs + Tickets Bolivia / Busbud IDs
│   ├── fetch-config.json   # Sources, daysAhead, rates, delays
│   ├── prices.txt          # Price database (append-only)
│   └── routes.txt          # Routes to fetch (origin → destination)
├── scripts/
│   ├── fetch-prices.mjs    # Main fetch orchestrator
│   ├── validate-prices.mjs
│   ├── lib/                # dates, routes, sources registry
│   └── sources/
│       ├── ticketsbolivia-travel.mjs
│       ├── ticketsbolivia.mjs   # Live search (optional)
│       └── busbud.mjs
├── src/
│   ├── components/
│   │   ├── prices/         # Chart, carousel, operator rows
│   │   └── search/         # SearchBar, CityCombobox
│   ├── lib/                # prices.ts, cities.ts, chart-config
│   └── pages/
│       └── index.astro     # Home / search results
├── .github/workflows/      # fetch-prices.yml (+ build)
└── AI/                     # Extended docs for contributors
```

## Data format

`data/prices.txt` is tab-separated:

```text
fetched_at  origin_slug  destination_slug  travel_date  operator  price_bob  currency  source
```

See [`AI/skills/txt-database-schema.md`](AI/skills/txt-database-schema.md) for full schema.

## Documentation

Extended docs for contributors and agents: [`AI/README.md`](AI/README.md)

- [Data pipeline](AI/skills/data-pipeline.md)
- [Data sources](AI/skills/data-sources.md)
- [CI/CD](AI/skills/cicd-github-actions.md)
- [UI design system](AI/skills/ui-design-system.md)

## License

TBD
