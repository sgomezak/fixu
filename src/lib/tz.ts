import type { ISODate } from './dates';

export const TZ = 'Europe/Madrid';

const fmtCache = new Map<string, Intl.DateTimeFormat>();
const fmt = (timeZone: string) => {
  let f = fmtCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    fmtCache.set(timeZone, f);
  }
  return f;
};

/** Wall-clock parts of an instant in a timezone. */
export function zoned(instant: Date | string, timeZone = TZ) {
  const d = typeof instant === 'string' ? new Date(instant) : instant;
  const p = Object.fromEntries(fmt(timeZone).formatToParts(d).map((x) => [x.type, x.value]));
  const date = `${p.year}-${p.month}-${p.day}` as ISODate;
  const time = `${p.hour}:${p.minute}`;
  return { date, time, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

/** The instant for a wall-clock date and time in a timezone (handles DST). */
export function instant(date: ISODate, time: string, timeZone = TZ): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  // Offset of the timezone at the guessed instant, then correct once more for DST edges.
  const offsetAt = (t: number) => {
    const z = zoned(new Date(t), timeZone);
    const [zy, zm, zd] = z.date.split('-').map(Number);
    return Date.UTC(zy, zm - 1, zd, Math.floor(z.minutes / 60), z.minutes % 60) - t;
  };
  let t = guess - offsetAt(guess);
  t = guess - offsetAt(t);
  return new Date(t);
}

export const minutesToTime = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
