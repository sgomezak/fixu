import holidays2026 from '../../../data/holidays/2026.json';
import holidays2027 from '../../../data/holidays/2027.json';
import { culturalDates } from '@/lib/calendar/cultural';
import { parts, type ISODate } from '@/lib/dates';
import { zoned } from '@/lib/tz';
import type { CalendarData } from './store';
import type { CalendarItem, Fixture, HolidayScope } from './types';

type HolidayFile = typeof holidays2026;
const holidayFiles: HolidayFile[] = [holidays2026, holidays2027 as HolidayFile];

/** Years with official holiday data (shown as covered in the UI). */
export const holidayYears = holidayFiles.map((f) => f.year);

const inRange = (d: ISODate, from: ISODate, to: ISODate) => d >= from && d <= to;

export function publicHolidayItems(from: ISODate, to: ISODate): CalendarItem[] {
  return holidayFiles.flatMap((f) =>
    f.holidays
      .filter((h) => inRange(h.date, from, to))
      .map((h) => ({
        kind: 'holiday' as const,
        layer: 'holidays' as const,
        id: `hol-${h.date}-${h.scope}`,
        date: h.date,
        title: h.name,
        scope: h.scope as HolidayScope,
        sourceName: h.source.name,
        sourceUrl: h.source.url,
        provisional: 'provisional' in h ? Boolean(h.provisional) : false,
      })),
  );
}

export function culturalItems(from: ISODate, to: ISODate): CalendarItem[] {
  const out: CalendarItem[] = [];
  for (let y = parts(from).y; y <= parts(to).y; y++) {
    for (const c of culturalDates(y)) {
      if (inRange(c.date, from, to)) out.push({ kind: 'cultural', layer: 'cultural', id: `cul-${c.date}-${c.key}`, date: c.date, title: c.name });
    }
  }
  return out;
}

export function fixtureItems(fixtures: Fixture[], from: ISODate, to: ISODate): CalendarItem[] {
  return fixtures.flatMap((f) => {
    const z = zoned(f.kickoff);
    if (!inRange(z.date, from, to)) return [];
    return [{
      kind: 'fixture' as const,
      layer: 'football' as const,
      id: `fx-${f.id}`,
      date: z.date,
      start: z.minutes,
      end: Math.min(z.minutes + 120, 24 * 60),
      title: `${f.home} – ${f.away}`,
      competition: f.competition,
      timeConfirmed: f.timeConfirmed,
    }];
  });
}

/** Everything visible on the calendar between two dates (inclusive), respecting layer toggles. */
export function itemsForRange(data: CalendarData, fixtures: Fixture[], from: ISODate, to: ISODate): CalendarItem[] {
  const items: CalendarItem[] = [];
  if (data.layers.holidays) items.push(...publicHolidayItems(from, to));
  if (data.layers.company) {
    for (const h of data.companyHolidays) {
      if (inRange(h.date, from, to)) items.push({ kind: 'holiday', layer: 'company', id: `co-${h.id}`, date: h.date, title: h.name, scope: 'company' });
    }
  }
  if (data.layers.cultural) items.push(...culturalItems(from, to));
  if (data.layers.football) items.push(...fixtureItems(fixtures, from, to));
  if (data.layers.personal) {
    for (const e of data.events) {
      const s = zoned(e.startsAt);
      if (!inRange(s.date, from, to)) continue;
      const end = zoned(e.endsAt);
      items.push({
        kind: 'event',
        layer: 'personal',
        id: e.id,
        date: s.date,
        start: e.allDay ? undefined : s.minutes,
        end: e.allDay ? undefined : end.date === s.date ? end.minutes : 24 * 60,
        event: e,
      });
    }
  }
  return items.sort((a, b) => a.date.localeCompare(b.date) || startOf(a) - startOf(b));
}

const startOf = (i: CalendarItem) => ('start' in i && i.start != null ? i.start : -1);

export const isTimed = (i: CalendarItem): i is Extract<CalendarItem, { start: number }> =>
  'start' in i && typeof i.start === 'number';
