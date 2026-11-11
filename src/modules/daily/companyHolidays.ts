import type { CompanyHoliday } from './types';

/**
 * Parses pasted text or CSV. One holiday per line: a date and a name, separated by comma, semicolon or tab.
 * Dates: YYYY-MM-DD or DD/MM/YYYY (Spanish order). A header row is skipped.
 */
export function parseCompanyHolidays(raw: string): { ok: CompanyHoliday[]; bad: number[] } {
  const ok: CompanyHoliday[] = [];
  const bad: number[] = [];
  raw.split(/\r?\n/).forEach((line, idx) => {
    const l = line.trim();
    if (!l) return;
    const [rawDate, ...rest] = l.split(/[,;\t]/).map((s) => s.trim().replace(/^"|"$/g, ''));
    const name = rest.join(', ').trim();
    let date: string | null = null;
    let m = rawDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) date = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    m = rawDate.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (m) date = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    const valid = date && !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().startsWith(date);
    if (!valid) {
      if (idx === 0 && /date|fecha/i.test(rawDate)) return; // header row
      bad.push(idx + 1);
      return;
    }
    ok.push({ id: `${date}-${ok.length}`, date: date!, name: name || 'Company holiday' });
  });
  ok.sort((a, b) => a.date.localeCompare(b.date));
  return { ok, bad };
}
