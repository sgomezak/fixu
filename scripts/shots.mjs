// Screenshots + axe-core accessibility scan of every route, mobile (390x844) light/dark and desktop.
// Usage: node scripts/shots.mjs [baseUrl] [outDir]   (needs the app running, e.g. `npm start`)
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const base = process.argv[2] ?? 'http://localhost:3000';
const out = process.argv[3] ?? 'docs/screenshots/phase-0';
mkdirSync(out, { recursive: true });
const routes = {
  dashboard: '/', daily: '/daily', health: '/health', finance: '/finance', news: '/news', settings: '/settings', design: '/design',
  'daily-week': '/daily?view=week', 'daily-month': '/daily?view=month', 'daily-year': '/daily?view=year', 'daily-holiday': '/daily?view=day&date=2026-12-08',
};

// Demo data for screenshots only (browser storage of the headless run): shows each event state.
const demo = () => {
  const tz = 'Europe/Madrid';
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
  const add = (d, n) => { const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const at = (d, hm) => new Date(`${d}T${hm}:00+01:00`).toISOString();
  const ev = (id, title, area, d, s, e, state) => ({ id, title, area, startsAt: at(d, s), endsAt: at(d, e), allDay: false, state, source: 'manual' });
  return {
    events: [
      ev('d1', 'Gym', 'gym', add(today, -2), '07:00', '08:15', 'done'),
      ev('d2', 'YouTube edit', 'side_hustle', add(today, -1), '20:30', '22:00', 'missed'),
      ev('d3', 'Gym', 'gym', add(today, -1), '07:00', '08:15', 'done'),
      ev('d4', 'Padel with Diego', 'social', today, '20:00', '21:30', 'planned'),
      ev('d5', 'Gym', 'gym', today, '07:15', '08:30', 'planned'),
      ev('d6', 'FixU build', 'side_hustle', add(today, 1), '20:00', '22:00', 'planned'),
    ],
    companyHolidays: [],
    layers: { personal: true, holidays: true, company: true, football: true, cultural: true },
  };
};
const configs = [
  { tag: 'mobile-light', viewport: { width: 390, height: 844 }, scheme: 'light', isMobile: true, hasTouch: true },
  { tag: 'mobile-dark', viewport: { width: 390, height: 844 }, scheme: 'dark', isMobile: true, hasTouch: true },
  { tag: 'desktop-light', viewport: { width: 1440, height: 900 }, scheme: 'light' },
];

const browser = await chromium.launch();
const results = [];
for (const c of configs) {
  const ctx = await browser.newContext({ viewport: c.viewport, colorScheme: c.scheme, deviceScaleFactor: 2, isMobile: c.isMobile, hasTouch: c.hasTouch });
  if (process.env.SHOTS_DEMO) await ctx.addInitScript((d) => localStorage.setItem('fixu-calendar-v1', JSON.stringify(d)), demo());
  const page = await ctx.newPage();
  for (const [name, path] of Object.entries(routes)) {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${out}/${name}-${c.tag}.png`, fullPage: name.startsWith('daily') });
    await page.addScriptTag({ content: axeSource });
    const r = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ['violations'] })).violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })));
    results.push({ route: path, config: c.tag, violations: r });
  }
  if (c.isMobile) {
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Quick add' }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/quick-add-${c.tag}.png` });
    await page.goto(base + '/daily', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Layers' }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/daily-layers-${c.tag}.png` });
    await page.keyboard.press('Escape');
    if (process.env.SHOTS_DEMO) {
      await page.getByRole('button', { name: /Padel with Diego/ }).first().click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${out}/daily-event-${c.tag}.png` });
    }
  }
  await ctx.close();
}
await browser.close();
writeFileSync(`${out}/axe.json`, JSON.stringify(results, null, 2));
const bad = results.flatMap((r) => r.violations.map((v) => `${r.config} ${r.route}: [${v.impact}] ${v.id} (${v.nodes}) ${v.help}`));
console.log(bad.length ? bad.join('\n') : 'axe: no violations');
