import { addDays, lastWeekdayOfMonth, toISO, type ISODate } from '@/lib/dates';

/** Gregorian Easter Sunday (Anonymous Gregorian / Meeus–Jones–Butcher algorithm). */
export function easterSunday(year: number): ISODate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return toISO(year, month, day);
}

export type CulturalDate = { date: ISODate; key: CulturalKey; name: string };
export type CulturalKey =
  | 'maundyThursday'
  | 'goodFriday'
  | 'easterSunday'
  | 'fathersDayES'
  | 'mothersDaySE'
  | 'christmasEve'
  | 'christmasDay';

/** Christian and cultural dates for the "cultural" calendar layer. Moveable ones are computed. */
export function culturalDates(year: number): CulturalDate[] {
  const easter = easterSunday(year);
  return [
    { key: 'fathersDayES', name: 'Father’s Day (Spain)', date: toISO(year, 3, 19) },
    { key: 'maundyThursday', name: 'Maundy Thursday (Jueves Santo)', date: addDays(easter, -3) },
    { key: 'goodFriday', name: 'Good Friday (Viernes Santo)', date: addDays(easter, -2) },
    { key: 'easterSunday', name: 'Easter Sunday (Domingo de Resurrección)', date: easter },
    { key: 'mothersDaySE', name: 'Mother’s Day (Sweden)', date: lastWeekdayOfMonth(year, 5, 7) },
    { key: 'christmasEve', name: 'Christmas Eve', date: toISO(year, 12, 24) },
    { key: 'christmasDay', name: 'Christmas Day', date: toISO(year, 12, 25) },
  ].sort((x, y) => x.date.localeCompare(y.date)) as CulturalDate[];
}
