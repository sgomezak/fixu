import { describe, expect, it } from 'vitest';
import { parseCompanyHolidays } from './companyHolidays';

describe('parseCompanyHolidays', () => {
  it('reads ISO and Spanish dates, skips a header, reports bad lines', () => {
    const r = parseCompanyHolidays('Fecha;Nombre\n2026-12-24; Nochebuena\n31/12/2026, Nochevieja\nnot a date, x\n2026-02-30, Bad day');
    expect(r.ok.map((h) => [h.date, h.name])).toEqual([
      ['2026-12-24', 'Nochebuena'],
      ['2026-12-31', 'Nochevieja'],
    ]);
    expect(r.bad).toEqual([4, 5]);
  });
});
