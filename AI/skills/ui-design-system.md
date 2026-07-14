# UI Design System: BusTrackerBo

Busbud-inspired look and feel for a Bolivia bus **price tracker**. All UI must use reusable Astro components — no one-off inline styles on pages.

Reference: Busbud search results (Santa Cruz → Tarija) — light blue page background, white elevated search bar, blue primary button, orange price accents, rounded cards, soft shadows.

## Design Tokens

Define in `src/styles/tokens.css` and reference via Tailwind `@theme` or CSS variables.

| Token | CSS variable | Value | Usage |
|-------|--------------|-------|-------|
| Primary blue | `--color-primary` | `#0075EB` | Search button, links, selected tab |
| Primary hover | `--color-primary-hover` | `#0060C4` | Button hover |
| Price orange | `--color-price` | `#E8750A` | Price text, chart accent line |
| Page background | `--color-bg-page` | `#F5F8FC` | Body background |
| Card background | `--color-bg-card` | `#FFFFFF` | Search bar, cards, chart container |
| Border | `--color-border` | `#E2E8F0` | Card borders, input dividers |
| Text primary | `--color-text` | `#1A202C` | Headings, times |
| Text secondary | `--color-text-muted` | `#718096` | Labels, hints |
| Success banner | `--color-banner-info` | `#EBF8FF` | AlertBanner background |
| Radius large | `--radius-lg` | `12px` | Search bar, cards |
| Radius medium | `--radius-md` | `8px` | Inputs, buttons |
| Radius pill | `--radius-pill` | `9999px` | Date tabs, sort chips |
| Shadow card | `--shadow-card` | `0 2px 8px rgba(0,0,0,0.08)` | Elevated search bar |
| Font family | `--font-sans` | `Inter, system-ui, sans-serif` | All UI text |

## Typography

| Element | Size | Weight | Example |
|---------|------|--------|---------|
| Page title | 24px | 600 | "Precios de buses" |
| Search label | 12px | 500 | "Origen", "Destino" |
| Input value | 16px | 400 | "Santa Cruz de la Sierra" |
| Price (large) | 20px | 700 | "Bs. 255" |
| Price (small) | 14px | 600 | Carousel date price |
| Chart axis | 12px | 400 | Date labels |

## Component Catalog

### Layout

#### `Header.astro`

Top bar with logo and optional lang/currency placeholders.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showNav` | `boolean` | `true` | Show help/sign-in placeholders |

```astro
<Header />
```

#### `Footer.astro`

Simple footer: copyright, terms/privacy links, help center link.

---

### Search

#### `SearchBar.astro`

Main search container — Busbud-style horizontal bar with rounded white card and shadow.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `origin` | `string` | `""` | Origin city slug |
| `destination` | `string` | `""` | Destination city slug |
| `date` | `string` | today | ISO date YYYY-MM-DD |
| `action` | `string` | `/` | Form action URL |

Composes: `CityInput`, `SwapButton`, `DatePicker`, `Button`.

```astro
<SearchBar origin="santa-cruz" destination="tarija" date="2026-07-15" />
```

#### `CityInput.astro`

Autocomplete city field with label above value.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | required | "Origen" or "Destino" |
| `name` | `string` | required | Form field name |
| `value` | `string` | `""` | Selected city slug |
| `placeholder` | `string` | `"Ciudad"` | Empty state |

Uses `cities.ts` for slug → display name and dropdown options.

#### `DatePicker.astro`

Single-date input styled as Busbud date field.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | `"date"` | Form field name |
| `value` | `string` | today | YYYY-MM-DD |
| `label` | `string` | `"Fecha"` | Field label |

#### `SwapButton.astro`

Circular button between origin and destination; swaps values on click.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `targetFormId` | `string` | optional | Form to swap fields in |

---

### Prices

#### `PriceChart.astro`

**Primary visualization** — line or area chart of price history.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `origin` | `string` | required | Origin slug |
| `destination` | `string` | required | Destination slug |
| `days` | `number` | `30` | History window |
| `highlightDate` | `string` | optional | Selected date to highlight |

- Uses Chart.js with `--color-primary` line and `--color-price` fill gradient.
- Y-axis: `Bs.` prefix; X-axis: short dates (`13 Jul`).
- Tooltip: date, min price, operator count.
- Empty state: centered message "No hay datos para esta ruta."

```astro
<PriceChart origin="santa-cruz" destination="tarija" days={30} />
```

#### `DatePriceCarousel.astro`

Horizontal scrollable strip of date tabs with price below each — mirrors Busbud date row.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `origin` | `string` | required | Origin slug |
| `destination` | `string` | required | Destination slug |
| `selectedDate` | `string` | optional | Active tab date |
| `daysAhead` | `number` | `7` | Number of future dates |

Each tab shows:
- Top: day number + weekday (`15 Mié`)
- Bottom: min price in orange (`Bs. 80`) or `--` if no data

Selected tab: white elevated card breaking top border (Busbud pattern).

#### `PriceBadge.astro`

Formatted price display.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `amount` | `number` | required | Price in BOB |
| `size` | `"sm" \| "lg"` | `"sm"` | Typography scale |
| `currency` | `string` | `"BOB"` | Currency code |

Renders: `Bs. 255` (large) or `255` (small, orange).

#### `OperatorRow.astro`

Single operator result row (optional list below chart).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `operator` | `string` | required | Operator name |
| `price` | `number` | required | Price in BOB |
| `duration` | `string` | optional | e.g. "12h" |
| `departureTime` | `string` | optional | e.g. "16:30" |

White card with operator name left, blue price button right (Busbud trip card simplified).

---

### UI Primitives

#### `Button.astro`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"primary" \| "secondary" \| "ghost"` | `"primary"` | Visual style |
| `type` | `"button" \| "submit"` | `"button"` | HTML type |
| `icon` | `string` | optional | Icon name (search, swap) |

Primary: blue background, white text, rounded `--radius-md`.

#### `Card.astro`

White rounded container with optional shadow and padding.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `elevated` | `boolean` | `false` | Apply `--shadow-card` |
| `padding` | `"sm" \| "md" \| "lg"` | `"md"` | Inner padding |

Slot: default content.

#### `Icon.astro`

SVG icon wrapper.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | required | `search`, `swap`, `bus`, `wifi`, `info`, `close` |
| `size` | `number` | `20` | Width/height in px |

#### `AlertBanner.astro`

Info banner for travel advisories (strikes, blockades).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | required | Banner text |
| `dismissible` | `boolean` | `true` | Show close button |

Light blue background (`--color-banner-info`), info icon left.

---

## Page Layout: Home

```text
┌──────────────────────────────────────────────────────────────┐
│ Header                                                       │
├──────────────────────────────────────────────────────────────┤
│  bg: --color-bg-page                                         │
│                                                              │
│  ┌─ Card (elevated) ──────────────────────────────────────┐  │
│  │ SearchBar                                               │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
│  DatePriceCarousel                                           │
│                                                              │
│  ┌─ Card ─────────────────────────────────────────────────┐  │
│  │ PriceChart (height ~320px)                              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
│  OperatorRow × N (optional)                                  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Footer                                                       │
└──────────────────────────────────────────────────────────────┘
```

Max content width: `1200px`, centered, horizontal padding `16px` mobile / `24px` desktop.

## Responsive Behavior

| Breakpoint | SearchBar | Chart |
|------------|-----------|-------|
| Mobile `<640px` | Stack fields vertically; full-width Buscar button | Full width, height 240px |
| Tablet `640–1024px` | 2-row layout: cities top, date+button bottom | Full width, height 280px |
| Desktop `>1024px` | Single horizontal row (Busbud layout) | Full width, height 320px |

## Spanish UI Copy

| Key | Text |
|-----|------|
| `search.origin` | Origen |
| `search.destination` | Destino |
| `search.date` | Fecha |
| `search.submit` | Buscar |
| `chart.title` | Historial de precios |
| `chart.empty` | No hay datos para esta ruta. Vuelve mañana. |
| `chart.lastUpdated` | Actualizado {date} |
| `carousel.noPrice` | -- |

## Implementation Rules

1. **Reuse components** — pages compose from `src/components/`; no duplicate markup.
2. **Tokens only** — colors, radius, shadows from `tokens.css`; no magic hex in components.
3. **Props over hardcoding** — city names come from `cities.ts`, prices from `prices.ts`.
4. **Accessible** — form labels, focus rings on inputs, sufficient color contrast on price orange vs white.
5. **Chart is client-side** — Chart.js in `<script>` within `PriceChart.astro`; pass data as JSON via `define:vars` or data attributes.

## Related Docs

- [Architecture](architecture.md)
- [Tech Stack](tech-stack.md)
- [Project Overview](project-overview.md)
