import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { readFileSync } from 'node:fs';
import { icsToFixtures, parseIcs } from './fixtures.server';

describe('parseIcs', () => {
  it('reads timed and all-day events, with folded lines', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:abc',
      'DTSTART:20270108T200000Z',
      'SUMMARY:Real Madrid - Atlético',
      '  de Madrid',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'DTSTART;VALUE=DATE:20270115',
      'SUMMARY:Copa del Rey: Real Madrid vs Getafe',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const out = parseIcs(ics);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ uid: 'abc', start: '2027-01-08T20:00:00Z', summary: 'Real Madrid - Atlético de Madrid', allDay: false });
    expect(out[1]).toMatchObject({ start: '2027-01-15T12:00:00Z', allDay: true });
  });
});

describe('FotMob calendar', () => {
  const events = parseIcs(readFileSync('data/fixtures/real-madrid.ics', 'utf8'));
  const fixtures = icsToFixtures(events, new Date('2026-11-11T12:00:00Z'));

  it('reads every match with teams and competition', () => {
    expect(fixtures).toHaveLength(52);
    const celta = fixtures.find((f) => f.id === 'ics-5868139-8633@fotmob.com')!;
    expect(celta).toMatchObject({ home: 'Real Madrid', away: 'Celta Vigo', competition: 'LaLiga', kickoff: '2026-11-21T20:00:00Z' });
    expect(new Set(fixtures.map((f) => f.competition))).toEqual(new Set(['Club Friendlies', 'LaLiga', 'Champions League', 'Super Cup']));
  });

  it('drops the emoji and the final score', () => {
    const leganes = fixtures.find((f) => f.id === 'ics-5958714-8633@fotmob.com')!;
    expect(leganes).toMatchObject({ home: 'Real Madrid', away: 'Leganés' });
  });

  it('treats far-off kick-off times as not confirmed', () => {
    expect(fixtures.find((f) => f.id === 'ics-5868139-8633@fotmob.com')!.timeConfirmed).toBe(true); // 10 days ahead
    expect(fixtures.find((f) => f.id === 'ics-5868389-8633@fotmob.com')!.timeConfirmed).toBe(false); // May 2027
  });
});
