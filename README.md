# BusTrackerBo

Bolivia intercity **bus price tracker**. Search a route, see price history in a Busbud-inspired UI with a search bar and chart.

Built with [Astro](https://astro.build).

## Documentation

Project docs for agents and contributors live in [`AI/`](AI/README.md):

- [Roadmap](AI/plan.txt)
- [UI design system](AI/skills/ui-design-system.md)
- [TXT database schema](AI/skills/txt-database-schema.md)
- [GitHub Actions / daily fetch](AI/skills/cicd-github-actions.md)

## Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build |

## Project Structure

```text
/
├── AI/                  # Agent documentation
├── data/
│   ├── prices.txt       # Price database (TXT, updated daily by GHA)
│   └── routes.txt       # Routes to fetch
├── scripts/             # Daily fetch + validation
├── src/
│   ├── components/      # Reusable UI
│   ├── lib/             # Price parser, cities
│   └── pages/           # Astro routes
└── .github/workflows/   # CI + daily price fetch
```

## License

TBD
