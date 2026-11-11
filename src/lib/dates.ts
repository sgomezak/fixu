// Calendar ("civil") dates as YYYY-MM-DD strings. Pure, timezone-free arithmetic.
// Times of day are interpreted in the user's timezone (Europe/Madrid) where needed.
export type ISODate = string; // 'YYYY-MM-DD'

const pad = (n: number) => String(n).padStart(2, '0');

export const toISO = (y: number, m: number, d: number): ISODate => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
};

export const parts = (iso: ISODate) => {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
};

export const addDays = (iso: ISODate, n: number): ISODate => {
  const { y, m, d } = parts(iso);
  return toISO(y, m, d + n);
};

/** ISO weekday: Monday = 1 … Sunday = 7 */
export const weekday = (iso: ISODate): number => {
  const { y, m, d } = parts(iso);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return w === 0 ? 7 : w;
};

export const startOfWeek = (iso: ISODate): ISODate => addDays(iso, 1 - weekday(iso));
export const startOfMonth = (iso: ISODate): ISODate => { const { y, m } = parts(iso); return toISO(y, m, 1); };
export const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
export const addMonths = (iso: ISODate, n: number): ISODate => {
  const { y, m, d } = parts(iso);
  const target = new Date(Date.UTC(y, m - 1 + n, 1));
  const ty = target.getUTCFullYear(), tm = target.getUTCMonth() + 1;
  return toISO(ty, tm, Math.min(d, daysInMonth(ty, tm)));
};
export const diffDays = (a: ISODate, b: ISODate) => {
  const pa = parts(a), pb = parts(b);
  return Math.round((Date.UTC(pa.y, pa.m - 1, pa.d) - Date.UTC(pb.y, pb.m - 1, pb.d)) / 86_400_000);
};

/** Today's date in a timezone (default Europe/Madrid). */
export const todayIn = (timeZone = 'Europe/Madrid', now = new Date()): ISODate =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

/** Last given weekday (1-7) of a month. */
export const lastWeekdayOfMonth = (y: number, m: number, wd: number): ISODate => {
  const last = toISO(y, m, daysInMonth(y, m));
  return addDays(last, -((weekday(last) - wd + 7) % 7));
};
