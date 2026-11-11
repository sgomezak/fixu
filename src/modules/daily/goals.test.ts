import { describe, expect, it } from 'vitest';
import { calendarGoals, elapsedFraction } from './goals';
import type { CalendarEvent } from './types';

const ev = (date: string, area: CalendarEvent['area'], state: CalendarEvent['state']): CalendarEvent => ({
  id: `${date}-${area}-${state}`, title: area, area, state, allDay: false, source: 'manual',
  startsAt: `${date}T18:00:00Z`, endsAt: `${date}T19:15:00Z`,
});

describe('calendarGoals', () => {
  const week = { period: 'week' as const, from: '2026-11-09', to: '2026-11-15' };

  it('counts done gym sessions against 3 a week', () => {
    const g = calendarGoals([ev('2026-11-09', 'gym', 'done'), ev('2026-11-10', 'gym', 'missed'), ev('2026-11-12', 'gym', 'planned')], { ...week, today: '2026-11-11' });
    const gym = g.find((x) => x.id === 'gym')!;
    expect(gym).toMatchObject({ done: 1, planned: 1, target: 3 });
  });

  it('is behind at the end of the week with 1 of 3', () => {
    const g = calendarGoals([ev('2026-11-09', 'gym', 'done')], { ...week, today: '2026-11-16' });
    expect(g.find((x) => x.id === 'gym')!.status).toBe('behind');
  });

  it('is on track with 3 of 3', () => {
    const g = calendarGoals(['09', '11', '13'].map((d) => ev(`2026-11-${d}`, 'gym', 'done')), { ...week, today: '2026-11-14' });
    expect(g.find((x) => x.id === 'gym')!.status).toBe('onTrack');
  });

  it('leaves the side-hustle target unset until it is provided', () => {
    const g = calendarGoals([], { ...week, today: '2026-11-11' });
    expect(g.find((x) => x.id === 'side_hustle')).toMatchObject({ target: null, status: 'noData' });
  });

  it('counts a year only from when tracking began', () => {
    const g = calendarGoals([ev('2026-11-09', 'gym', 'done'), ev('2026-11-10', 'gym', 'done')], { period: 'year', from: '2026-01-01', to: '2026-12-31', today: '2026-11-11' });
    const gym = g.find((x) => x.id === 'gym')!;
    expect(gym.target).toBe(23); // 9 Nov – 31 Dec = 53 days → 3 × 53 / 7
    expect(gym.status).toBe('onTrack');
  });

  it('scales weekly targets to a month', () => {
    const g = calendarGoals([], { period: 'month', from: '2026-11-01', to: '2026-11-30', today: '2026-11-11' });
    expect(g.find((x) => x.id === 'gym')!.target).toBe(13);
  });
});

describe('elapsedFraction', () => {
  it('is 0 on the first day and 1 after the end', () => {
    expect(elapsedFraction('2026-11-09', '2026-11-15', '2026-11-09')).toBe(0);
    expect(elapsedFraction('2026-11-09', '2026-11-15', '2026-11-16')).toBe(1);
  });
});
