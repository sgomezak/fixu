import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { parseIcs } from './fixtures.server';

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
