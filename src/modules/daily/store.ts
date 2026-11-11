'use client';

import { useSyncExternalStore } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getBrowserClient } from '@/lib/supabase/client';
import type { CalendarEvent, CompanyHoliday, EventState, LayerKey } from './types';

/**
 * Calendar data store.
 * - With Supabase configured: loads the signed-in user's rows and writes every change back.
 *   Changes apply on screen at once; if a write fails the change is rolled back and `error` is set.
 * - Without Supabase (local demo builds, tests): keeps data in localStorage.
 */
export type CalendarData = {
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  events: CalendarEvent[];
  companyHolidays: CompanyHoliday[];
  layers: Record<LayerKey, boolean>;
};

const KEY = 'fixu-calendar-v1';
const defaultLayers: Record<LayerKey, boolean> = { personal: true, holidays: true, company: true, football: true, cultural: true };
const initial: CalendarData = { status: 'loading', error: null, events: [], companyHolidays: [], layers: defaultLayers };

let state: CalendarData = initial;
let started = false;
let userId: string | null = null;
const listeners = new Set<() => void>();

const db = (): SupabaseClient | null => getBrowserClient();

function emit(next: CalendarData) {
  state = next;
  if (!db()) {
    try {
      const { events, companyHolidays, layers } = state;
      localStorage.setItem(KEY, JSON.stringify({ events, companyHolidays, layers }));
    } catch {
      // Storage full or blocked: keep working in memory.
    }
  }
  listeners.forEach((l) => l());
}

// Row mapping -----------------------------------------------------------------------------------------
type EventRow = {
  id: string;
  title: string;
  area: CalendarEvent['area'];
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  state: EventState;
  rescheduled_to: string | null;
  source: CalendarEvent['source'];
  notes: string | null;
};
const fromRow = (r: EventRow): CalendarEvent => ({
  id: r.id,
  title: r.title,
  area: r.area,
  startsAt: r.starts_at,
  endsAt: r.ends_at,
  allDay: r.all_day,
  state: r.state,
  rescheduledTo: r.rescheduled_to,
  source: r.source,
  notes: r.notes,
});
const toRow = (e: CalendarEvent) => ({
  id: e.id,
  user_id: userId,
  title: e.title,
  area: e.area,
  starts_at: e.startsAt,
  ends_at: e.endsAt,
  all_day: e.allDay,
  state: e.state,
  rescheduled_to: e.rescheduledTo ?? null,
  source: e.source,
  notes: e.notes ?? null,
});
const patchRow = (p: Partial<CalendarEvent>) => {
  const r: Record<string, unknown> = {};
  if (p.title !== undefined) r.title = p.title;
  if (p.area !== undefined) r.area = p.area;
  if (p.startsAt !== undefined) r.starts_at = p.startsAt;
  if (p.endsAt !== undefined) r.ends_at = p.endsAt;
  if (p.allDay !== undefined) r.all_day = p.allDay;
  if (p.state !== undefined) r.state = p.state;
  if (p.rescheduledTo !== undefined) r.rescheduled_to = p.rescheduledTo;
  if (p.notes !== undefined) r.notes = p.notes;
  return r;
};

// Loading -----------------------------------------------------------------------------------------------
export async function loadCalendar() {
  const supabase = db();
  if (!supabase) {
    try {
      const raw = localStorage.getItem(KEY);
      const saved = raw ? (JSON.parse(raw) as Partial<CalendarData>) : {};
      emit({ ...initial, ...saved, layers: { ...defaultLayers, ...saved.layers }, status: 'ready', error: null });
    } catch {
      emit({ ...initial, status: 'ready' });
    }
    return;
  }
  emit({ ...state, status: 'loading', error: null });
  const { data: auth } = await supabase.auth.getUser();
  userId = auth.user?.id ?? null;
  if (!userId) return emit({ ...state, status: 'error', error: 'signedOut' });
  const [ev, ly, co] = await Promise.all([
    supabase.from('events').select('id,title,area,starts_at,ends_at,all_day,state,rescheduled_to,source,notes').order('starts_at'),
    supabase.from('layers').select('key,visible'),
    supabase.from('holidays').select('id,date,name').eq('scope', 'company').order('date'),
  ]);
  if (ev.error || ly.error || co.error) return emit({ ...state, status: 'error', error: 'load' });
  const layers = { ...defaultLayers };
  for (const l of ly.data as { key: LayerKey; visible: boolean }[]) layers[l.key] = l.visible;
  emit({
    status: 'ready',
    error: null,
    events: (ev.data as EventRow[]).map(fromRow),
    companyHolidays: co.data as CompanyHoliday[],
    layers,
  });
}

const subscribe = (l: () => void) => {
  if (!started && typeof window !== 'undefined') {
    started = true;
    void loadCalendar();
  }
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useCalendarData(): CalendarData {
  return useSyncExternalStore(subscribe, () => state, () => initial);
}

/** Apply a change now; run the remote write; roll back if it fails. */
async function optimistic(next: CalendarData, write?: (s: SupabaseClient) => PromiseLike<{ error: unknown }>[]) {
  const before = state;
  emit({ ...next, error: null });
  const supabase = db();
  if (!supabase || !write) return true;
  const results = await Promise.all(write(supabase));
  if (results.some((r) => r.error)) {
    emit({ ...before, error: 'save' });
    return false;
  }
  return true;
}

const uid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

export const calendarActions = {
  addEvent(e: Omit<CalendarEvent, 'id' | 'state' | 'source'> & Partial<Pick<CalendarEvent, 'state' | 'source'>>) {
    const ev: CalendarEvent = { id: uid(), state: 'planned', source: 'manual', ...e };
    void optimistic({ ...state, events: [...state.events, ev] }, (s) => [s.from('events').insert(toRow(ev))]);
    return ev;
  },
  updateEvent(id: string, patch: Partial<CalendarEvent>) {
    void optimistic(
      { ...state, events: state.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) },
      (s) => [s.from('events').update(patchRow(patch)).eq('id', id)],
    );
  },
  setState(id: string, st: EventState) {
    calendarActions.updateEvent(id, { state: st });
  },
  /** Moves an event: the original stays as "rescheduled" (history), a new planned copy is created. */
  reschedule(id: string, startsAt: string, endsAt: string) {
    const orig = state.events.find((e) => e.id === id);
    if (!orig) return;
    const copy: CalendarEvent = { ...orig, id: uid(), startsAt, endsAt, state: 'planned', rescheduledTo: null };
    void optimistic(
      { ...state, events: [...state.events.map((e) => (e.id === id ? { ...e, state: 'rescheduled' as const, rescheduledTo: copy.id } : e)), copy] },
      (s) => [
        // Insert the copy first: the original points to it.
        s.from('events').insert(toRow(copy)).then((r) =>
          r.error ? r : s.from('events').update({ state: 'rescheduled', rescheduled_to: copy.id }).eq('id', id),
        ),
      ],
    );
    return copy;
  },
  removeEvent(id: string) {
    const removed = state.events.find((e) => e.id === id);
    void optimistic({ ...state, events: state.events.filter((e) => e.id !== id) }, (s) => [s.from('events').delete().eq('id', id)]);
    return removed;
  },
  restoreEvent(e: CalendarEvent) {
    void optimistic({ ...state, events: [...state.events, e] }, (s) => [s.from('events').insert(toRow(e))]);
  },
  setLayer(key: LayerKey, visible: boolean) {
    void optimistic({ ...state, layers: { ...state.layers, [key]: visible } }, (s) => [
      s.from('layers').upsert({ user_id: userId, key, visible }, { onConflict: 'user_id,key' }),
    ]);
  },
  replaceCompanyHolidays(list: CompanyHoliday[]) {
    void optimistic({ ...state, companyHolidays: list }, (s) => [
      s
        .from('holidays')
        .delete()
        .eq('scope', 'company')
        .eq('user_id', userId)
        .then((r) =>
          r.error || !list.length
            ? r
            : s.from('holidays').insert(list.map((h) => ({ user_id: userId, date: h.date, name: h.name, scope: 'company' }))),
        ),
    ]);
  },
  retry() {
    void loadCalendar();
  },
  dismissError() {
    emit({ ...state, error: null });
  },
};
