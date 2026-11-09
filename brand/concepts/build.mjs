// Generates the three FixU logo concepts (light + dark app icons) and a comparison sheet.
// Run: node brand/concepts/build.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = dirname(fileURLToPath(import.meta.url));

// Draft palette (refined in the design-token step)
const C = {
  ink: '#14212B',   // navy ink: text, dark surfaces
  sand: '#F4EFE6',  // warm off-white: light background
  sage: '#4E8077',  // slate-teal primary
  sageLight: '#8DB8AE', // primary on dark
};

const themes = {
  light: { bg: C.sand, fg: C.ink, pri: C.sage },
  dark: { bg: C.ink, fg: C.sand, pri: C.sageLight },
};

// Each mark is drawn on a 512 grid and kept inside the central ~62% (maskable safe zone).
const marks = {
  step: {
    name: 'A · Step',
    idea: 'An F built from a stem and two strokes, with the next step waiting as a dot. Progress, one move at a time.',
    font: "'Manrope', sans-serif", weight: 800, tracking: '-0.03em',
    svg: (t) => `
      <rect x="140" y="132" width="64" height="248" rx="32" fill="${t.fg}"/>
      <rect x="140" y="132" width="232" height="64" rx="32" fill="${t.fg}"/>
      <rect x="140" y="232" width="164" height="64" rx="32" fill="${t.fg}"/>
      <circle cx="340" cy="348" r="32" fill="${t.pri}"/>`,
  },
  seam: {
    name: 'B · Seam',
    idea: 'A U (you), with one arm set back in place: a small repair that makes the shape whole again.',
    font: "'Instrument Sans', sans-serif", weight: 700, tracking: '-0.02em',
    svg: (t) => `
      <path d="M180 140 V276 a76 76 0 0 0 152 0 V246" fill="none" stroke="${t.fg}" stroke-width="72" stroke-linecap="round"/>
      <path d="M332 140 V186" fill="none" stroke="${t.pri}" stroke-width="72" stroke-linecap="round"/>`,
  },
  level: {
    name: 'C · Level',
    idea: 'A spirit level with the bubble dead centre: a life in balance, checked and adjusted.',
    font: "'Fraunces', serif", weight: 600, tracking: '-0.01em',
    svg: (t) => `
      <rect x="104" y="196" width="304" height="120" rx="60" fill="none" stroke="${t.fg}" stroke-width="36"/>
      <line x1="206" y1="232" x2="206" y2="280" stroke="${t.fg}" stroke-width="16" stroke-linecap="round"/>
      <line x1="306" y1="232" x2="306" y2="280" stroke="${t.fg}" stroke-width="16" stroke-linecap="round"/>
      <circle cx="256" cy="256" r="30" fill="${t.pri}"/>`,
  },
};

const icon = (key, theme, { bg = true } = {}) => {
  const t = themes[theme];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${
    bg ? `<rect width="512" height="512" rx="112" fill="${t.bg}"/>` : ''
  }${marks[key].svg(t)}</svg>`;
};

for (const key of Object.keys(marks)) {
  for (const theme of Object.keys(themes)) {
    writeFileSync(join(out, `${key}-${theme}.svg`), icon(key, theme));
  }
}

// Comparison sheet
const dataUri = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
const row = (key) => {
  const m = marks[key];
  const tile = (theme) => {
    const t = themes[theme];
    const src = dataUri(icon(key, theme));
    return `
      <div class="tile" style="background:${theme === 'light' ? '#FFFFFF' : '#0B141B'}">
        <img src="${src}" width="152" height="152" alt="">
        <div class="sizes">
          <img src="${src}" width="90" height="90" alt="">
          <img src="${src}" width="32" height="32" alt="">
          <img src="${src}" width="16" height="16" alt="">
        </div>
        <div class="lockup" style="color:${t.fg};background:${t.bg}">
          <img src="${dataUri(icon(key, theme, { bg: false }))}" width="44" height="44" alt="">
          <span style="font-family:${m.font};font-weight:${m.weight};letter-spacing:${m.tracking}">FixU</span>
        </div>
      </div>`;
  };
  return `
    <section>
      <header><h2>${m.name}</h2><p>${m.idea}</p></header>
      <div class="pair">${tile('light')}${tile('dark')}</div>
    </section>`;
};

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>FixU logo concepts</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Instrument+Sans:wght@400;700&family=Manrope:wght@800&display=swap" rel="stylesheet">
<style>
  body{margin:0;padding:40px;background:#EAE4D9;font-family:'Instrument Sans',sans-serif;color:${C.ink}}
  h1{font-size:28px;margin:0 0 4px} .sub{margin:0 0 32px;color:#55606A}
  section{margin-bottom:36px} header{display:flex;gap:20px;align-items:baseline;margin-bottom:12px}
  h2{font-size:20px;margin:0;min-width:110px} header p{margin:0;color:#4A5560;max-width:720px}
  .pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .tile{border-radius:20px;padding:24px;display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:center}
  .sizes{display:flex;gap:20px;align-items:end}
  .lockup{grid-column:1/-1;display:flex;align-items:center;gap:12px;padding:14px 18px;border-radius:14px;width:max-content}
  .lockup span{font-size:40px;line-height:1}
</style></head><body>
<h1>FixU · logo concepts</h1>
<p class="sub">Each tile: app icon (152 px), then 90, 32 and 16 px, then the wordmark lockup. Light on the left, dark on the right.</p>
${Object.keys(marks).map(row).join('')}
</body></html>`;

writeFileSync(join(out, 'index.html'), html);
console.log('wrote', out);
