'use client';

import { Sofa } from 'lucide-react';
import { StatusBadge } from '@/components/ui';
import type { GoalProgress } from '@/lib/goals';
import { t } from '@/lib/i18n/en';
import type { CalendarItem } from '../types';
import { ItemChip } from './ItemChip';

function GoalRow({ g }: { g: GoalProgress }) {
  const pct = g.target ? Math.min(100, Math.round((g.done / g.target) * 100)) : 0;
  return (
    <li className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">{g.label}</span>
        <StatusBadge status={g.status} />
      </div>
      <div
        role="progressbar"
        aria-label={g.label}
        aria-valuemin={0}
        aria-valuemax={g.target ?? 0}
        aria-valuenow={g.done}
        aria-valuetext={t.daily.goalOf(g.done, g.target, g.unit)}
        className="h-1.5 overflow-hidden rounded-full bg-surface-2"
      >
        <div className={`h-full rounded-full ${g.status === 'behind' ? 'bg-catchup' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="tabular text-[0.875rem] text-muted">
        {g.target == null ? t.daily.targetNotSet : t.daily.goalOf(g.done, g.target, g.unit)}
        {g.planned > 0 && ` · ${t.daily.goalPlanned(g.planned, g.unit)}`}
      </p>
    </li>
  );
}

export function Relax() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Sofa size={20} aria-hidden="true" />
      </span>
      <div>
        <p className="font-semibold">{t.daily.relax}</p>
        <p className="text-[0.875rem] text-muted">{t.daily.relaxBody}</p>
      </div>
    </div>
  );
}

/** Day: that day's planned items (or Relax). Week/Month/Year: goals with progress. */
export function GoalsPanel({
  mode,
  goals,
  dayItems,
  today,
  nowMin,
  onOpen,
}: {
  mode: 'day' | 'range';
  goals: GoalProgress[];
  dayItems: CalendarItem[];
  today: string;
  nowMin: number;
  onOpen: (i: CalendarItem) => void;
}) {
  if (mode === 'day') {
    const own = dayItems.filter((i) => i.kind === 'event' && i.event.state !== 'rescheduled' && i.event.state !== 'cancelled');
    if (!own.length) return <Relax />;
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[0.875rem] text-muted">{t.daily.dayGoalsBody}</p>
        <ul className="flex flex-col gap-1.5">
          {own.map((i) => (
            <li key={i.id}>
              <ItemChip item={i} today={today} nowMin={nowMin} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-5">
      {goals.map((g) => (
        <GoalRow key={g.id} g={g} />
      ))}
    </ul>
  );
}

/** Compact summary for phones; opens the full panel in a sheet. */
export function GoalsSummary({ mode, goals, dayCount, onOpen }: { mode: 'day' | 'range'; goals: GoalProgress[]; dayCount: number; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-12 w-full items-center gap-3 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface px-4 text-left transition-colors duration-150 hover:bg-surface-2 lg:hidden"
    >
      <span className="font-semibold">{t.daily.goalsTitle}</span>
      <span className="tabular min-w-0 flex-1 truncate text-[0.875rem] text-muted">
        {mode === 'day'
          ? dayCount
            ? t.daily.goalPlanned(dayCount, 'items')
            : t.daily.relax
          : goals.map((g) => `${g.label} ${g.done}${g.target != null ? `/${g.target}` : ''}`).join(' · ')}
      </span>
      {mode === 'range' && goals.some((g) => g.status === 'behind') && <StatusBadge status="behind" />}
    </button>
  );
}
