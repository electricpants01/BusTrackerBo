# CI/CD with GitHub Actions: BusTrackerBo

Continuous integration and weekly price data updates using GitHub Actions.

## Overview

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `build.yml` | Push/PR to `main` | Build Astro site, catch errors |
| `fetch-prices.yml` | Weekly cron (Mon) + manual | Fetch bus prices, append to TXT, commit |
| `deploy.yml` | Push to `main` (Phase 5) | Deploy static site |

## Workflow 1: Build (`build.yml`)

**Trigger**: Push or pull request to `main`

| Step | Action |
|------|--------|
| Checkout | `actions/checkout@v4` |
| Node 22 | `actions/setup-node@v4` with `node-version: 22`, `cache: npm` |
| Install | `npm ci` |
| Build | `npm run build` |
| Check (optional) | `npx astro check` |
| Artifact | Upload `dist/` for preview |

```yaml
# .github/workflows/build.yml (spec)
name: Build
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

## Workflow 2: Fetch Prices (`fetch-prices.yml`)

**Trigger**:

- Schedule: `0 6 * * 1` (Mondays at 06:00 UTC)
- Manual: `workflow_dispatch`

| Step | Action |
|------|--------|
| Checkout | `actions/checkout@v4` with `token` for push |
| Node 22 | `actions/setup-node@v4` |
| Fetch | `node scripts/fetch-prices.mjs` |
| Validate | `node scripts/validate-prices.mjs` |
| Commit | If `data/prices.txt` changed, commit and push |
| Summary | Write job summary with row count |

```yaml
# .github/workflows/fetch-prices.yml (spec)
name: Fetch Prices
on:
  schedule:
    - cron: "0 6 * * 1"
  workflow_dispatch:
permissions:
  contents: write
jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: node scripts/fetch-prices.mjs
        env:
          USD_BOB_RATE: ${{ secrets.USD_BOB_RATE }}
          PRICE_SOURCE_API_KEY: ${{ secrets.PRICE_SOURCE_API_KEY }}
      - run: node scripts/validate-prices.mjs
      - name: Commit price updates
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/prices.txt
          git diff --staged --quiet || git commit -m "chore(data): weekly price update $(date -u +%Y-%m-%d)"
          git push
```

### Fetch script contract

`scripts/fetch-prices.mjs` must:

1. Read `data/routes.txt`
2. Fetch prices for each route (implementation in Phase 4)
3. Append rows to `data/prices.txt` following [txt-database-schema.md](txt-database-schema.md)
4. Exit `0` on success (partial route failures OK if logged)
5. Exit `1` if validation would fail or no routes file found

## Workflow 3: Deploy (`deploy.yml`) — Phase 5

**Trigger**: Push to `main` after successful build

**Target options** (pick one when implementing):

| Platform | Method |
|----------|--------|
| GitHub Pages | `peaceiris/actions-gh-pages@v3` with `publish_dir: ./dist` |
| Netlify | `nwtgck/actions-netlify@v3` with site ID + token |
| Cloudflare Pages | `cloudflare/pages-action@v1` |

Requires `build.yml` to pass first or deploy job runs `npm run build` inline.

## Required Secrets

| Secret | Workflow | Required | Description |
|--------|----------|----------|-------------|
| `GITHUB_TOKEN` | fetch-prices | auto | Default Actions token for git push |
| `USD_BOB_RATE` | fetch-prices | no | e.g. `6.91` for USD→BOB conversion |
| `PRICE_SOURCE_API_KEY` | fetch-prices | no | If using a paid price API |
| `NETLIFY_AUTH_TOKEN` | deploy | no | If deploying to Netlify |
| `NETLIFY_SITE_ID` | deploy | no | If deploying to Netlify |

## Permissions

`fetch-prices.yml` needs:

```yaml
permissions:
  contents: write
```

So the bot can push commits to `main`.

## Branch Protection

If `main` is protected:

- Allow `github-actions[bot]` to bypass or use a PAT stored as `GH_PAT` secret with push access.
- Alternatively, push to `data-updates` branch and auto-merge PR.

## Local Equivalent

```bash
# Simulate the daily pipeline locally
node scripts/fetch-prices.mjs
node scripts/validate-prices.mjs
git add data/prices.txt
git commit -m "chore(data): manual price update"
```

## Build Environment

| Tool | Version |
|------|---------|
| OS | ubuntu-latest |
| Node | 22.x |
| npm | bundled with Node |

## Related Docs

- [Data Pipeline](data-pipeline.md)
- [TXT Database Schema](txt-database-schema.md)
- [Tech Stack](tech-stack.md)
