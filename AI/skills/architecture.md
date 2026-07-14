# Architecture: BusTrackerBo

## Pattern: Static Site + File Database

BusTrackerBo is a **static Astro site** that reads price history from a **committed TXT file**. A daily GitHub Actions job appends new price rows; the site rebuilds (or reads at build time) and renders charts. No runtime server or external DB in v1.

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions (daily)                  │
│  fetch-prices.mjs → append data/prices.txt → git commit     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     data/prices.txt                         │
│  Tab-delimited append-only price history                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ read at build / request
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     src/lib/prices.ts                       │
│  parse → filter by route → aggregate min/day → chart data   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Astro pages + components                │
│  SearchBar → PriceChart, DatePriceCarousel                  │
└─────────────────────────────────────────────────────────────┘
```

## Repository Layout

```text
BusTrackerBo/
├── AI/                              # Agent documentation
│   ├── README.md
│   ├── plan.txt
│   └── skills/
├── data/
│   ├── prices.txt                   # Append-only price DB (GHA writes)
│   └── routes.txt                   # Routes to fetch daily
├── scripts/
│   ├── fetch-prices.mjs             # Daily price fetcher
│   └── validate-prices.mjs          # Schema validation
├── src/
│   ├── components/
│   │   ├── layout/                  # Header, Footer
│   │   ├── search/                  # SearchBar, CityInput, DatePicker, SwapButton
│   │   ├── prices/                  # PriceChart, DatePriceCarousel, PriceBadge, OperatorRow
│   │   └── ui/                      # Button, Card, Icon, AlertBanner
│   ├── layouts/
│   │   └── BaseLayout.astro         # Page shell with Header/Footer
│   ├── lib/
│   │   ├── prices.ts                # TXT parser and query functions
│   │   ├── cities.ts                # City slug registry
│   │   └── chart-config.ts          # Chart.js defaults
│   ├── pages/
│   │   └── index.astro              # Home: search + chart
│   └── styles/
│       └── tokens.css               # Design tokens
├── .github/workflows/
│   ├── build.yml
│   └── fetch-prices.yml
├── public/
│   └── favicon.svg
├── astro.config.mjs
└── package.json
```

## Data Flow

### Read path (site)

1. User selects origin, destination, date in `SearchBar`.
2. Page calls `getPriceHistory(origin, destination, days)` from `prices.ts`.
3. `prices.ts` reads `data/prices.txt`, filters rows matching route slugs.
4. Aggregates minimum `price_bob` per `travel_date` for the chart.
5. `PriceChart` renders Chart.js dataset; `DatePriceCarousel` shows next 7 days.

### Write path (GHA)

1. Cron triggers `fetch-prices.yml` (daily ~06:00 UTC).
2. `fetch-prices.mjs` reads `data/routes.txt`.
3. For each route, fetches/scrapes prices for upcoming travel dates.
4. Appends new rows to `data/prices.txt` (never deletes history).
5. `validate-prices.mjs` checks schema.
6. Bot commits and pushes if file changed.

## Domain Types

```typescript
// src/lib/prices.ts (conceptual)

interface PriceRow {
  fetchedAt: string;       // ISO 8601 UTC
  originSlug: string;      // e.g. "santa-cruz"
  destinationSlug: string; // e.g. "tarija"
  travelDate: string;      // YYYY-MM-DD
  operator: string;        // e.g. "SAMA"
  priceBob: number;
  currency: string;        // "BOB"
  source: string;          // e.g. "busbud-scrape"
}

interface DailyPrice {
  date: string;
  minPrice: number;
  operators: { name: string; price: number }[];
}

interface RouteQuery {
  origin: string;
  destination: string;
  travelDate?: string;
}
```

## Component Hierarchy

```
BaseLayout
└── index.astro
    ├── Header
    ├── SearchBar
    │   ├── CityInput (origin)
    │   ├── SwapButton
    │   ├── CityInput (destination)
    │   ├── DatePicker
    │   └── Button (Buscar)
    ├── DatePriceCarousel
    │   └── PriceBadge (× N dates)
    ├── PriceChart
    └── OperatorRow[] (optional)
    └── Footer
```

## Query Functions (`src/lib/prices.ts`)

| Function | Returns | Used by |
|----------|---------|---------|
| `parsePricesFile(path?)` | `PriceRow[]` | Internal |
| `getPriceHistory(origin, dest, days?)` | `DailyPrice[]` | PriceChart |
| `getMinPriceForDate(origin, dest, date)` | `number \| null` | DatePriceCarousel |
| `getLatestFetch(origin, dest)` | `string \| null` | "Last updated" badge |
| `getOperatorsForDate(origin, dest, date)` | `{ name, price }[]` | OperatorRow |

## Migration Path (future)

When `prices.txt` grows beyond ~50k rows or query performance matters:

1. Import TXT into SQLite (`data/prices.db`) via a one-time script.
2. GHA appends to SQLite instead of TXT.
3. `prices.ts` reads from SQLite at build time (or via Astro server endpoint if SSR is added).

TXT format stays the interchange format for backups and manual inspection.

## Related Docs

- [TXT Database Schema](txt-database-schema.md)
- [Data Pipeline](data-pipeline.md)
- [UI Design System](ui-design-system.md)
