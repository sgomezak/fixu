import { describe, expect, it } from 'vitest';
import { culturalDates, easterSunday } from './cultural';
import holidays2026 from '../../../data/holidays/2026.json';
import holidays2027 from '../../../data/holidays/2027.json';

const byKey = (year: number) => Object.fromEntries(culturalDates(year).map((d) => [d.key, d.date]));

describe('easterSunday', () => {
  it.each([
    [2019, '2019-04-21'],
    [2024, '2024-03-31'],
    [2025, '2025-04-20'],
    [2026, '2026-04-05'],
    [2027, '2027-03-28'],
    [2028, '2028-04-16'],
    [2038, '2038-04-25'], // latest-type case
    [2285, '2285-03-22'], // earliest possible date
  ])('%i → %s', (year, expected) => expect(easterSunday(year)).toBe(expected));
});

describe('culturalDates', () => {
  it('computes Semana Santa from Easter (2026)', () => {
    const d = byKey(2026);
    expect(d.maundyThursday).toBe('2026-04-02');
    expect(d.goodFriday).toBe('2026-04-03');
    expect(d.easterSunday).toBe('2026-04-05');
  });

  it('computes Semana Santa from Easter (2027)', () => {
    const d = byKey(2027);
    expect(d.maundyThursday).toBe('2027-03-25');
    expect(d.goodFriday).toBe('2027-03-26');
  });

  it('puts Swedish Mother’s Day on the last Sunday of May', () => {
    expect(byKey(2025).mothersDaySE).toBe('2025-05-25');
    expect(byKey(2026).mothersDaySE).toBe('2026-05-31');
    expect(byKey(2027).mothersDaySE).toBe('2027-05-30');
    expect(byKey(2028).mothersDaySE).toBe('2028-05-28');
  });

  it('has the fixed dates', () => {
    const d = byKey(2026);
    expect(d.fathersDayES).toBe('2026-03-19');
    expect(d.christmasEve).toBe('2026-12-24');
    expect(d.christmasDay).toBe('2026-12-25');
  });

  it('agrees with the official BOE holiday data for Semana Santa', () => {
    for (const [data, year] of [[holidays2026, 2026], [holidays2027, 2027]] as const) {
      const official = data.holidays.filter((h) => /Jueves Santo|Viernes Santo/.test(h.name)).map((h) => h.date).sort();
      const d = byKey(year);
      expect(official).toEqual([d.maundyThursday, d.goodFriday]);
    }
  });
});

describe('holiday data', () => {
  it('every holiday names its source and has a valid date in its year', () => {
    for (const data of [holidays2026, holidays2027]) {
      for (const h of data.holidays) {
        expect(h.date.startsWith(String(data.year))).toBe(true);
        expect(h.source.name.length).toBeGreaterThan(10);
        if (!('provisional' in h)) expect(h.source.url).toMatch(/^https:\/\/www\.(boe|bocm)\.es\//);
      }
      // 12 national/regional + 2 local
      expect(data.holidays.filter((h) => h.scope !== 'local')).toHaveLength(12);
      expect(data.holidays.filter((h) => h.scope === 'local')).toHaveLength(2);
    }
  });
});
