'use client';

import { useId, useRef, useState } from 'react';
import { buttonStyles, fieldStyles } from '@/components/ui/Sheet';
import { t } from '@/lib/i18n/en';
import { instant, minutesToTime } from '@/lib/tz';
import { addDays } from '@/lib/dates';
import { calendarActions } from '../store';
import type { LifeArea } from '../types';

const areas: LifeArea[] = ['gym', 'side_hustle', 'social', 'work', 'routine', 'health', 'finance', 'travel', 'other'];

export function EventForm({ date, startMin, onSaved }: { date: string; startMin: number; onSaved: (title: string) => void }) {
  const ids = { title: useId(), titleErr: useId(), endErr: useId() };
  const titleRef = useRef<HTMLInputElement>(null);
  const [v, setV] = useState({
    title: '',
    area: 'gym' as LifeArea,
    date,
    start: minutesToTime(startMin),
    end: minutesToTime(Math.min(startMin + 75, 23 * 60 + 59)),
    allDay: false,
  });
  const [errors, setErrors] = useState<{ title?: string; end?: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!v.title.trim()) next.title = t.daily.form.nameRequired;
    if (!v.allDay && v.end <= v.start) next.end = t.daily.form.endBeforeStart;
    setErrors(next);
    if (next.title) return titleRef.current?.focus();
    if (next.end) return;
    calendarActions.addEvent({
      title: v.title.trim(),
      area: v.area,
      allDay: v.allDay,
      startsAt: instant(v.date, v.allDay ? '00:00' : v.start).toISOString(),
      endsAt: v.allDay ? instant(addDays(v.date, 1), '00:00').toISOString() : instant(v.date, v.end).toISOString(),
    });
    onSaved(v.title.trim());
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor={ids.title} className={fieldStyles.label}>{t.daily.form.name}</label>
        <input
          ref={titleRef}
          id={ids.title}
          name="title"
          autoComplete="off"
          placeholder={t.daily.form.namePlaceholder}
          value={v.title}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? ids.titleErr : undefined}
          onChange={(e) => setV({ ...v, title: e.target.value })}
          className={fieldStyles.input}
        />
        {errors.title && <span id={ids.titleErr} className={fieldStyles.error}>{errors.title}</span>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className={fieldStyles.label}>{t.daily.form.area}</span>
          <select name="area" value={v.area} onChange={(e) => setV({ ...v, area: e.target.value as LifeArea })} className={`${fieldStyles.input} bg-bg`}>
            {areas.map((a) => (
              <option key={a} value={a}>{t.daily.areas[a]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={fieldStyles.label}>{t.daily.form.date}</span>
          <input type="date" name="date" required value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} className={fieldStyles.input} />
        </label>
      </div>
      <label className="flex min-h-11 items-center gap-3 self-start">
        <input type="checkbox" checked={v.allDay} onChange={(e) => setV({ ...v, allDay: e.target.checked })} className="size-5 accent-[var(--primary)]" />
        <span className="text-[0.9375rem]">{t.daily.form.allDay}</span>
      </label>
      {!v.allDay && (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className={fieldStyles.label}>{t.daily.form.start}</span>
            <input type="time" name="start" required value={v.start} onChange={(e) => setV({ ...v, start: e.target.value })} className={fieldStyles.input} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={fieldStyles.label}>{t.daily.form.end}</span>
            <input
              type="time"
              name="end"
              required
              value={v.end}
              aria-invalid={Boolean(errors.end)}
              aria-describedby={errors.end ? ids.endErr : undefined}
              onChange={(e) => setV({ ...v, end: e.target.value })}
              className={fieldStyles.input}
            />
          </label>
          {errors.end && <span id={ids.endErr} className={`${fieldStyles.error} col-span-2`}>{errors.end}</span>}
        </div>
      )}
      <button type="submit" className={buttonStyles.primary}>{t.daily.form.save}</button>
    </form>
  );
}
