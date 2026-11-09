// WCAG contrast check for the design tokens in globals.css. Usage: node scripts/contrast.mjs
const L = { bg:'#f4efe6', surface:'#fbf9f5', 'surface-2':'#ece6db', ink:'#14212b', muted:'#56626c', primary:'#3e6f67', 'primary-soft':'#dce8e4', 'on-primary':'#ffffff', catchup:'#c98118', 'catchup-ink':'#845004', 'catchup-soft':'#fbebcd', risk:'#4a6382', 'risk-soft':'#e1e7ef', danger:'#a63c2e' };
const D = { bg:'#0e171e', surface:'#15212a', 'surface-2':'#1d2b35', ink:'#eee8de', muted:'#9ba7b0', primary:'#8db8ae', 'primary-soft':'#1c3531', 'on-primary':'#0e171e', catchup:'#e8a740', 'catchup-ink':'#f2be6a', 'catchup-soft':'#3a2c14', risk:'#9db3cf', 'risk-soft':'#1e2a3a', danger:'#ee9182' };
const lum = (h) => { const c = [1,3,5].map((i) => parseInt(h.slice(i,i+2),16)/255).map((v) => v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4); return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]; };
const ratio = (a,b) => { const [x,y] = [lum(a),lum(b)].sort((m,n)=>n-m); return (x+0.05)/(y+0.05); };
// [foreground, background, minimum]: 4.5 text, 3 for icons/graphics
const pairs = [['ink','bg',4.5],['ink','surface',4.5],['muted','bg',4.5],['muted','surface',4.5],['muted','surface-2',4.5],['primary','bg',3],['primary','primary-soft',3],['on-primary','primary',4.5],['ink','primary-soft',4.5],['catchup-ink','catchup-soft',4.5],['catchup-ink','bg',4.5],['catchup','surface',3],['risk','risk-soft',3],['ink','risk-soft',4.5],['danger','surface',4.5]];
let fail = 0;
for (const [name, T] of [['light', L], ['dark', D]]) for (const [f,b,min] of pairs) { const r = ratio(T[f],T[b]); const ok = r >= min; if (!ok) fail++; console.log(`${ok?'pass':'FAIL'} ${name.padEnd(5)} ${f} on ${b}: ${r.toFixed(2)} (min ${min})`); }
process.exit(fail ? 1 : 0);
