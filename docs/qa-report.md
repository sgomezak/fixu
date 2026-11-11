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

## Phase 1: Daily calendar

**Scope:** Day / Week / Month / Year views, events with planned / done / missed / rescheduled states, goals panel (side column on desktop, summary + sheet on phones), calendar layers (personal, Madrid public holidays, NTT DATA, Real Madrid, cultural dates), NTT holiday import, database schema.

### Checks run

| Check | Result |
|---|---|
| Unit tests (Vitest) | 27/27 pass: Easter and Semana Santa (incl. cross-check against the BOE), Swedish Mother's Day, Madrid timezone and DST, goal maths, ICS parsing, NTT import parsing, holiday data has sources |
| End-to-end flow, 390×844 (`npm run e2e`) | 8/8 pass: validation, add event, mark done + undo, reschedule keeps history, delete + undo, holiday source link, layer toggle, view switching with URL state |
| axe-core, 11 routes/views × 3 configs | 0 violations (fixed: day buttons whose accessible name didn't contain their visible text) |
| Schema migration + holiday seed on Postgres 16 | Applies cleanly; seed is idempotent |
| Lint, types, production build | Pass |
| Screenshots | `docs/screenshots/phase-1/` (demo events are test data injected into the headless browser only) |

### Issues found and fixed

| Issue | Severity | Fix |
|---|---|---|
| Month/year goals compared against the whole period, so a new user was "Behind" on day one | High | Goals count from when tracking began |
| Form error text sat inside the label, polluting the field's accessible name | Medium | Error moved outside the label, linked with `aria-describedby` |
| Day/month buttons: accessible name didn't contain visible text | Medium | Visible text + screen-reader-only full date |
| "1 sessions planned", "Gym · Gym" | Low | Singular units; area hidden when it repeats the title |
| Long holiday names cut off | Low | Titles wrap to two lines |
| Event time labelled "Start" while showing a range | Low | Labelled "Time" |

### Assumptions and open items

- **Holiday data:** 2026 and 2027 national/regional days from the BOE (cross-checked with the Comunidad's 2027 decree); 2026 Madrid city days from the BOCM. **2027 Madrid city days (15 May, 9 Nov) are marked provisional:** announced by the city council, but the BOCM list isn't published yet (usually early December).
- **Storage:** events, layers and NTT holidays are kept in the browser until the Supabase project is connected; the schema is ready (`supabase/migrations`).
- **Real Madrid layer** shows "Waiting for the fixtures API key" until the key is set. football-data.org's free tier covers La Liga and the Champions League; other competitions come from `FIXTURES_ICS_URLS`.
- **Social goal** uses the brief's "at least one social block a week" until you set a target; **side-hustle target** stays "not set".
- Not yet checked: Lighthouse and install on a phone (need a deployed URL).
