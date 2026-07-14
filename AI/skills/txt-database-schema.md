# TXT Database Schema: BusTrackerBo

The **TXT file is the v1 database**. Price history is stored in a tab-delimited, append-only file committed to the repository and updated daily by GitHub Actions.

## Files

| File | Purpose | Written by |
|------|---------|------------|
| `data/prices.txt` | Price observations (one row per operator per fetch) | GHA / `fetch-prices.mjs` |
| `data/routes.txt` | Routes to fetch daily | Manual (seed), rarely changed |

## `data/prices.txt`

### Location

```
data/prices.txt
```

### Format

- **Encoding**: UTF-8
- **Delimiter**: Tab (`\t`)
- **Line ending**: LF (`\n`)
- **Header**: First line starts with `#` (comment); skipped on parse
- **Append-only**: New rows added at end; never delete or rewrite existing rows

### Header row

```text
# fetched_at	origin_slug	destination_slug	travel_date	operator	price_bob	currency	source
```

### Data rows

```text
2026-07-13T06:00:00Z	santa-cruz	tarija	2026-07-15	SAMA	255.00	BOB	busbud-scrape
2026-07-13T06:00:00Z	santa-cruz	tarija	2026-07-15	Trans Copacabana	280.00	BOB	busbud-scrape
2026-07-13T06:00:00Z	santa-cruz	tarija	2026-07-16	SAMA	230.00	BOB	busbud-scrape
2026-07-14T06:00:00Z	la-paz	cochabamba	2026-07-20	El Dorado	45.00	BOB	manual-seed
```

### Field definitions

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `fetched_at` | ISO 8601 UTC | yes | When this price was observed (`2026-07-13T06:00:00Z`) |
| `origin_slug` | string | yes | Origin city slug (lowercase, hyphenated) |
| `destination_slug` | string | yes | Destination city slug |
| `travel_date` | YYYY-MM-DD | yes | Date of travel (not fetch date) |
| `operator` | string | yes | Bus company name (e.g. `SAMA`, `Trans Copacabana`) |
| `price_bob` | decimal | yes | Price in Bolivianos, 2 decimal places |
| `currency` | string | yes | Always `BOB` for v1 |
| `source` | string | yes | Origin of data (e.g. `busbud-scrape`, `manual-seed`, `operator-site`) |

### Slug rules

- Lowercase, hyphen-separated: `santa-cruz`, `la-paz`, `cochabamba`
- Must match entries in `src/lib/cities.ts`
- Origin and destination are directional (`santa-cruz` → `tarija` is different from `tarija` → `santa-cruz`)

### Validation rules (`scripts/validate-prices.mjs`)

1. Header line must exist and start with `#`.
2. Each data row must have exactly 8 tab-separated fields.
3. `fetched_at` must parse as valid ISO 8601.
4. `travel_date` must match `YYYY-MM-DD`.
5. `price_bob` must be a positive number.
6. `origin_slug` and `destination_slug` must be in the city registry.
7. `currency` must be `BOB`.

Exit code `1` on any validation failure (blocks GHA commit).

### Deduplication (read layer)

When the same `origin + destination + travel_date + operator` appears multiple times (re-fetched on consecutive days), the **read layer** uses the row with the latest `fetched_at` for display. The TXT file keeps all rows for history.

```typescript
// Conceptual dedupe in prices.ts
function dedupeRows(rows: PriceRow[]): PriceRow[] {
  const key = (r) => `${r.originSlug}|${r.destinationSlug}|${r.travelDate}|${r.operator}`;
  const map = new Map<string, PriceRow>();
  for (const row of rows) {
    const k = key(row);
    const existing = map.get(k);
    if (!existing || row.fetchedAt > existing.fetchedAt) {
      map.set(k, row);
    }
  }
  return [...map.values()];
}
```

## `data/routes.txt`

### Format

Tab-delimited, no header, one route per line:

```text
santa-cruz	tarija
santa-cruz	la-paz
la-paz	cochabamba
cochabamba	santa-cruz
la-paz	sucre
```

| Column | Description |
|--------|-------------|
| Column 1 | Origin slug |
| Column 2 | Destination slug |

`fetch-prices.mjs` reads this file and fetches prices for each route.

## Query API (`src/lib/prices.ts`)

| Function | Input | Output |
|----------|-------|--------|
| `parsePricesFile(path?)` | optional path | `PriceRow[]` |
| `getPriceHistory(origin, dest, days?)` | slugs, default 30 | `DailyPrice[]` — min price per calendar day |
| `getMinPriceForDate(origin, dest, date)` | slugs, YYYY-MM-DD | `number \| null` |
| `getLatestFetch(origin, dest)` | slugs | ISO timestamp of most recent row |
| `getOperatorsForDate(origin, dest, date)` | slugs, date | `{ name, price }[]` sorted by price asc |

### `DailyPrice` shape

```typescript
interface DailyPrice {
  date: string;           // YYYY-MM-DD (travel_date)
  minPrice: number;
  operators: { name: string; price: number }[];
}
```

## Seed Data (development)

Include 2–3 weeks of sample rows for `santa-cruz → tarija` in the initial `data/prices.txt` so the chart renders before GHA is wired. Mark source as `manual-seed`.

Example price range for Santa Cruz → Tarija: Bs. 80 – Bs. 280 (based on Busbud screenshot showing ~$21–$37 USD equivalent).

## Backup and Growth

- Git history is the backup — every daily commit is a snapshot.
- If file exceeds ~10 MB, consider splitting by route (`data/prices/santa-cruz-tarija.txt`) or migrating to SQLite (see [architecture.md](architecture.md)).
- Never commit API keys or scraped HTML — only normalized rows.

## Related Docs

- [Data Pipeline](data-pipeline.md)
- [Architecture](architecture.md)
- [Data Sources](data-sources.md)
