import { addDays, startOfWeek, type ISODate } from '@/lib/dates';

/**
 * Garmin data as written by the "Garmin weekly report" routine (data/garmin/*.csv).
 * Pure functions: parse, summarise a week, and the fatigue signal the scheduler uses.
 */
export type GarminDay = {
  date: ISODate;
  steps: number | null;
  stepGoal: number | null;
  distKm: number | null;
  activeKcal: number | null;
  intensityMin: number | null;
  rhr: number | null;
  stressAvg: number | null;
  bbHigh: number | null;
  bbLow: number | null;
  sleepH: number | null;
  sleepScore: number | null;
  bedtime: string | null;
  wake: string | null;
  hrv: number | null;
};

export type GarminActivity = {
  start: string; // local 'YYYY-MM-DD HH:MM:SS'
  date: ISODate;
  name: string;
  type: string;
  durMin: number | null;
  distKm: number | null;
  kcal: number | null;
  avgHr: number | null;
};

/** CSV with a header row; handles quoted cells. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((x) => x !== '')) rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x !== '')) rows.push(row);
  const [head, ...body] = rows;
  if (!head) return [];
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

const num = (v: string | undefined) => {
  if (v == null || v === '' || v === 'None' || v === 'null') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const str = (v: string | undefined) => (v ? v : null);

export function parseDaily(text: string): GarminDay[] {
  return parseCsv(text)
    .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date ?? ''))
    .map((r) => ({
      date: r.date,
      steps: num(r.steps),
      stepGoal: num(r.stepGoal),
      distKm: num(r.distKm),
      activeKcal: num(r.activeKcal),
      intensityMin: num(r.intensityMin),
      rhr: num(r.rhr),
      stressAvg: num(r.stressAvg),
      bbHigh: num(r.bbHigh),
      bbLow: num(r.bbLow),
      sleepH: num(r.sleepH),
      sleepScore: num(r.sleepScore),
      bedtime: str(r.bedtime),
      wake: str(r.wake),
      hrv: num(r.hrv),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function parseActivities(text: string): GarminActivity[] {
  return parseCsv(text)
    .filter((r) => r.start)
    .map((r) => ({
      start: r.start,
      date: r.date || r.start.slice(0, 10),
      name: r.name || r.type || 'Activity',
      type: r.type ?? '',
      durMin: num(r.durMin),
      distKm: num(r.distKm),
      kcal: num(r.kcal),
      avgHr: num(r.avgHr),
    }))
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** Walks count towards steps, not workouts; golf is a social plan. Short sessions don't count. */
const NOT_WORKOUT = new Set(['walking', 'casual_walking', 'speed_walking', 'golf', 'other', '']);
export const WORKOUT_MIN_MINUTES = 20;
export const isWorkout = (a: GarminActivity) => !NOT_WORKOUT.has(a.type) && (a.durMin ?? 0) >= WORKOUT_MIN_MINUTES;

const avg = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
};

export type WeekSummary = {
  weekStart: ISODate;
  days: ISODate[];
  byDay: (GarminDay | null)[];
  daysWithData: number;
  stepsAvg: number | null;
  sleepAvg: number | null;
  sleepScoreAvg: number | null;
  rhrAvg: number | null;
  hrvAvg: number | null;
  bbHighAvg: number | null;
  stressAvg: number | null;
  workouts: GarminActivity[];
  activities: GarminActivity[];
};

export function summariseWeek(daily: GarminDay[], acts: GarminActivity[], anyDay: ISODate): WeekSummary {
  const weekStart = startOfWeek(anyDay);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const map = new Map(daily.map((d) => [d.date, d]));
  const byDay = days.map((d) => map.get(d) ?? null);
  const present = byDay.filter((d): d is GarminDay => d != null);
  // Steps average only over days the band recorded steps (an unsynced day would drag it down).
  const stepped = present.filter((d) => d.steps != null);
  const activities = acts.filter((a) => a.date >= days[0] && a.date <= days[6]);
  return {
    weekStart,
    days,
    byDay,
    daysWithData: stepped.length,
    stepsAvg: avg(stepped.map((d) => d.steps)),
    sleepAvg: avg(present.map((d) => d.sleepH)),
    sleepScoreAvg: avg(present.map((d) => d.sleepScore)),
    rhrAvg: avg(present.map((d) => d.rhr)),
    hrvAvg: avg(present.map((d) => d.hrv)),
    bbHighAvg: avg(present.map((d) => d.bbHigh)),
    stressAvg: avg(present.map((d) => d.stressAvg)),
    workouts: activities.filter(isWorkout),
    activities,
  };
}

/** Workouts this week: Garmin workouts plus done gym events on days Garmin has none (no double count). */
export function countWorkouts(garmin: GarminActivity[], manualDoneDates: ISODate[]) {
  const garminDays = new Set(garmin.map((a) => a.date));
  const manualOnly = [...new Set(manualDoneDates)].filter((d) => !garminDays.has(d));
  return { total: garmin.length + manualOnly.length, garmin: garmin.length, manual: manualOnly.length };
}

export type FatigueReason = 'shortSleep' | 'poorSleep' | 'lowBodyBattery' | 'highRestingHr';
export type Fatigue = { date: ISODate; level: 'rested' | 'tired' | 'unknown'; reasons: FatigueReason[] };

/**
 * Fatigue signal for a day, from that night's sleep and the morning's Body Battery.
 * Thresholds: under 6.5 h sleep, sleep score under 70, Body Battery peak under 50,
 * resting HR 5+ bpm above the 14-day average.
 */
export function fatigueFor(daily: GarminDay[], date: ISODate): Fatigue {
  const day = daily.find((d) => d.date === date);
  if (!day || (day.sleepH == null && day.bbHigh == null)) return { date, level: 'unknown', reasons: [] };
  const reasons: FatigueReason[] = [];
  if (day.sleepH != null && day.sleepH < 6.5) reasons.push('shortSleep');
  if (day.sleepScore != null && day.sleepScore < 70) reasons.push('poorSleep');
  if (day.bbHigh != null && day.bbHigh < 50) reasons.push('lowBodyBattery');
  const window = daily.filter((d) => d.date < date && d.date >= addDays(date, -14));
  const base = avg(window.map((d) => d.rhr));
  if (day.rhr != null && base != null && day.rhr >= base + 5) reasons.push('highRestingHr');
  return { date, level: reasons.length ? 'tired' : 'rested', reasons };
}

/** The latest day with any data, to open the page on the most recent week. */
export const latestDate = (daily: GarminDay[]) => daily.at(-1)?.date ?? null;
