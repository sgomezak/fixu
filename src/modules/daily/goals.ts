import { diffDays, type ISODate } from '@/lib/dates';
import { statusFor, type GoalProgress, type GoalRange } from '@/lib/goals';
import { profileDefaults } from '@/lib/profile';
import { zoned } from '@/lib/tz';
import type { CalendarEvent } from './types';

/** Fraction of [from, to] that has passed by `today` (0 before, 1 after). */
export function elapsedFraction(from: ISODate, to: ISODate, today: ISODate) {
  const total = diffDays(to, from) + 1;
  const passed = diffDays(today, from); // today itself is still in progress
  return Math.max(0, Math.min(1, passed / total));
}

const inRange = (e: CalendarEvent, from: ISODate, to: ISODate) => {
  const d = zoned(e.startsAt).date;
  return d >= from && d <= to;
};

const hours = (e: CalendarEvent) => (new Date(e.endsAt).getTime() - new Date(e.startsAt).getTime()) / 3_600_000;

/**
 * Daily (calendar) goal provider: weekly targets from the profile, scaled to the period.
 * Day view lists that day's planned items instead (handled by the panel).
 */
export function calendarGoals(events: CalendarEvent[], range: GoalRange, profile = profileDefaults, trackingStart?: ISODate): GoalProgress[] {
  // Count only from when tracking began, so a year isn't "behind" for months before the app existed.
  const start = trackingStart ?? events.reduce<ISODate | undefined>((min, e) => {
    const d = zoned(e.startsAt).date;
    return !min || d < min ? d : min;
  }, undefined);
  const r = start && start > range.from && start <= range.to ? { ...range, from: start } : range;
  const days = diffDays(r.to, r.from) + 1;
  const scale = (weekly: number | null) => (weekly == null ? null : r.period === 'week' ? weekly : Math.round((weekly * days) / 7));
  const elapsed = elapsedFraction(r.from, r.to, r.today);
  const live = events.filter((e) => inRange(e, r.from, r.to) && e.state !== 'cancelled' && e.state !== 'rescheduled');

  const of = (area: CalendarEvent['area']) => live.filter((e) => e.area === area);
  const gym = of('gym');
  const side = of('side_hustle');
  const social = of('social');

  const make = (id: string, area: string, label: string, done: number, planned: number, target: number | null, unit: string): GoalProgress => ({
    id, area, label, done, planned, target, unit, status: statusFor(done, target, elapsed),
  });

  return [
    make('gym', 'gym', 'Gym sessions', gym.filter((e) => e.state === 'done').length, gym.filter((e) => e.state === 'planned').length, scale(profile.gym.goalPerWeek), 'sessions'),
    make(
      'side_hustle',
      'side_hustle',
      'Side hustle',
      Math.round(side.filter((e) => e.state === 'done').reduce((s, e) => s + hours(e), 0) * 10) / 10,
      Math.round(side.filter((e) => e.state === 'planned').reduce((s, e) => s + hours(e), 0) * 10) / 10,
      scale(profile.sideHustle.weeklyTargetHours),
      'hours',
    ),
    // Brief §6: at least one social / fun block a week. The exact target is still an open input.
    make('social', 'social', 'Social plans', social.filter((e) => e.state === 'done').length, social.filter((e) => e.state === 'planned').length, scale(profile.social.weeklyTarget ?? 1), 'plans'),
  ];
}
