// End-to-end check of the calendar flows at 390x844. Usage: node tests/e2e/daily-flow.mjs [baseUrl]
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const base = process.argv[2] ?? 'http://localhost:3000';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const step = async (name, fn) => { const t0 = Date.now(); await fn(); console.log(`ok  ${name} (${Date.now() - t0} ms)`); };

await page.goto(`${base}/daily?view=day&date=2026-11-12`, { waitUntil: 'networkidle' });

await step('form validates an empty title', async () => {
  await page.getByRole('button', { name: 'New Event', exact: true }).click();
  await page.getByRole('button', { name: 'Add Event' }).click();
  await page.getByText('Give the event a title.').waitFor();
});
await step('add an event', async () => {
  await page.getByLabel('Title', { exact: true }).fill('Gym test');
  await page.getByLabel('Start', { exact: true }).fill('07:00');
  await page.getByLabel('End', { exact: true }).fill('08:15');
  await page.getByRole('button', { name: 'Add Event' }).click();
  await page.getByText('Added “Gym test”.').waitFor();
  await page.getByRole('button', { name: /Gym test/ }).first().waitFor();
});
await step('mark done, then undo', async () => {
  await page.getByRole('button', { name: /Gym test/ }).first().click();
  await page.getByRole('button', { name: 'Mark Done' }).click();
  await page.getByRole('button', { name: /Gym test.*Done/ }).first().waitFor();
  await page.getByRole('button', { name: 'Undo' }).click();
  await page.waitForTimeout(200);
  assert.equal(await page.getByRole('button', { name: /Gym test.*Done/ }).count(), 0);
});
await step('reschedule keeps history', async () => {
  await page.getByRole('button', { name: /Gym test/ }).first().click();
  await page.getByRole('button', { name: 'Reschedule' }).click();
  await page.locator('dialog[open]').getByLabel('Date', { exact: true }).fill('2026-11-13');
  await page.getByRole('button', { name: 'Move Event' }).click();
  await page.getByText(/Moved to Friday, 13 November 2026/).waitFor();
  await page.getByRole('button', { name: /Gym test.*Moved/ }).first().waitFor();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /Gym test/ }).first().waitFor();
});
await step('delete with undo', async () => {
  await page.getByRole('button', { name: /Gym test/ }).first().click();
  await page.getByRole('button', { name: 'Delete Event' }).click();
  await page.getByText('Event deleted.').waitFor();
  await page.getByRole('button', { name: 'Undo' }).click();
  await page.getByRole('button', { name: /Gym test/ }).first().waitFor();
});
await step('holiday shows its source', async () => {
  await page.goto(`${base}/daily?view=day&date=2026-11-09`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Almudena/ }).click();
  await page.getByRole('link', { name: /BOCM/ }).waitFor();
  await page.keyboard.press('Escape');
});
await step('layer toggle hides holidays', async () => {
  await page.getByRole('button', { name: 'Layers' }).click();
  await page.getByRole('switch', { name: /Madrid public holidays/ }).uncheck({ force: true });
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('button', { name: /Almudena/ }).count(), 0);
});
await step('views switch and keep URL state', async () => {
  for (const v of ['Week', 'Month', 'Year', 'Day']) {
    await page.getByRole('radio', { name: v }).click();
    await page.waitForURL(new RegExp(`view=${v.toLowerCase()}`));
  }
});
await browser.close();
console.log('daily flow: all steps passed');
