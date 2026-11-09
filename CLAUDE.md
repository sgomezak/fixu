# FixU — Build Brief for Claude Code (v.1)

> Paste this whole file into Claude Code (or save it as `CLAUDE.md` in an empty repo and say "Read CLAUDE.md and start Phase 0").

---

## 0. How to work

1. **Start in plan mode.** Read this whole brief, then send me a short plan: stack confirmation, data model, folder structure, and the phase order in §9. Wait for my OK before you write any code.
2. **Build in phases (§9).** At the end of each phase, stop, run the app, show me screenshots (mobile viewport 390×844), and list anything you assumed.
3. **Never invent personal data.** Anything listed in §10 "Open inputs" goes behind a clearly marked placeholder or config value. Ask me for it when the phase needs it.
4. **Design skills are required, not optional:**
   - Load and follow the **`frontend-design` skill** (design taste) before writing any UI. If it isn't installed, install it from the official Anthropic plugins (`/plugin` → `frontend-design`) first.
   - Fetch and apply the **Vercel Web Interface Guidelines** (https://vercel.com/design/guidelines). Treat them as a checklist: each phase's UI must pass them, and §8 includes a formal audit against them.
5. Secrets (API keys) go in `.env.local` only, never in the repo. Provide `.env.example`.

---

## 1. Product in one paragraph

**FixU** is my personal life-tracking app. It follows up on every part of my life (finance, weekly goals, health, routine, work, side hustle, social life) and tells me how I'm doing. The core is a **smart calendar** that understands my routine and constraints, sees what I did and didn't do, and **suggests** catch-ups instead of making me log everything by hand. It's a single-user app (just me), mobile-first, installable on my phone as a PWA, with push notifications. We'll grow it slowly, so the architecture should make new modules easy to add.

**About me (for context and defaults):** Santiago, consultant at NTT DATA (aviation, client Air Europa), based in Madrid. Timezone `Europe/Madrid`. App UI language: **English** for v1, with all strings in an i18n file so I can switch to Spanish later.

---

## 2. Brand, logo and visual direction

**Name:** FixU

**Logo** (do this first, in Phase 0):
- Make 3 SVG logo concepts (wordmark + app-icon mark). Show them side by side and let me pick.
- The mark has to work at 16 px (favicon), 180 px (iOS home screen) and 512 px (PWA maskable icon), in light and dark.
- Idea space: progress, alignment, small daily repairs. **Avoid** clichés like wrenches, checkmark-in-circle and brain icons.
- Export: `logo.svg`, `logo-mark.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `favicon.ico`.

**Palette:** calm and premium, **not flashy**. Use one restrained neutral base, one primary colour and one accent with a meaning. Suggested starting point (you can refine it, but justify any change):
- Ink / navy base for text and dark mode surfaces
- Warm off-white / sand background in light mode
- Muted sage or slate-teal as the primary colour
- **Amber = "catch-up / behind schedule"**. Use it *only* for that meaning, everywhere in the app.
- Status colours (on track / at risk / behind) must pass WCAG AA contrast and must never rely on colour alone (add an icon or label too).

**Feel:** quiet, confident dashboard. Good typographic hierarchy, generous spacing, tabular numbers for metrics, subtle motion that respects `prefers-reduced-motion`. Full **light + dark mode**. No generic "AI template" look (follow the `frontend-design` skill on this).

---

## 3. Tech stack and architecture

Use the stack below unless you have a strong reason to change it. If you do, tell me why in the plan.

| Layer | Choice |
|---|---|
| App | Next.js (App Router) + TypeScript + Tailwind CSS |
| PWA | Web App Manifest + Service Worker; installable on iOS and Android |
| Backend / DB | Supabase (Postgres, Auth with just my account, Storage for receipts and Garmin files, Edge Functions, scheduled jobs via pg_cron) |
| Push | Web Push (VAPID). Note: iOS needs 16.4+ and the app added to the Home Screen. Build an onboarding screen that explains this. |
| AI | Claude API (Anthropic SDK) for: natural-language → calendar actions, receipt OCR and categorisation, weekly reports, news summaries, scheduling suggestions |
| Voice | Record with MediaRecorder → transcribe (Web Speech API where supported, otherwise a server-side transcription service behind an interface so it can be swapped) → send the text to the same NL parser as typed input |
| Hosting | Vercel (app) + Supabase (data and cron) |
| Tests | Vitest (logic), Playwright (E2E + mobile viewport), axe-core (accessibility), Lighthouse (PWA/performance) |

**Architecture rules**
- Each section (Dashboard, Daily, Health, Finance, News) is its own module with its own data tables and its own "goal provider". The dashboard and weekly report just aggregate the providers. That lets me add new life areas later without rewriting anything.
- All scheduling logic lives in a pure, unit-tested **`scheduler` module** (§6), separate from the UI.
- Every AI action that changes data (adding an event, categorising a receipt) shows a **confirm/undo** step. Nothing is written silently.

---

## 4. My baseline profile (seed as editable settings, not hard-coded)

```yaml
timezone: Europe/Madrid
home_city: Madrid
work:
  start: "09:00"
  end_range: ["19:00", "20:00"]   # assume 19:30 unless I log otherwise
  commute_min: 30
  get_ready_min: 60               # shower, dress, breakfast
  derived_wake_time: "07:30"      # = 09:00 - 30 - 60
  employer: NTT DATA
recurring:
  - name: Afterwork
    day: Thursday
    time: "20:00"
    condition: "only if I'm in Madrid that week"
    side_effects: ["no workout Thursday evening", "no workout Friday morning"]
gym:
  goal_per_week: 3
  travel_to_gym_min: 5
  default_session_min: 75         # incl. change time
side_hustle:                      # outside working hours, spread across the week
  projects: ["YouTube channel", "FixU app"]
  weekly_target_hours: TBD        # ask me
social:
  examples: ["golf", "friends & family plans"]
  weekly_target: TBD              # ask me
health:
  height_cm: 185
  weight_kg: 70
  target_weight_kg: 76
  steps_daily_avg_target: 8000    # measured as a weekly average
  meals_per_day: 3
  protein_g_per_kg: 1.8           # default, editable → ~126 g/day at 70 kg
finance:
  monthly_savings_goal_eur: 200
  currency: EUR
notifications:
  nightly_checkin: "22:00"        # editable
  sunday_report: "Sunday 19:00"   # editable
```

---

## 5. Pages and acceptance criteria

Navigation: bottom tab bar on mobile (Dashboard · Daily · Health · Finance · News), sidebar on desktop. A global **"+" quick-add** (text or mic) is always reachable.

### 5.1 Dashboard — "FixU"
- **This month at a glance:** one card per area (Finance, Health, Work, Side hustle, Social, Routine), each with progress against its goal and a status (On track / At risk / Behind).
- **Weekly report (generated every Sunday):**
  - *Last week:* what I completed vs planned in each area (finance, health, work: NTT plus other work goals, side hustle, social), and my streaks.
  - *Next week:* the catch-ups I need, key events (holidays, Real Madrid games, afterworks, travel), deadlines, and my plan for the week.
  - Stored as history so I can open past reports.
- Acceptance: the report is readable in under 60 seconds and every "behind" item has a one-tap action (schedule a catch-up / dismiss / reschedule).

### 5.2 Daily — Smart Calendar
- **View switcher at the top:** Day · Week · Month · Year.
- **Right-side goals panel in every view** (on mobile it becomes a bottom sheet or tab):
  - Day view: hours of the day (timeline) on the left; that day's goals on the right. If there are no goals, show **"Relax"**. If I'm behind on something, show an **amber** suggestion: *"Book a catch-up slot: [reason]"* with a one-tap "Book" that puts the block in a free slot.
  - Week view: 7 days plus the week's goals.
  - Month view: full 28–31-day grid plus the month's goals.
  - Year view: 12-month overview plus the year's goals.
- **Plan vs done vs missed:** every event has a state: planned / done / missed / rescheduled. Past days visibly show what I did and what I should have done.
- **Text and voice input:** "Gym tomorrow 7am", "I'm in London Wed–Fri", "Move side hustle to Sunday" → parsed by Claude into a proposed calendar change → I confirm.
  - Saying I'm travelling / not in Madrid automatically **cancels that week's Thursday afterwork** and marks the travel days as possible fatigue days.
- **Calendar layers (toggleable):**
  1. **Madrid public holidays:** national + Comunidad de Madrid + Madrid city local holidays, for 2026 and 2027. Source them from the official bulletins (BOE / BOCM / Ayuntamiento de Madrid) and store them as data with a source and a year. Don't guess dates.
  2. **NTT DATA company holidays:** placeholder layer. I'll give you the list (see §10). Build a simple import (paste or CSV).
  3. **Real Madrid matches (all competitions):** pull from a fixtures API (e.g. football-data.org, which needs a free API key; check which competitions it covers and add an ICS fallback for any it doesn't). Refresh daily and update kick-off times.
  4. **Christian / cultural dates:** Semana Santa (Jueves Santo, Viernes Santo, Domingo de Resurrección, all computed from Easter), Christmas Eve/Day, Spanish Father's Day (19 March), **Swedish Mother's Day (last Sunday of May)**. Compute moveable dates in code and unit-test them.
- **Nightly check-in flow** (opened from the 22:00 notification): a quick list of today's planned items → tick done / missed → "Anything to add for tomorrow?" (text/voice) → done in under 60 seconds.

### 5.3 Health
- **Garmin import:** I already have a Claude automation that pulls my Garmin report. Build:
  - (a) a manual upload (accept JSON / CSV / PDF and parse them), and
  - (b) an authenticated import endpoint my automation can POST to.
  - Design a normalised schema (date, steps, activities with type and duration, sleep, resting HR, body battery / stress if present, weight). **Ask me for a sample file before you write the parser.**
- **Goals shown with progress:**
  1. 3 workouts a week (from Garmin activities + manual check, de-duplicated)
  2. 8,000 steps daily average across the week
  3. 3 meals a day with enough protein: fast meal logging (one tap per meal + rough protein estimate; a photo-of-meal estimate via Claude is a nice-to-have)
  4. Weight 70 → 76 kg at 185 cm: trend chart with the target line and a weekly rate
- Health data feeds the scheduler's **fatigue signal** (§6).

### 5.4 Finance
- Log spending by:
  - **Photo of a receipt** → Claude extracts merchant, date, amount and items, and proposes a category → I confirm/edit.
  - **Manual entry.**
- **Categories:** sensible defaults (Groceries, Eating out, Transport, Travel, Sport, Subscriptions, Shopping, Social, Other), and I can add, rename and merge them.
- Monthly view: total spent, spend by category, top merchants, and progress to the **€200/month savings goal**.
- v1 is deliberately simple. Leave room for income and budget limits later.

### 5.5 News
- Use my existing **Radar.AE** page as the starting point for layout and editorial style. I'll put its exported HTML in `/reference/radar-ae.html`. Re-skin it in the FixU look; **do not reuse Air Europa branding**.
- Changes from Radar.AE:
  - **Remove the fuel focus / fuel section.**
  - **Add Spanish politics and global politics.** Use a balanced mix of outlets from across the political spectrum, and show the source on every item.
  - **Keep a strong aviation section** (airlines, MRO, fleet, airports, Spanish/European aviation, Air Europa / IAG news).
- Live feed from RSS / news APIs, refreshed a few times a day. A Claude-written **"30-second briefing"** at the top (same idea as Radar.AE), with links to the originals and no copied article text.
- Sections: Briefing · Aviation · Spain · World · Saved.

---

## 6. Smart scheduler — rules it must respect

The calendar must **reason**, not just store events. Build it as a constraint-based planner + scoring function (unit-tested), with Claude used only to explain suggestions in plain language.

**Hard constraints (never break):**
- Work 09:00–19:30 (or whatever I log), the commute, and the get-ready block.
- Thursday afterwork at 20:00 when I'm in Madrid → **no workout Thursday evening or Friday morning.**
- Holidays, travel days and fixed events block their slots.
- No suggestions during sleep (protect ~8 h before the derived wake time).

**Soft goals (the planner tries to place them each week):**
- 3 gym sessions (75 min incl. the 5-min walk), spread out with no back-to-back days if possible.
- Side-hustle blocks outside work hours across the week.
- At least one social / fun block (golf, friends, family).

**Fatigue model** (lowers the score of early-morning / high-effort suggestions):
- Travel the day before or that day, a late event the night before (e.g. afterwork), or poor sleep / low body battery from Garmin.
- If I'm **not** fatigued, it may suggest **waking earlier on specific days** to fit a workout. Always as a suggestion, never automatic.

**Behind-schedule logic:**
- By mid-week, compare progress to the weekly targets. If I'm behind, generate an **amber catch-up suggestion** with a concrete free slot and a reason (e.g. *"Catch-up workout: 1 of 3 done, Thursday blocked by afterwork → suggest Saturday 10:00"*).
- Learn from history: when I usually actually work out, when I skip, and how long work really runs. Suggestions should improve over time.

**Tests:** include scenario tests, at least: normal week; Madrid week with afterwork; travel Wed–Fri (afterwork cancelled + fatigue); holiday Monday; late workday all week; already 3/3 workouts by Thursday (no more gym suggestions → "Relax").

---

## 7. Notifications (push to my phone)

1. **Every night (default 22:00):** "Daily catch-up: check what you did today and plan tomorrow" → opens the nightly check-in flow.
2. **Every Sunday (default 19:00):** "Your weekly report is ready" → opens the report.

Both times are editable in Settings. Add a "Send test notification" button. Handle denied permission gracefully (in-app banner instead of push).

---

## 8. Quality gate — usability test BEFORE you call it finished

Before each phase is marked done (and fully at the end), run this and give me the results in `/docs/qa-report.md`:

1. **Scripted usability walkthrough** (Playwright, iPhone viewport 390×844, light + dark). Time and record each task:
   - Install prompt / onboarding → enable notifications
   - Add an event by text, then by voice (mock the transcription)
   - Say "I'm travelling Wed–Fri" and check that the afterwork is cancelled and suggestions change
   - Complete the nightly check-in in under 60 s
   - Accept an amber catch-up suggestion
   - Upload a Garmin file and see the goals update
   - Photograph/upload a receipt and confirm its category
   - Read the Sunday report and act on one "behind" item
   - Open the News briefing and an aviation story
2. **Heuristic evaluation** against Nielsen's 10 usability heuristics. List each issue with its severity (high / medium / low).
3. **Web Interface Guidelines audit:** go through the Vercel checklist item by item (keyboard and focus, touch target sizes, forms, loading/empty/error states, motion, contrast, number formatting, etc.).
4. **Accessibility:** axe-core with zero serious/critical issues; full keyboard navigation; screen-reader labels on all icon buttons.
5. **Lighthouse:** PWA installable, Performance ≥ 90 and Accessibility ≥ 95 on mobile.
6. **Fix every high and medium issue**, re-run, and show before/after screenshots. List what's left (low) and why.

Every screen needs designed **empty, loading and error states** (e.g. Finance on day one is empty, so make that state feel intentional and helpful).

---

## 9. Build phases

| Phase | Scope | Done when |
|---|---|---|
| **0** | Logo concepts → I pick one; design tokens (colour, type, spacing), light/dark; app shell, nav, PWA manifest and icons | I approve the logo and shell screenshots |
| **1** | Daily: calendar views (D/W/M/Y), events with plan/done/missed, goals panel, holiday + cultural layers, Real Madrid layer | All 4 views work on mobile; holidays have sources |
| **2** | Scheduler engine + amber catch-ups + text/voice NL input + travel/afterwork logic | Scenario tests in §6 pass |
| **3** | Notifications (nightly + Sunday) + nightly check-in flow + weekly report + Dashboard | Push arrives on my phone; report generates on a schedule |
| **4** | Health (Garmin import, goals, weight trend, fatigue signal) | My real Garmin sample imports correctly |
| **5** | Finance (receipt OCR, manual entry, categories, monthly view) | 5 real receipts categorised correctly |
| **6** | News (Radar.AE re-skin, new sections, live feed, briefing) | Feed refreshes; fuel removed; politics + aviation present |
| **7** | Full QA gate (§8) and polish | `qa-report.md` delivered, high/medium issues fixed |

---

## 10. Open inputs (ask me when the phase needs them; use placeholders until then)

- NTT DATA company holiday list
- A sample Garmin report from my automation (and how it delivers the file)
- `/reference/radar-ae.html` (exported Radar.AE page)
- Weekly targets for side-hustle hours and social time
- API keys: Anthropic, fixtures API (football-data.org or other), transcription (if used), VAPID keys (you can generate these)
- Confirm: is the €200/month a **savings** target (current assumption) or a **spending cap**?

---

## 11. Definition of done (v1)

- Installed on my phone from the Home Screen, with both notifications arriving on time.
- I can run a full week using only voice/text + the nightly check-in, and the calendar suggests catch-ups correctly around work, afterworks, travel and fatigue.
- The Sunday report is accurate across all areas.
- The QA report is delivered and every high/medium issue is fixed.
