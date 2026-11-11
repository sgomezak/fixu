import type { ISODate } from '@/lib/dates';

export type EventState = 'planned' | 'done' | 'missed' | 'rescheduled' | 'cancelled';
export type LifeArea = 'gym' | 'health' | 'work' | 'side_hustle' | 'social' | 'routine' | 'finance' | 'travel' | 'other';
export type LayerKey = 'personal' | 'holidays' | 'company' | 'football' | 'cultural';

/** A user event (mirrors public.events). Times are ISO instants. */
export type CalendarEvent = {
  id: string;
  title: string;
  area: LifeArea;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  state: EventState;
  rescheduledTo?: string | null;
  source: 'manual' | 'nl' | 'suggestion' | 'import' | 'recurring';
  notes?: string | null;
};

export type HolidayScope = 'national' | 'regional' | 'local' | 'company';

/** Anything shown on the calendar, normalised for the views. */
export type CalendarItem =
  | { kind: 'event'; layer: 'personal'; id: string; date: ISODate; start?: number; end?: number; event: CalendarEvent }
  | { kind: 'holiday'; layer: 'holidays' | 'company'; id: string; date: ISODate; title: string; scope: HolidayScope; sourceName?: string; sourceUrl?: string | null; provisional?: boolean }
  | { kind: 'cultural'; layer: 'cultural'; id: string; date: ISODate; title: string }
  | { kind: 'fixture'; layer: 'football'; id: string; date: ISODate; start: number; end: number; title: string; competition: string; timeConfirmed: boolean };

export type CompanyHoliday = { id: string; date: ISODate; name: string };

export type Fixture = {
  id: string;
  competition: string;
  home: string;
  away: string;
  kickoff: string; // ISO instant
  timeConfirmed: boolean;
  source: 'football-data' | 'ics';
};
