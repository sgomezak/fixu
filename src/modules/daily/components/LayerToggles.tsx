'use client';

import { Building2, CalendarDays, Landmark, Star, Trophy, type LucideIcon } from 'lucide-react';
import { t } from '@/lib/i18n/en';
import { calendarActions } from '../store';
import type { LayerKey } from '../types';

type FixturesStatus = 'loading' | 'ok' | 'not_configured' | 'error';

const rows: { key: LayerKey; icon: LucideIcon; label: string; hint?: string }[] = [
  { key: 'personal', icon: CalendarDays, label: t.daily.layers.personal },
  { key: 'holidays', icon: Landmark, label: t.daily.layers.holidays, hint: t.daily.layers.holidaysHint },
  { key: 'company', icon: Building2, label: t.daily.layers.company, hint: t.daily.layers.companyHint },
  { key: 'football', icon: Trophy, label: t.daily.layers.football, hint: t.daily.layers.footballHint },
  { key: 'cultural', icon: Star, label: t.daily.layers.cultural, hint: t.daily.layers.culturalHint },
];

export function LayerToggles({ layers, fixtures }: { layers: Record<LayerKey, boolean>; fixtures: FixturesStatus }) {
  return (
    <ul className="flex flex-col divide-y divide-line">
      {rows.map(({ key, icon: Icon, label, hint }) => {
        const note =
          key === 'football' && fixtures === 'not_configured'
            ? t.daily.layers.footballNotConfigured
            : key === 'football' && fixtures === 'error'
              ? t.daily.layers.footballError
              : hint;
        return (
          <li key={key}>
            <label className="flex min-h-14 cursor-pointer items-center gap-3 py-2">
              <Icon size={20} aria-hidden="true" className="shrink-0 text-muted" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{label}</span>
                {note && <span className="block text-[0.8125rem] text-muted">{note}</span>}
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={layers[key]}
                onChange={(e) => calendarActions.setLayer(key, e.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className="relative h-7 w-12 shrink-0 rounded-full bg-surface-2 ring-1 ring-line transition-colors duration-150 ring-inset peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-surface after:shadow after:transition-transform after:duration-150 peer-checked:after:translate-x-5"
              />
            </label>
          </li>
        );
      })}
    </ul>
  );
}
