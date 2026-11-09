# FixU QA report

## Phase 0: brand, tokens, shell

**Scope:** logo (concept B, "Seam"), design tokens (light + dark), app shell with bottom tabs on mobile and sidebar on desktop, global quick add, PWA manifest, icons and service worker. Every page has a designed empty state; no data is wired yet.

### Checks run

| Check | Result |
|---|---|
| Production build (`next build`) | Pass |
| ESLint + TypeScript | Pass |
| axe-core, 7 routes × (390×844 light, 390×844 dark, 1440 desktop) | 0 violations (one serious issue on News, a scroll region without keyboard access, was fixed) |
| Contrast of every text/graphic token pair (`npm run contrast`) | 30/30 pass WCAG AA |
| Status never colour-only | Every status badge has an icon and a label |
| Screenshots | `docs/screenshots/phase-0/` |

### Web Interface Guidelines (items that apply to the shell)

- Icon-only buttons have `aria-label` (quick add, mic, close, settings); decorative icons are `aria-hidden`.
- Skip link to main content; `aria-current="page"` on the active tab; headings are in order.
- One `:focus-visible` ring everywhere, never `outline: none` without a replacement; focused elements keep `scroll-margin` clear of the sticky bars.
- Touch targets ≥ 44 px (tabs 64 px tall, FAB 56 px); `touch-action: manipulation`; tap highlight set on purpose.
- Safe-area insets on the top bar, bottom tabs, FAB and sheet (`viewport-fit=cover`).
- `color-scheme` and `theme-color` follow light/dark; saved theme is applied before paint (no flash).
- Motion: colour/transform transitions only, listed explicitly (no `transition: all`); everything rests under `prefers-reduced-motion`.
- Quick-add sheet: native `<dialog>` (focus trap + Esc), `overscroll-behavior: contain`, labelled field, `autocomplete="off"`, placeholder ends with `…`, result announced via `aria-live`. Autofocus only on fine-pointer devices.
- Numbers and dates use `Intl` (`en-GB`, `Europe/Madrid`); numeric cells use tabular figures.
- Brand name marked `translate="no"`.

### Assumptions

- "At risk" is slate blue so amber keeps a single meaning (catch-up / behind).
- One type family (Instrument Sans) for UI and the wordmark.
- Quick add is UI only; submitting says plainly that nothing was saved. The parser connects in Phase 2.
- Not yet checked: Lighthouse (needs a deployed URL) and install on a real phone.
