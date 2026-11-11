import { describe, expect, it } from 'vitest';
import { instant, zoned } from './tz';

describe('Europe/Madrid conversions', () => {
  it('winter (UTC+1)', () => {
    expect(instant('2026-11-11', '07:30').toISOString()).toBe('2026-11-11T06:30:00.000Z');
    expect(zoned('2026-11-11T06:30:00Z')).toMatchObject({ date: '2026-11-11', time: '07:30' });
  });
  it('summer (UTC+2)', () => {
    expect(instant('2026-07-01', '20:00').toISOString()).toBe('2026-07-01T18:00:00.000Z');
  });
  it('around the March DST change', () => {
    expect(instant('2026-03-29', '10:00').toISOString()).toBe('2026-03-29T08:00:00.000Z');
    expect(instant('2026-03-28', '10:00').toISOString()).toBe('2026-03-28T09:00:00.000Z');
  });
  it('late evening stays on the same Madrid day', () => {
    expect(zoned('2026-11-11T22:30:00Z')).toMatchObject({ date: '2026-11-11', time: '23:30' });
  });
});
