# Project Overview: BusTrackerBo

## Summary

**BusTrackerBo** is a public web app that tracks **intercity bus prices in Bolivia**. Users pick an origin, destination, and date — then see a **price history chart** for that route. The app does not sell tickets; it helps travelers spot trends and find cheaper travel days.

UI reference: [Busbud](https://www.busbud.com) search results (clean blue/white design, search bar, date+price strip, card layout).

## Key Details

| Field | Value |
|-------|-------|
| **Project name** | BusTrackerBo |
| **Package** | `bustrackerbo` |
| **Framework** | Astro 7 |
| **Language** | TypeScript |
| **Node** | >= 22.12.0 |
| **Data store (v1)** | Tab-delimited TXT (`data/prices.txt`) |
| **CI/CD** | GitHub Actions (build + daily price fetch) |
| **UI language** | Spanish (`es-BO`) first |

## Core Features (v1)

1. **Route search** — Origin and destination city picker with date; swap button between cities.
2. **Price chart** — Line/area chart showing lowest daily price over the last ~30 days for the selected route.
3. **Date price carousel** — Horizontal strip of upcoming dates with price under each day (Busbud-style).
4. **Daily price updates** — GitHub Actions runs a script every day, appends new observations to `data/prices.txt`, commits to the repo.
5. **Operator breakdown** (v1.1) — List of operators and their prices for the selected date.

## Non-Goals (v1)

- Live GPS bus tracking
- Flight schedules or prices
- Ticket booking or payments
- User accounts or saved searches
- SQL/Postgres database (TXT file is the v1 database)

## Target Users

Travelers planning intercity trips in Bolivia — especially routes between major cities:

| City | Slug | Notes |
|------|------|-------|
| Santa Cruz de la Sierra | `santa-cruz` | Largest city; hub for eastern Bolivia |
| La Paz | `la-paz` | Administrative capital (El Alto airport) |
| Cochabamba | `cochabamba` | Central hub |
| Tarija | `tarija` | Southern wine region |
| Sucre | `sucre` | Constitutional capital |
| Oruro | `oruro` | Carnival destination |

## Seed Routes

Initial routes to track (see `data/routes.txt`):

- Santa Cruz → Tarija (reference route from Busbud screenshot)
- Santa Cruz → La Paz
- La Paz → Cochabamba
- Cochabamba → Santa Cruz
- La Paz → Sucre

## Bolivia-Specific Context

- **Informal pricing**: Prices vary by operator, seat class, and day; scrape/fetch may return multiple rows per route per day.
- **Strikes and blockades**: Road blockades can suspend service; the UI should support info banners (`AlertBanner`) for travel advisories.
- **Currency**: Prices displayed in Bolivianos (`Bs.` / `BOB`); USD conversion optional later.
- **Long trips**: Intercity journeys often exceed 10 hours (e.g. Santa Cruz → Tarija ~12h); duration is metadata, not the primary focus.

## App Flow

```
Home (index.astro)
  ├── SearchBar: origin, destination, date → Buscar
  ├── DatePriceCarousel: next 7 days with min price each
  └── PriceChart: historical prices for selected route
        └── OperatorRow list (optional v1.1)
```

## Key Files

| File | Purpose |
|------|---------|
| `src/pages/index.astro` | Home page — search + chart |
| `data/prices.txt` | Append-only price database |
| `data/routes.txt` | Routes fetched daily by GHA |
| `scripts/fetch-prices.mjs` | Daily price fetcher |
| `src/lib/prices.ts` | Parse and query TXT data |
| `AI/skills/ui-design-system.md` | Component and design spec |

## Related Docs

- [Architecture](architecture.md)
- [UI Design System](ui-design-system.md)
- [TXT Database Schema](txt-database-schema.md)
- [Data Pipeline](data-pipeline.md)
- [CI/CD](cicd-github-actions.md)
