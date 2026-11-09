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
const routes = { dashboard: '/', daily: '/daily', health: '/health', finance: '/finance', news: '/news', settings: '/settings', design: '/design' };
const configs = [
  { tag: 'mobile-light', viewport: { width: 390, height: 844 }, scheme: 'light', isMobile: true, hasTouch: true },
  { tag: 'mobile-dark', viewport: { width: 390, height: 844 }, scheme: 'dark', isMobile: true, hasTouch: true },
  { tag: 'desktop-light', viewport: { width: 1440, height: 900 }, scheme: 'light' },
];

const browser = await chromium.launch();
const results = [];
for (const c of configs) {
  const ctx = await browser.newContext({ viewport: c.viewport, colorScheme: c.scheme, deviceScaleFactor: 2, isMobile: c.isMobile, hasTouch: c.hasTouch });
  const page = await ctx.newPage();
  for (const [name, path] of Object.entries(routes)) {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${out}/${name}-${c.tag}.png` });
    await page.addScriptTag({ content: axeSource });
    const r = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ['violations'] })).violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })));
    results.push({ route: path, config: c.tag, violations: r });
  }
  if (c.isMobile) {
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Quick add' }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/quick-add-${c.tag}.png` });
  }
  await ctx.close();
}
await browser.close();
writeFileSync(`${out}/axe.json`, JSON.stringify(results, null, 2));
const bad = results.flatMap((r) => r.violations.map((v) => `${r.config} ${r.route}: [${v.impact}] ${v.id} (${v.nodes}) ${v.help}`));
console.log(bad.length ? bad.join('\n') : 'axe: no violations');
