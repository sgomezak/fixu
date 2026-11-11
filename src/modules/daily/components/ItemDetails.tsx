'use client';

import { useId, useState } from 'react';
import { ArrowUpRight, CalendarClock, CircleCheck, CircleX, RotateCcw, Trash2 } from 'lucide-react';
import { buttonStyles, fieldStyles } from '@/components/ui/Sheet';
import { t } from '@/lib/i18n/en';
import { instant, zoned } from '@/lib/tz';
import { calendarActions } from '../store';
import type { CalendarItem } from '../types';
import { itemMeta, itemTime } from './ItemChip';

const dateFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const formatDay = (iso: string) => dateFmt.format(new Date(`${iso}T12:00:00Z`));

/** Body of the item sheet. Events get state actions; reference items show their source. */
export function ItemDetails({ item, onDone, onToast }: { item: CalendarItem; onDone: () => void; onToast: (msg: string, undo?: () => void) => void }) {
  const time = itemTime(item);
  const meta = itemMeta(item);

  const summary = (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[0.9375rem]">
      <dt className="text-muted">{t.daily.form.date}</dt>
      <dd>{formatDay(item.date)}</dd>
      {time && (
        <>
          <dt className="text-muted">{t.daily.form.time}</dt>
          <dd className="tabular">{time}</dd>
        </>
      )}
      {meta && (
        <>
          <dt className="text-muted">{item.kind === 'event' ? t.daily.form.area : item.kind === 'holiday' ? t.daily.holidayLabel : item.kind === 'fixture' ? t.daily.footballLabel : ''}</dt>
          <dd>{meta}</dd>
        </>
      )}
    </dl>
  );

  if (item.kind !== 'event') {
    return (
      <div className="flex flex-col gap-4">
        {summary}
        {item.kind === 'holiday' && item.sourceName && (
          <div className="rounded-[var(--radius-control)] bg-surface-2 p-3 text-[0.875rem]">
            <p className="font-medium">{t.daily.source}</p>
            <p className="text-muted">{item.sourceName}</p>
            {item.sourceUrl && (
              <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
                {item.sourceUrl.includes('boe.es') ? 'BOE' : 'BOCM'} <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  return <EventActions item={item} summary={summary} onDone={onDone} onToast={onToast} />;
}

function EventActions({
  item,
  summary,
  onDone,
  onToast,
}: {
  item: Extract<CalendarItem, { kind: 'event' }>;
  summary: React.ReactNode;
  onDone: () => void;
  onToast: (msg: string, undo?: () => void) => void;
}) {
  const [moving, setMoving] = useState(false);
  const ids = { date: useId(), start: useId(), end: useId(), err: useId() };
  const e = item.event;
  const start = zoned(e.startsAt);
  const end = zoned(e.endsAt);
  const [form, setForm] = useState({ date: start.date, start: start.time, end: end.time });
  const [error, setError] = useState('');

  const setState = (s: 'done' | 'missed' | 'planned') => {
    const prev = e.state;
    calendarActions.setState(e.id, s);
    onDone();
    onToast(`${e.title}: ${t.daily.states[s].toLowerCase()}.`, () => calendarActions.setState(e.id, prev));
  };

  const move = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (form.end <= form.start) {
      setError(t.daily.form.endBeforeStart);
      return;
    }
    const copy = calendarActions.reschedule(e.id, instant(form.date, form.start).toISOString(), instant(form.date, form.end).toISOString());
    onDone();
    onToast(t.daily.event.moved(`${formatDay(form.date)}, ${form.start}`), () => {
      if (copy) calendarActions.removeEvent(copy.id);
      calendarActions.updateEvent(e.id, { state: 'planned', rescheduledTo: null });
    });
  };

  const remove = () => {
    const removed = calendarActions.removeEvent(e.id);
    onDone();
    onToast(t.daily.event.deleted, () => removed && calendarActions.restoreEvent(removed));
  };

  return (
    <div className="flex flex-col gap-4">
      {summary}
      {e.state === 'rescheduled' ? (
        <p className="text-[0.9375rem] text-muted">{t.daily.event.movedFrom}</p>
      ) : moving ? (
        <form onSubmit={move} className="flex flex-col gap-3" noValidate>
          <div className="grid grid-cols-[1fr_auto_auto] gap-2">
            <label className="flex min-w-0 flex-col gap-1">
              <span className={fieldStyles.label}>{t.daily.form.date}</span>
              <input id={ids.date} type="date" required value={form.date} onChange={(x) => setForm({ ...form, date: x.target.value })} className={fieldStyles.input} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={fieldStyles.label}>{t.daily.form.start}</span>
              <input id={ids.start} type="time" required value={form.start} onChange={(x) => setForm({ ...form, start: x.target.value })} className={fieldStyles.input} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={fieldStyles.label}>{t.daily.form.end}</span>
              <input
                id={ids.end}
                type="time"
                required
                value={form.end}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? ids.err : undefined}
                onChange={(x) => {
                  setForm({ ...form, end: x.target.value });
                  setError('');
                }}
                className={fieldStyles.input}
              />
            </label>
          </div>
          {error && <p id={ids.err} className={fieldStyles.error}>{error}</p>}
          <button type="submit" className={buttonStyles.primary}>
            <CalendarClock size={18} aria-hidden="true" /> {t.daily.event.saveMove}
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {e.state !== 'done' && (
            <button type="button" onClick={() => setState('done')} className={buttonStyles.primary}>
              <CircleCheck size={18} aria-hidden="true" /> {t.daily.event.markDone}
            </button>
          )}
          {e.state !== 'missed' && (
            <button type="button" onClick={() => setState('missed')} className={buttonStyles.secondary}>
              <CircleX size={18} aria-hidden="true" /> {t.daily.event.markMissed}
            </button>
          )}
          {e.state !== 'planned' && (
            <button type="button" onClick={() => setState('planned')} className={buttonStyles.secondary}>
              <RotateCcw size={18} aria-hidden="true" /> {t.daily.event.markPlanned}
            </button>
          )}
          <button type="button" onClick={() => setMoving(true)} className={`${buttonStyles.secondary} col-span-2`}>
            <CalendarClock size={18} aria-hidden="true" /> {t.daily.event.reschedule}
          </button>
        </div>
      )}
      <button type="button" onClick={remove} className={buttonStyles.danger}>
        <Trash2 size={18} aria-hidden="true" /> {t.daily.event.delete}
      </button>
    </div>
  );
}
