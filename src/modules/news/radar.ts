import type { NewsItem } from './types';

/** Radar.AE edition fields FixU uses (the rest is ignored). */
export type RadarEdition = {
  id: string;
  numero: number;
  publicada: string;
  publicadaISO: string;
  resumen?: string[];
  items?: { id: string; sec: string; kicker?: string; title: string; summary: string; source: string; url: string; date?: string; featured?: boolean; chip?: string }[];
};

// The brief drops Radar.AE's fuel focus: no fuel section, ticker or fuel lines in the briefing.
const FUEL = /queroseno|brent|combustible|\bjet[- ]?fuel\b|diferencial jet|crudo|wti\b/i;

export function radarToItems(ed: RadarEdition): NewsItem[] {
  return (ed.items ?? [])
    .filter((i) => i.sec !== 'combustible' && !FUEL.test(i.title))
    .map((i) => ({
      id: `radar-${ed.id}-${i.id}`,
      section: 'aviation' as const,
      group: i.sec,
      kicker: i.kicker,
      title: i.title,
      summary: i.summary,
      source: i.source,
      url: i.url,
      date: i.date,
      featured: i.featured,
      chip: i.chip,
    }));
}

/** "En 30 segundos" without the fuel sentences. */
export const radarBriefing = (ed: RadarEdition) => (ed.resumen ?? []).filter((line) => !FUEL.test(line));
