import { ArrowRight, Building2, CircleCheck, CircleDashed, CircleX, Landmark, Star, Trophy, type LucideIcon } from 'lucide-react';
import { t } from '@/lib/i18n/en';
import { minutesToTime } from '@/lib/tz';
import type { CalendarItem } from '../types';

export type ItemLook = { icon: LucideIcon; className: string; titleClass?: string; stateLabel?: string };

/** Visual for each kind/state. Never colour alone: every look has an icon, and states have words. */
export function lookFor(item: CalendarItem, today: string, nowMin: number): ItemLook {
  switch (item.kind) {
    case 'holiday':
      return item.layer === 'company'
        ? { icon: Building2, className: 'border-line bg-surface-2 text-ink' }
        : { icon: Landmark, className: 'border-line bg-surface-2 text-ink' };
    case 'cultural':
      return { icon: Star, className: 'border-dashed border-line bg-surface text-ink' };
    case 'fixture':
      return { icon: Trophy, className: 'border-line bg-surface text-ink' };
    case 'event': {
      const e = item.event;
      if (e.state === 'done') return { icon: CircleCheck, className: 'border-primary/40 bg-primary-soft text-ink [&_svg]:text-primary', stateLabel: t.daily.states.done };
      if (e.state === 'missed')
        return { icon: CircleX, className: 'border-dashed border-line bg-surface-2 text-muted', titleClass: 'line-through decoration-1', stateLabel: t.daily.states.missed };
      if (e.state === 'rescheduled' || e.state === 'cancelled')
        return { icon: ArrowRight, className: 'border-line bg-surface text-muted', titleClass: 'line-through decoration-1', stateLabel: t.daily.states[e.state] };
      const past = item.date < today || (item.date === today && (item.end ?? 24 * 60) <= nowMin);
      return past
        ? { icon: CircleDashed, className: 'border-line bg-surface text-ink', stateLabel: t.daily.notChecked }
        : { icon: CircleDashed, className: 'border-line border-l-[3px] border-l-primary bg-surface text-ink' };
    }
  }
}

export const itemTitle = (i: CalendarItem) => (i.kind === 'event' ? i.event.title : i.title);

export function itemTime(i: CalendarItem): string | null {
  if (i.kind === 'fixture') return i.timeConfirmed ? minutesToTime(i.start) : t.daily.timeTbc;
  if (i.kind === 'event' && i.start != null) return `${minutesToTime(i.start)}–${minutesToTime(i.end ?? i.start)}`;
  return null;
}

export function itemMeta(i: CalendarItem): string | null {
  if (i.kind === 'holiday') return `${t.daily.scope[i.scope]}${i.provisional ? ` · ${t.daily.provisional}` : ''}`;
  if (i.kind === 'fixture') return i.competition;
  if (i.kind === 'cultural') return t.daily.culturalLabel;
  if (i.kind === 'event') {
    const area = t.daily.areas[i.event.area];
    return area.toLowerCase() === i.event.title.trim().toLowerCase() ? null : area;
  }
  return null;
}

/** A compact row used in week lists, sheets and the day's all-day strip. */
export function ItemChip({ item, today, nowMin, onOpen }: { item: CalendarItem; today: string; nowMin: number; onOpen: (i: CalendarItem) => void }) {
  const look = lookFor(item, today, nowMin);
  const Icon = look.icon;
  const time = itemTime(item);
  const meta = itemMeta(item);
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={`flex min-h-11 w-full min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-[transform,background-color] duration-150 hover:-translate-y-px active:translate-y-0 ${look.className}`}
    >
      <Icon size={16} strokeWidth={2.25} aria-hidden="true" className="shrink-0" />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[0.9375rem] font-medium ${look.titleClass ?? ''}`}>{itemTitle(item)}</span>
        {(meta || look.stateLabel) && (
          <span className="block truncate text-[0.8125rem] text-muted">
            {[look.stateLabel, meta].filter(Boolean).join(' · ')}
          </span>
        )}
      </span>
      {time && <span className="tabular shrink-0 text-[0.8125rem] text-muted">{time}</span>}
    </button>
  );
}
