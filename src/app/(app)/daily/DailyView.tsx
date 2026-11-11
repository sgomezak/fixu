'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Layers, Plus } from 'lucide-react';
import { Card, PageHeader, Segmented } from '@/components/ui';
import { Sheet, buttonStyles, type SheetHandle } from '@/components/ui/Sheet';
import { Toast, useToast } from '@/components/ui/Toast';
import { addDays, addMonths, daysInMonth, parts, startOfWeek, toISO, todayIn, type ISODate } from '@/lib/dates';
import { t } from '@/lib/i18n/en';
import { zoned } from '@/lib/tz';
import { calendarActions, useCalendarData } from '@/modules/daily/store';
import { itemsForRange } from '@/modules/daily/sources';
import { calendarGoals } from '@/modules/daily/goals';
import type { CalendarItem, Fixture } from '@/modules/daily/types';
import { DayView } from '@/modules/daily/components/DayView';
import { MonthView, WeekView, YearView } from '@/modules/daily/components/RangeViews';
import { GoalsPanel, GoalsSummary } from '@/modules/daily/components/GoalsPanel';
import { ItemDetails } from '@/modules/daily/components/ItemDetails';
import { itemTitle } from '@/modules/daily/components/ItemChip';
import { EventForm } from '@/modules/daily/components/EventForm';
import { LayerToggles } from '@/modules/daily/components/LayerToggles';

type View = 'day' | 'week' | 'month' | 'year';
const views: View[] = ['day', 'week', 'month', 'year'];
const isView = (v: string | null): v is View => views.includes(v as View);
const isDate = (v: string | null): v is ISODate => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

function rangeFor(view: View, date: ISODate): [ISODate, ISODate] {
  const { y, m } = parts(date);
  if (view === 'day') return [date, date];
  if (view === 'week') return [startOfWeek(date), addDays(startOfWeek(date), 6)];
  if (view === 'month') return [toISO(y, m, 1), toISO(y, m, daysInMonth(y, m))];
  return [toISO(y, 1, 1), toISO(y, 12, 31)];
}

const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...o });
const asDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
function periodTitle(view: View, date: ISODate) {
  if (view === 'day') return f({ weekday: 'long', day: 'numeric', month: 'long' }).format(asDate(date));
  if (view === 'week') {
    const [a, b] = rangeFor('week', date);
    return f({ day: 'numeric', month: 'short', year: 'numeric' }).formatRange(asDate(a), asDate(b));
  }
  if (view === 'month') return f({ month: 'long', year: 'numeric' }).format(asDate(date));
  return String(parts(date).y);
}

type FixturesState = { status: 'loading' | 'ok' | 'not_configured' | 'error'; list: Fixture[] };

function useFixtures(): FixturesState {
  const [s, setS] = useState<FixturesState>({ status: 'loading', list: [] });
  useEffect(() => {
    let alive = true;
    fetch('/api/fixtures')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { fixtures: Fixture[]; sources: { footballData: string; ics: string } }) => {
        if (!alive) return;
        const anyOk = j.sources.footballData === 'ok' || j.sources.ics === 'ok';
        const anyErr = j.sources.footballData === 'error' || j.sources.ics === 'error';
        setS({ status: anyOk ? 'ok' : anyErr ? 'error' : 'not_configured', list: j.fixtures });
      })
      .catch(() => alive && setS({ status: 'error', list: [] }));
    return () => {
      alive = false;
    };
  }, []);
  return s;
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function DailyView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const now = useNow();
  const today = todayIn('Europe/Madrid', now);
  const nowMin = zoned(now).minutes;

  const view: View = isView(params.get('view')) ? (params.get('view') as View) : 'day';
  const date: ISODate = isDate(params.get('date')) ? (params.get('date') as ISODate) : today;

  const go = useCallback(
    (next: { view?: View; date?: ISODate }) => {
      const q = new URLSearchParams(params);
      q.set('view', next.view ?? view);
      q.set('date', next.date ?? date);
      router.replace(`${pathname}?${q.toString()}`, { scroll: false });
    },
    [params, pathname, router, view, date],
  );

  const step = (dir: 1 | -1) => {
    if (view === 'day') go({ date: addDays(date, dir) });
    else if (view === 'week') go({ date: addDays(date, 7 * dir) });
    else if (view === 'month') go({ date: addMonths(date, dir) });
    else go({ date: addMonths(date, 12 * dir) });
  };

  const data = useCalendarData();
  const fixtures = useFixtures();
  const [from, to] = rangeFor(view, date);
  const items = useMemo(() => itemsForRange(data, fixtures.list, from, to), [data, fixtures.list, from, to]);
  const goals = useMemo(() => calendarGoals(data.events, { period: view === 'day' ? 'week' : view, from: view === 'day' ? rangeFor('week', date)[0] : from, to: view === 'day' ? rangeFor('week', date)[1] : to, today }), [data.events, view, date, from, to, today]);
  const dayOwnCount = items.filter((i) => i.kind === 'event' && i.event.state !== 'rescheduled' && i.event.state !== 'cancelled').length;

  // Sheets
  const itemSheet = useRef<SheetHandle>(null);
  const formSheet = useRef<SheetHandle>(null);
  const layerSheet = useRef<SheetHandle>(null);
  const goalSheet = useRef<SheetHandle>(null);
  const [selected, setSelected] = useState<CalendarItem | null>(null);
  const [formStart, setFormStart] = useState<{ date: ISODate; min: number; key: number }>({ date, min: 18 * 60, key: 0 });
  const { toast, show, dismiss } = useToast();

  const open = (i: CalendarItem) => {
    setSelected(i);
    requestAnimationFrame(() => itemSheet.current?.open());
  };
  const newEvent = (d: ISODate, min: number) => {
    setFormStart({ date: d, min, key: Date.now() });
    requestAnimationFrame(() => formSheet.current?.open());
  };
  const defaultStart = date === today ? Math.min(Math.ceil((nowMin + 1) / 60) * 60, 22 * 60) : 18 * 60;

  const panelMode = view === 'day' ? 'day' : 'range';
  const panel = <GoalsPanel mode={panelMode} goals={goals} dayItems={items} today={today} nowMin={nowMin} onOpen={open} />;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t.daily.title}>
        <Segmented label={t.daily.viewsLabel} value={view} onChange={(v) => go({ view: v })} options={views.map((v) => ({ value: v, label: t.daily.views[v] }))} />
      </PageHeader>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <button type="button" onClick={() => step(-1)} aria-label={t.daily.nav.prev} className={buttonStyles.icon}>
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => step(1)} aria-label={t.daily.nav.next} className={buttonStyles.icon}>
            <ChevronRight size={22} aria-hidden="true" />
          </button>
          <h2 className="tabular ml-1 min-w-0 truncate text-[1.0625rem] font-semibold" aria-live="polite">
            {periodTitle(view, date)}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {!(from <= today && today <= to) && (
            <button type="button" onClick={() => go({ date: today })} className={buttonStyles.quiet}>
              {t.daily.nav.today}
            </button>
          )}
          <button type="button" onClick={() => layerSheet.current?.open()} className={buttonStyles.quiet}>
            <Layers size={18} aria-hidden="true" /> {t.daily.layersButton}
          </button>
          <button type="button" onClick={() => newEvent(view === 'day' ? date : today, defaultStart)} className={`${buttonStyles.quiet} text-ink`}>
            <Plus size={18} aria-hidden="true" /> {t.daily.newEvent}
          </button>
        </div>
      </div>

      {data.error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-danger/40 bg-danger-soft px-4 py-3">
          <p className="text-[0.9375rem] text-ink">
            {data.error === 'save' ? t.daily.sync.saveError : data.error === 'signedOut' ? t.daily.sync.signedOut : t.daily.sync.loadError}
          </p>
          {data.error === 'save' ? (
            <button type="button" onClick={calendarActions.dismissError} className={buttonStyles.quiet}>{t.daily.sync.dismiss}</button>
          ) : data.error === 'signedOut' ? (
            <a href="/login" className={buttonStyles.secondary}>{t.daily.sync.signIn}</a>
          ) : (
            <button type="button" onClick={calendarActions.retry} className={buttonStyles.secondary}>{t.daily.sync.retry}</button>
          )}
        </div>
      )}

      <GoalsSummary mode={panelMode} goals={goals} dayCount={dayOwnCount} onOpen={() => goalSheet.current?.open()} />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-label={periodTitle(view, date)} aria-busy={data.status === 'loading'} className={`min-w-0 transition-opacity duration-150 ${data.status === 'loading' ? 'opacity-60' : ''}`}>
          {view === 'day' && <DayView items={items} date={date} today={today} nowMin={nowMin} onOpen={open} onSlot={(m) => newEvent(date, m)} />}
          {view === 'week' && <WeekView items={items} date={date} today={today} nowMin={nowMin} onOpen={open} onPickDay={(d) => go({ view: 'day', date: d })} />}
          {view === 'month' && <MonthView items={items} date={date} today={today} nowMin={nowMin} onOpen={open} onPickDay={(d) => go({ view: 'day', date: d })} />}
          {view === 'year' && <YearView items={items} date={date} today={today} nowMin={nowMin} onOpen={open} onPickMonth={(d) => go({ view: 'month', date: d })} />}
        </section>
        <Card as="div" className="sticky top-6 hidden flex-col gap-4 lg:flex">
          <h2 className="text-[1.0625rem] font-semibold">{t.daily.goalsTitle}</h2>
          {panel}
        </Card>
      </div>

      <Sheet ref={itemSheet} title={selected ? itemTitle(selected) : ''} closeLabel={t.daily.event.close}>
        {selected && <ItemDetails key={selected.id} item={selected} onDone={() => itemSheet.current?.close()} onToast={show} />}
      </Sheet>
      <Sheet ref={formSheet} title={t.daily.form.title} closeLabel={t.daily.event.close}>
        <EventForm
          key={formStart.key}
          date={formStart.date}
          startMin={formStart.min}
          onSaved={(title) => {
            formSheet.current?.close();
            show(t.daily.form.added(title));
          }}
        />
      </Sheet>
      <Sheet ref={layerSheet} title={t.daily.layers.title} closeLabel={t.daily.event.close}>
        <LayerToggles layers={data.layers} fixtures={fixtures.status} />
      </Sheet>
      <Sheet ref={goalSheet} title={t.daily.goalsTitle} closeLabel={t.daily.event.close}>
        {panel}
      </Sheet>
      <Toast toast={toast} undoLabel={t.daily.event.undo} onDismiss={dismiss} />
    </div>
  );
}
