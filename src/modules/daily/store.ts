'use client';

import { useSyncExternalStore } from 'react';
import type { CalendarEvent, CompanyHoliday, EventState, LayerKey } from './types';

/**
 * Calendar data store. Phase 1 keeps data in the browser (localStorage) behind this interface;
 * the Supabase implementation replaces `persist`/`load` once the project keys are connected,
 * without changing the views.
 */
export type CalendarData = {
  events: CalendarEvent[];
  companyHolidays: CompanyHoliday[];
  layers: Record<LayerKey, boolean>;
};

const KEY = 'fixu-calendar-v1';
const defaults: CalendarData = {
  events: [],
  companyHolidays: [],
  layers: { personal: true, holidays: true, company: true, football: true, cultural: true },
};

let state: CalendarData = defaults;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CalendarData>;
      state = { ...defaults, ...parsed, layers: { ...defaults.layers, ...parsed.layers } };
    }
  } catch {
    state = defaults;
  }
}

function set(next: CalendarData) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: keep working in memory.
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  load();
  listeners.add(l);
  return () => listeners.delete(l);
};

const serverSnapshot = defaults;

export function useCalendarData(): CalendarData {
  return useSyncExternalStore(subscribe, () => (load(), state), () => serverSnapshot);
}

const uid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

export const calendarActions = {
  addEvent(e: Omit<CalendarEvent, 'id' | 'state' | 'source'> & Partial<Pick<CalendarEvent, 'state' | 'source'>>) {
    const ev: CalendarEvent = { id: uid(), state: 'planned', source: 'manual', ...e };
    set({ ...state, events: [...state.events, ev] });
    return ev;
  },
  updateEvent(id: string, patch: Partial<CalendarEvent>) {
    set({ ...state, events: state.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  },
  setState(id: string, s: EventState) {
    this.updateEvent(id, { state: s });
  },
  /** Moves an event: the original stays as "rescheduled" (history), a new planned copy is created. */
  reschedule(id: string, startsAt: string, endsAt: string) {
    const orig = state.events.find((e) => e.id === id);
    if (!orig) return;
    const copy: CalendarEvent = { ...orig, id: uid(), startsAt, endsAt, state: 'planned', rescheduledTo: null };
    set({
      ...state,
      events: [...state.events.map((e) => (e.id === id ? { ...e, state: 'rescheduled' as const, rescheduledTo: copy.id } : e)), copy],
    });
    return copy;
  },
  removeEvent(id: string) {
    const removed = state.events.find((e) => e.id === id);
    set({ ...state, events: state.events.filter((e) => e.id !== id) });
    return removed;
  },
  restoreEvent(e: CalendarEvent) {
    set({ ...state, events: [...state.events, e] });
  },
  setLayer(key: LayerKey, visible: boolean) {
    set({ ...state, layers: { ...state.layers, [key]: visible } });
  },
  replaceCompanyHolidays(list: CompanyHoliday[]) {
    set({ ...state, companyHolidays: list });
  },
};
