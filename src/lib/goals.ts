import type { ISODate } from './dates';
import type { Status } from '@/components/ui';

/**
 * Shared goal format. Each module (Daily, Health, Finance, …) has a goal provider that returns these
 * for a period; the Dashboard and weekly report only aggregate them.
 */
export type GoalPeriod = 'day' | 'week' | 'month' | 'year';

export type GoalProgress = {
  id: string;
  area: string;
  label: string;
  done: number;
  planned: number;
  /** null = target not set yet (an open input), never guessed */
  target: number | null;
  unit: string;
  status: Status;
};

export type GoalRange = { period: GoalPeriod; from: ISODate; to: ISODate; today: ISODate };

/** Status from progress against how much of the period has passed. */
export function statusFor(done: number, target: number | null, elapsed: number): Status {
  if (target == null) return 'noData';
  if (done >= target) return 'onTrack';
  if (elapsed <= 0) return 'noData';
  const expected = target * Math.min(1, elapsed);
  if (done >= expected) return 'onTrack';
  if (done >= expected - 1 && elapsed < 1) return 'atRisk';
  return 'behind';
}
