import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { countWorkouts, fatigueFor, parseActivities, parseCsv, parseDaily, summariseWeek } from './garmin';

const daily = parseDaily(readFileSync('data/garmin/daily.csv', 'utf8'));
const acts = parseActivities(readFileSync('data/garmin/activities.csv', 'utf8'));

describe('Garmin CSVs (real export from the Garmin weekly report routine)', () => {
  it('parses every day and activity', () => {
    expect(daily).toHaveLength(7);
    expect(acts).toHaveLength(7);
    expect(daily[0]).toMatchObject({ date: '2026-11-02', steps: null, rhr: 56 });
    expect(daily[1]).toMatchObject({ date: '2026-11-03', steps: 8128, sleepH: 8.28, sleepScore: 97, hrv: 41, bedtime: '23:51' });
    expect(acts[0]).toMatchObject({ name: 'Padel', type: 'paddelball', durMin: 115.5, distKm: null });
  });

  it('summarises the week 2–8 Nov', () => {
    const w = summariseWeek(daily, acts, '2026-11-05');
    expect(w.weekStart).toBe('2026-11-02');
    expect(w.daysWithData).toBe(6); // 2 Nov had no steps synced
    expect(Math.round(w.stepsAvg!)).toBe(11304); // (8128+8909+13404+13394+14896+9093)/6
    expect(w.sleepAvg).toBeCloseTo(8.585, 3); // (8.28+7.35+6.83+7.6+10.58+10.87)/6
    expect(w.workouts.map((a) => a.name)).toEqual(['Padel']); // walks don't count
    expect(w.activities).toHaveLength(7);
  });

  it('counts a manual gym session once when Garmin also has a workout that day', () => {
    const w = summariseWeek(daily, acts, '2026-11-05');
    expect(countWorkouts(w.workouts, ['2026-11-05', '2026-11-03', '2026-11-03'])).toEqual({ total: 2, garmin: 1, manual: 1 });
  });

  it('flags fatigue from sleep and Body Battery', () => {
    expect(fatigueFor(daily, '2026-11-08')).toMatchObject({ level: 'rested', reasons: [] });
    // 5 Nov: 6.8 h, score 77, Body Battery 79 → all above the thresholds.
    expect(fatigueFor(daily, '2026-11-05')).toMatchObject({ level: 'rested', reasons: [] });
  });

  it('applies each fatigue threshold', () => {
    const d = [
      ...daily,
      { ...daily[6], date: '2026-11-09', sleepH: 5.9, sleepScore: 62, bbHigh: 41, rhr: 60 },
    ];
    expect(fatigueFor(d, '2026-11-09')).toEqual({ date: '2026-11-09', level: 'tired', reasons: ['shortSleep', 'poorSleep', 'lowBodyBattery', 'highRestingHr'] });
    expect(fatigueFor(d, '2026-12-01').level).toBe('unknown');
  });

  it('reads quoted CSV cells', () => {
    expect(parseCsv('a,b\n"x, y","say ""hi"""\n')).toEqual([{ a: 'x, y', b: 'say "hi"' }]);
  });
});
