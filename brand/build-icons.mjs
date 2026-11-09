// Builds the FixU logo (concept B, "Seam") and every icon the app ships.
// Run: npm run brand
// Outputs:
//   brand/logo.svg, brand/logo-dark.svg      wordmark lockup (text outlined to paths)
//   brand/logo-mark.svg                      the mark alone, no background
//   public/icon.svg                          favicon that follows light/dark
//   public/apple-touch-icon.png (180), public/icon-192.png, public/icon-512.png,
//   public/icon-maskable-512.png, src/app/favicon.ico (16/32/48)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brand = join(root, 'brand');
const pub = join(root, 'public');
mkdirSync(pub, { recursive: true });

// Brand colours (mirrored in src/app/globals.css)
const C = {
  ink: '#14212B',
  sand: '#F4EFE6',
  sage: '#4E8077',
  sageLight: '#8DB8AE',
};

// The mark on a 512 grid. The arm piece is the "repair".
const mark = (fg, pri) => `
  <path d="M180 140 V276 a76 76 0 0 0 152 0 V246" fill="none" stroke="${fg}" stroke-width="72" stroke-linecap="round"/>
  <path d="M332 140 V186" fill="none" stroke="${pri}" stroke-width="72" stroke-linecap="round"/>`;

const svg = (vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>\n`;

// App icon: rounded square (iOS/Android mask it again anyway)
const appIcon = (dark = false) =>
  svg('0 0 512 512', `<rect width="512" height="512" rx="112" fill="${dark ? C.ink : C.sand}"/>${mark(dark ? C.sand : C.ink, dark ? C.sageLight : C.sage)}`);

// Maskable: full-bleed square; the mark sits well inside the 80% safe circle
const maskable = svg('0 0 512 512', `<rect width="512" height="512" fill="${C.sand}"/><g transform="translate(51.2 51.2) scale(.8)">${mark(C.ink, C.sage)}</g>`);

// Favicon that switches with the browser theme. A slightly heavier stroke reads better at 16 px.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<style>.bg{fill:${C.sand}}.fg{stroke:${C.ink}}.pri{stroke:${C.sage}}
@media (prefers-color-scheme: dark){.bg{fill:${C.ink}}.fg{stroke:${C.sand}}.pri{stroke:${C.sageLight}}}</style>
<rect class="bg" width="512" height="512" rx="112"/>
<path class="fg" d="M172 132 V276 a84 84 0 0 0 168 0 V250" fill="none" stroke-width="88" stroke-linecap="round"/>
<path class="pri" d="M340 132 V180" fill="none" stroke-width="88" stroke-linecap="round"/>
</svg>\n`;

// Wordmark: Instrument Sans Bold, outlined so the SVG needs no font
const fontPath = require.resolve('@fontsource/instrument-sans/files/instrument-sans-latin-700-normal.woff');
const buf = readFileSync(fontPath);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const fontSize = 300;
const tracking = -0.02 * fontSize;
let x = 0;
const glyphPaths = [];
for (const g of [...'FixU'].map((ch) => font.charToGlyph(ch))) {
  glyphPaths.push(g.getPath(x, 0, fontSize).toPathData(2));
  x += (g.advanceWidth / font.unitsPerEm) * fontSize + tracking;
}
const textWidth = x - tracking;
const capH = (font.tables.os2.sCapHeight / font.unitsPerEm) * fontSize;

// Lockup: mark (scaled to cap height + a little) then the word
// The mark's ink bounds on the 512 grid: x 144-368, y 104-388
const MB = { x: 144, y: 104, w: 224, h: 284 };
const markScale = (capH * 1.04) / MB.h;
const gap = 0.2 * fontSize;
const markW = MB.w * markScale;
const W = Math.ceil(markW + gap + textWidth);
const H = Math.ceil(MB.h * markScale);
const baseline = H / 2 + capH / 2;
const lockup = (dark = false) =>
  svg(`0 0 ${W} ${H}`,
    `<g transform="scale(${markScale}) translate(${-MB.x} ${-MB.y})">${mark(dark ? C.sand : C.ink, dark ? C.sageLight : C.sage)}</g>` +
    `<g transform="translate(${markW + gap} ${baseline})" fill="${dark ? C.sand : C.ink}"><path d="${glyphPaths.join(' ')}"/></g>`);

writeFileSync(join(brand, 'logo.svg'), lockup(false));
writeFileSync(join(brand, 'logo-dark.svg'), lockup(true));
writeFileSync(join(brand, 'logo-mark.svg'), svg('0 0 512 512', mark(C.ink, C.sage)));
writeFileSync(join(brand, 'logo-mark-dark.svg'), svg('0 0 512 512', mark(C.sand, C.sageLight)));
writeFileSync(join(brand, 'app-icon.svg'), appIcon(false));
writeFileSync(join(brand, 'app-icon-dark.svg'), appIcon(true));
writeFileSync(join(pub, 'icon.svg'), favicon);
writeFileSync(join(pub, 'logo-mark.svg'), svg('0 0 512 512', mark('currentColor', C.sage)));

// Rasterise with the pre-installed Chromium
const { chromium } = require('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const png = async (markup, size) => {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${markup.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
};
// iOS adds its own rounded mask and shows black in transparent corners, so its icon is full-bleed
const iosIcon = svg('0 0 512 512', `<rect width="512" height="512" fill="${C.sand}"/>${mark(C.ink, C.sage)}`);
writeFileSync(join(pub, 'apple-touch-icon.png'), await png(iosIcon, 180));
writeFileSync(join(pub, 'icon-192.png'), await png(appIcon(false), 192));
writeFileSync(join(pub, 'icon-512.png'), await png(appIcon(false), 512));
writeFileSync(join(pub, 'icon-maskable-512.png'), await png(maskable, 512));

// favicon.ico with PNG entries (16, 32, 48)
const sizes = [16, 32, 48];
const pngs = [];
for (const s of sizes) pngs.push(await png(favicon.replace(/<style>[\s\S]*?<\/style>/, `<style>.bg{fill:${C.sand}}.fg{stroke:${C.ink}}.pri{stroke:${C.sage}}</style>`), s));
await browser.close();
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + i * 16;
  header.writeUInt8(s, e); header.writeUInt8(s, e + 1);
  header.writeUInt8(0, e + 2); header.writeUInt8(0, e + 3);
  header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(pngs[i].length, e + 8); header.writeUInt32LE(offset, e + 12);
  offset += pngs[i].length;
});
writeFileSync(join(root, 'src/app/favicon.ico'), Buffer.concat([header, ...pngs]));
console.log('brand assets written');
