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

### 1. Tickets Bolivia — travel guide pages (primary, v1)

| Field | Value |
|-------|-------|
| **URL pattern** | `https://www.ticketsbolivia.com/travel-by-bus/{origin}_{destination}.php` |
| **Example** | `la_paz-uyuni.php`, `uyuni-sucre.php` |
| **Method** | Scrape static timetable tables (company + “Price from”) |
| **Source tag** | `ticketsbolivia-travel` |
| **Data** | Reference “from” prices (often USD → converted to BOB) |
| **Notes** | Not live inventory; not all route pages include price tables |

### 2. Tickets Bolivia — live search (secondary)

| Field | Value |
|-------|-------|
| **URL** | POST `buses_paso1.php` |
| **Source tag** | `ticketsbolivia` |
| **Status** | Often returns no tickets (`nottrip`); kept for when inventory is online |

### 3. Busbud (reference UI, not used for fetch)

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

## Fetch Strategy (cron — one travel day per run)

Each GitHub Actions cron run:

1. Target **one travel date**: tomorrow (`daysAhead: 1` in `fetch-config.json`).
2. For each route in `data/routes.txt`, call every enabled source adapter.
3. Append **one row per operator** found (multi-company) for that travel date.
4. Set `fetched_at` to the current UTC timestamp.
5. **Do not** duplicate the same price across 14 future dates in a single run — history grows because the cron runs daily and appends a new snapshot.

Example after 7 daily runs for La Paz → Uyuni:

| travel_date | fetched_at (day) | operators appended |
|-------------|------------------|--------------------|
| 2026-07-15 | Mon cron | Trans Omar, Panasur, … |
| 2026-07-16 | Tue cron | Trans Omar, Panasur, … |
| … | … | … |

The chart uses `travel_date` on the X axis; `fetched_at` tracks when we observed the price.

## Additional source options (roadmap)

| Source | Type | Operators | Live prices | Effort | Notes |
|--------|------|-----------|-------------|--------|-------|
| **Tickets Bolivia travel** | Aggregator (static) | Many per route | Reference “from” | ✅ Done | `/travel-by-bus/{o}_{d}.php` |
| **Tickets Bolivia live** | Aggregator (search) | Many when inventory exists | Yes | Medium | `buses_paso1.php` — often empty |
| **Trans Copacabana** | Operator direct | Own fleet | Yes | Medium | transcopabana.com — LP/UYU/ORU corridor |
| **El Dorado / Transportes El Dorado** | Operator | Own + partners | Yes | Medium | Eastern + major cities |
| **Flota Bolívar** | Operator | Own | Yes | Medium | SCZ, TJA, eastern routes |
| **SAMA / Transportes Sama** | Operator | Own | Yes | Medium | Santa Cruz hub |
| **Todo Turismo** | Operator | Own (Uyuni tours) | Yes | Low | Uyuni routes |
| **Busbud** | International aggregator | Several | Sometimes | High | Bot blocking; incomplete BO routes |
| **Bookaway / 12Go** | International | Few BO routes | Sometimes | High | Terms + coverage |
| **RedBus** | LATAM aggregator | Limited BO | Varies | High | Mostly other countries |
| **Terminal boleterías** | Physical / Facebook | Many small operators | Manual | Low tech | Not scrapable at scale |
| **API propia ASOBus / ANET** | Industry | N/A | N/A | Unknown | No public API known |

**Recommended next adapters** (best coverage per effort):

1. `ticketsbolivia` live search (when inventory returns)
2. Trans Copacabana booking site
3. Flota Bolívar / El Dorado eastern Bolivia (Santa Cruz ↔ Tarija gap)

Enable multiple sources in `data/fetch-config.json`:

```json
"sources": ["ticketsbolivia-travel", "busbud"]
```

### 4. Busbud (implemented)

| Field | Value |
|-------|-------|
| **URL pattern** | `https://www.busbud.com/es-mx/autobus-{origin}-{dest}/r/{geohash}-{geohash}` |
| **Source tag** | `busbud` |
| **Coverage** | Subset of Bolivia routes (e.g. Santa Cruz ↔ Tarija); returns empty when route not listed |
| **Adapter** | `scripts/sources/busbud.mjs` |
| **Notes** | Prices shown as CLP; converted via `busbudClpDivisor` (default 1000) × `usdBobRate` |

Each source tag is stored in the `source` column for audit (`ticketsbolivia-travel`, `busbud`, etc.).

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
