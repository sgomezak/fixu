# FixU

Personal life-tracking PWA: smart calendar, health, finance and news. The full brief is in [`CLAUDE.md`](CLAUDE.md).

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production build (service worker enabled)
```

| Script | What it does |
|---|---|
| `npm run brand` | Regenerates the logo and every icon from `brand/build-icons.mjs` |
| `npm run contrast` | Checks colour-token contrast against WCAG AA |
| `npm run shots` | Screenshots every route (390×844 light/dark, 1440 desktop) and runs axe-core; needs the app running |

Secrets go in `.env.local` (see `.env.example`).
