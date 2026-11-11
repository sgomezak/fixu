'use client';

import { minutesToTime } from '@/lib/tz';
import { isTimed } from '../sources';
import type { CalendarItem } from '../types';
import { ItemChip, itemTitle, itemTime, lookFor } from './ItemChip';
import { t } from '@/lib/i18n/en';

const HOUR = 56; // px per hour

type Timed = Extract<CalendarItem, { start: number }>;

/** Side-by-side columns for overlapping blocks. */
function layout(items: Timed[]) {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const out: { item: Timed; col: number; cols: number }[] = [];
  let group: { item: Timed; col: number }[] = [];
  let groupEnd = -1;
  const flush = () => {
    const cols = Math.max(1, ...group.map((g) => g.col + 1));
    group.forEach((g) => out.push({ ...g, cols }));
    group = [];
  };
  for (const item of sorted) {
    if (item.start >= groupEnd && group.length) flush();
    const used = new Set(group.filter((g) => g.item.end > item.start).map((g) => g.col));
    let col = 0;
    while (used.has(col)) col++;
    group.push({ item, col });
    groupEnd = Math.max(groupEnd, Math.max(item.end, item.start + 30));
  }
  flush();
  return out;
}

export function DayView({
  items,
  date,
  today,
  nowMin,
  onOpen,
  onSlot,
}: {
  items: CalendarItem[];
  date: string;
  today: string;
  nowMin: number;
  onOpen: (i: CalendarItem) => void;
  onSlot: (minutes: number) => void;
}) {
  const allDay = items.filter((i) => !isTimed(i));
  const timed = items.filter(isTimed);
  const first = Math.min(6, ...timed.map((i) => Math.floor(i.start / 60)));
  const hours = Array.from({ length: 24 - first }, (_, k) => first + k);
  const placed = layout(timed);
  const showNow = date === today && nowMin >= first * 60;

  return (
    <div className="flex flex-col gap-3">
      {allDay.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label={t.daily.allDay}>
          {allDay.map((i) => (
            <li key={i.id}>
              <ItemChip item={i} today={today} nowMin={nowMin} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      <div className="relative rounded-[var(--radius-card)] border border-line bg-surface">
        <ol aria-label={t.daily.views.day}>
          {hours.map((h) => (
            <li key={h} className="flex border-b border-line/60 last:border-b-0" style={{ height: HOUR }}>
              <span className="tabular w-14 shrink-0 pt-1.5 pr-2 text-right text-[0.75rem] text-muted">{minutesToTime(h * 60)}</span>
              <button
                type="button"
                onClick={() => onSlot(h * 60)}
                className="flex-1 border-l border-line/60 text-left transition-colors duration-150 hover:bg-surface-2/60"
              >
                <span className="sr-only">{`${t.daily.newEvent}, ${minutesToTime(h * 60)}`}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="pointer-events-none absolute inset-y-0 right-2 left-16">
          {placed.map(({ item, col, cols }) => {
            const look = lookFor(item, today, nowMin);
            const Icon = look.icon;
            const top = ((item.start - first * 60) / 60) * HOUR;
            const height = Math.max(((item.end - item.start) / 60) * HOUR, 40);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpen(item)}
                style={{ top: top + 2, height: height - 4, left: `calc(${(col / cols) * 100}% + 4px)`, width: `calc(${100 / cols}% - 8px)` }}
                className={`pointer-events-auto absolute flex min-w-0 flex-col items-start overflow-hidden rounded-xl border px-2.5 py-1.5 text-left transition-transform duration-150 hover:-translate-y-px ${look.className}`}
              >
                <span className="flex w-full min-w-0 items-center gap-1.5">
                  <Icon size={14} strokeWidth={2.25} aria-hidden="true" className="shrink-0" />
                  <span className={`truncate text-[0.875rem] font-semibold ${look.titleClass ?? ''}`}>{itemTitle(item)}</span>
                </span>
                <span className="tabular truncate text-[0.75rem] text-muted">{[itemTime(item), look.stateLabel].filter(Boolean).join(' · ')}</span>
              </button>
            );
          })}
          {showNow && (
            <div aria-hidden="true" className="absolute right-0 -left-2 flex items-center" style={{ top: ((nowMin - first * 60) / 60) * HOUR }}>
              <span className="size-2 rounded-full bg-ink" />
              <span className="h-px flex-1 bg-ink" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
