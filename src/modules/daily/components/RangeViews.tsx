'use client';

import { addDays, daysInMonth, parts, startOfWeek, toISO, weekday } from '@/lib/dates';
import { t } from '@/lib/i18n/en';
import type { CalendarItem } from '../types';
import { ItemChip, itemTitle } from './ItemChip';

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...opts });
const asDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
const weekdayShort = fmt({ weekday: 'short' });
const weekdayNarrow = fmt({ weekday: 'narrow' });
const dayLong = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
const monthLong = fmt({ month: 'long', year: 'numeric' });
const monthShort = fmt({ month: 'long' });

const byDate = (items: CalendarItem[]) => {
  const m = new Map<string, CalendarItem[]>();
  for (const i of items) m.set(i.date, [...(m.get(i.date) ?? []), i]);
  return m;
};
const isHolidayDay = (list: CalendarItem[] = []) => list.some((i) => i.kind === 'holiday');

type Common = { items: CalendarItem[]; today: string; nowMin: number; onOpen: (i: CalendarItem) => void; onPickDay: (d: string) => void };

export function WeekView({ items, date, today, nowMin, onOpen, onPickDay }: Common & { date: string }) {
  const start = startOfWeek(date);
  const days = Array.from({ length: 7 }, (_, k) => addDays(start, k));
  const map = byDate(items);
  return (
    <ol className="grid grid-cols-1 gap-2 xl:grid-cols-7">
      {days.map((d) => {
        const list = map.get(d) ?? [];
        const isToday = d === today;
        return (
          <li key={d} className={`flex min-w-0 flex-col gap-2 rounded-[var(--radius-card)] border bg-surface p-3 ${isToday ? 'border-primary' : 'border-line'}`}>
            <button
              type="button"
              onClick={() => onPickDay(d)}
              className="-m-1 flex min-h-11 items-center gap-2 rounded-lg p-1 text-left transition-colors duration-150 hover:bg-surface-2"
            >
              <span className={`tabular flex size-9 items-center justify-center rounded-full text-[0.9375rem] font-semibold ${isToday ? 'bg-primary text-on-primary' : 'bg-surface-2'}`}>
                {parts(d).d}
              </span>
              <span className="text-[0.9375rem] font-medium">{weekdayShort.format(asDate(d))}</span>
              <span className="sr-only">{dayLong.format(asDate(d))}</span>
              {isHolidayDay(list) && <span className="text-[0.75rem] text-muted">· {t.daily.holidayLabel}</span>}
            </button>
            {list.length ? (
              <ul className="flex flex-col gap-1.5">
                {list.map((i) => (
                  <li key={i.id}>
                    <ItemChip item={i} today={today} nowMin={nowMin} onOpen={onOpen} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-1 text-[0.875rem] text-muted">{t.daily.free}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function MonthGrid({ year, month, map, today, compact, onPickDay }: { year: number; month: number; map: Map<string, CalendarItem[]>; today: string; compact?: boolean; onPickDay: (d: string) => void }) {
  const first = toISO(year, month, 1);
  const lead = weekday(first) - 1;
  const n = daysInMonth(year, month);
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: n }, (_, k) => toISO(year, month, k + 1))];
  while (cells.length % 7) cells.push(null);
  const head = Array.from({ length: 7 }, (_, k) => addDays('2026-11-09', k)); // a Monday

  return (
    <div role="grid" aria-label={monthLong.format(asDate(first))} className="grid grid-cols-7 gap-1">
      <div role="row" className="contents">
        {head.map((d) => (
          <span key={d} role="columnheader" aria-label={fmt({ weekday: 'long' }).format(asDate(d))} className={`text-center font-medium text-muted ${compact ? 'text-[0.625rem]' : 'pb-1 text-[0.75rem]'}`}>
            {compact ? weekdayNarrow.format(asDate(d)) : weekdayShort.format(asDate(d))}
          </span>
        ))}
      </div>
      {Array.from({ length: cells.length / 7 }, (_, r) => (
        <div role="row" key={r} className="contents">
          {cells.slice(r * 7, r * 7 + 7).map((d, c) => {
            if (!d) return <span role="gridcell" key={`e-${r}-${c}`} />;
            const list = map.get(d) ?? [];
            const holiday = isHolidayDay(list);
            const personal = list.filter((i) => i.kind !== 'holiday');
            const isToday = d === today;
            const label = `${dayLong.format(asDate(d))}${holiday ? `, ${t.daily.holidayLabel}` : ''}${personal.length ? `, ${personal.length}` : ''}`;
            if (compact) {
              return (
                <span role="gridcell" key={d} aria-label={label} className="flex justify-center">
                  <span
                    aria-hidden="true"
                    className={`tabular flex size-6 items-center justify-center rounded-full text-[0.6875rem] ${
                      isToday ? 'bg-primary font-semibold text-on-primary' : holiday ? 'bg-surface-2 font-semibold text-ink underline decoration-1 underline-offset-2' : personal.length ? 'font-semibold text-ink' : 'text-muted'
                    }`}
                  >
                    {parts(d).d}
                  </span>
                </span>
              );
            }
            return (
              <span role="gridcell" key={d} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onPickDay(d)}
                  className={`flex h-full min-h-14 w-full min-w-0 flex-col items-stretch gap-1 rounded-lg border p-1 text-left transition-colors duration-150 hover:bg-surface-2 sm:min-h-24 sm:p-1.5 ${
                    holiday ? 'border-line bg-surface-2/70' : 'border-transparent bg-surface'
                  } ${isToday ? 'ring-2 ring-primary ring-inset' : ''}`}
                >
                  <span aria-hidden="true" className={`tabular text-[0.8125rem] font-semibold ${isToday ? 'text-primary' : ''}`}>{parts(d).d}</span>
                  <span className="sr-only">{label}</span>
                  {/* Phones: dots. Larger screens: first two titles. */}
                  <span aria-hidden="true" className="flex flex-wrap gap-0.5 sm:hidden">
                    {list.slice(0, 4).map((i) => (
                      <span key={i.id} className={`size-1.5 rounded-full ${i.kind === 'holiday' ? 'bg-ink' : i.kind === 'event' ? 'bg-primary' : 'bg-muted'}`} />
                    ))}
                  </span>
                  <span aria-hidden="true" className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                    {list.slice(0, 2).map((i) => (
                      <span key={i.id} className="truncate rounded bg-surface px-1 text-[0.6875rem] leading-4">{itemTitle(i)}</span>
                    ))}
                    {list.length > 2 && <span className="text-[0.6875rem] text-muted">{t.daily.more(list.length - 2)}</span>}
                  </span>
                </button>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function MonthView({ items, date, today, onPickDay }: Common & { date: string }) {
  const { y, m } = parts(date);
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-2 sm:p-3">
      <MonthGrid year={y} month={m} map={byDate(items)} today={today} onPickDay={onPickDay} />
    </div>
  );
}

export function YearView({ items, date, today, onPickMonth }: Omit<Common, 'onPickDay'> & { date: string; onPickMonth: (d: string) => void }) {
  const { y } = parts(date);
  const map = byDate(items);
  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 12 }, (_, k) => k + 1).map((m) => {
        const first = toISO(y, m, 1);
        return (
          <li key={m} className="rounded-[var(--radius-card)] border border-line bg-surface p-3">
            <button
              type="button"
              onClick={() => onPickMonth(first)}
              className="mb-2 flex min-h-11 w-full items-center rounded-lg px-1 text-left text-[1rem] font-semibold transition-colors duration-150 hover:bg-surface-2"
            >
              {monthShort.format(asDate(first))}
            </button>
            <MonthGrid year={y} month={m} map={map} today={today} compact onPickDay={() => onPickMonth(first)} />
          </li>
        );
      })}
    </ol>
  );
}
