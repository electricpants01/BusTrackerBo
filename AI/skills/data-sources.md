# Data Sources: BusTrackerBo

Where daily bus **prices** come from for Bolivia intercity routes. The fetch script (`scripts/fetch-prices.mjs`) pulls from one or more sources and normalizes into `data/prices.txt`.

## Target Routes (v1)

| Origin | Destination | Slug pair | Notes |
|--------|-------------|-----------|-------|
| Santa Cruz | Tarija | `santa-cruz` → `tarija` | Reference route; ~12h, multiple operators |
| Santa Cruz | La Paz | `santa-cruz` → `la-paz` | High traffic |
| La Paz | Cochabamba | `la-paz` → `cochabamba` | Short hop (~8h) |
| Cochabamba | Santa Cruz | `cochabamba` → `santa-cruz` | Return direction |
| La Paz | Sucre | `la-paz` → `sucre` | Capital connection |

## Source Options

### 1. Busbud (reference UI, potential data source)

| Field | Value |
|-------|-------|
| **URL pattern** | `https://www.busbud.com/...` |
| **Coverage** | Major Bolivia intercity routes |
| **Method** | Scrape or unofficial API (TBD) |
| **Data** | Operator, price (USD), departure times |
| **Source tag** | `busbud-scrape` |
| **Notes** | Review [Busbud Terms of Service](https://www.busbud.com/en/terms) before scraping. Prefer official API if available. Convert USD → BOB if needed (document exchange rate source). |

### 2. Operator websites (direct)

| Operator | Routes | Method |
|----------|--------|--------|
| SAMA | Eastern Bolivia (SCZ, TJA) | Scrape booking page |
| Trans Copacabana | LPB, ORU, UYU corridor | Scrape |
| El Dorado | LPB ↔ CBB, major cities | Scrape |

| Field | Value |
|-------|-------|
| **Source tag** | `operator-site` |
| **Pros** | Authoritative pricing |
| **Cons** | Each site has different HTML; fragile |

### 3. Manual seed (development only)

| Field | Value |
|-------|-------|
| **Method** | Hand-enter rows in `data/prices.txt` |
| **Source tag** | `manual-seed` |
| **Use** | Bootstrap chart UI before scraper is ready |

## City Slug Registry

Must match `src/lib/cities.ts`:

| Slug | Display name (es-BO) |
|------|----------------------|
| `santa-cruz` | Santa Cruz de la Sierra |
| `la-paz` | La Paz |
| `cochabamba` | Cochabamba |
| `tarija` | Tarija |
| `sucre` | Sucre |
| `oruro` | Oruro |
| `potosi` | Potosí |
| `trinidad` | Trinidad |
| `uyuni` | Uyuni |

## Fetch Strategy (v1)

For each route in `data/routes.txt`:

1. Fetch prices for travel dates **today + 1** through **today + 14**.
2. For each operator/price found, append one row to `prices.txt`.
3. Set `fetched_at` to current UTC timestamp.
4. Skip row if identical to latest existing row (same route, date, operator, price) — optional optimization.

## Price Normalization

| Rule | Detail |
|------|--------|
| Currency | Store as `BOB` in `price_bob` |
| USD conversion | If source returns USD, multiply by daily rate; document rate in script comment or env `USD_BOB_RATE` |
| Decimals | Two decimal places (`255.00`) |
| Operator names | Title case, trim whitespace; map aliases (`Sama` → `SAMA`) in a lookup table in the script |

## Legal and Ethical Notes

- Respect `robots.txt` and site terms before scraping.
- Rate-limit requests (e.g. 1 request per route per run, 2s delay between routes).
- Do not store personal data — only public price/schedules.
- Attribute source in the `source` column for auditability.

## Future Sources (out of v1 scope)

- Aggregator APIs (if licensed)
- User-submitted prices (crowdsourcing)
- Terminal ticket booth APIs (if Bolivia operators publish open data)

## Related Docs

- [TXT Database Schema](txt-database-schema.md)
- [Data Pipeline](data-pipeline.md)
- [CI/CD](cicd-github-actions.md)
