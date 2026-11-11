import 'server-only';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { radarBriefing, radarToItems, type RadarEdition } from './radar';
import type { NewsFeed, NewsItem, PoliticsEdition } from './types';

/** Radar.AE's public site (Cloudflare); its editions are static JSON files. */
const RADAR = process.env.RADAR_BASE_URL ?? 'https://radar-ae.sgomezakerlund.workers.dev';
const EDITIONS = 2; // the latest two Radar editions

async function radarEditions(): Promise<RadarEdition[] | null> {
  try {
    const opts = { next: { revalidate: 3600, tags: ['news'] } };
    const index = (await (await fetch(`${RADAR}/data/ediciones/index.json`, opts)).json()) as { file: string; numero: number }[];
    const latest = [...index].sort((a, b) => b.numero - a.numero).slice(0, EDITIONS);
    return await Promise.all(latest.map(async (e) => (await fetch(`${RADAR}/data/ediciones/${e.file}`, opts)).json() as Promise<RadarEdition>));
  } catch {
    return null;
  }
}

async function politicsEdition(): Promise<PoliticsEdition | null> {
  const dir = path.join(process.cwd(), 'data/news');
  try {
    const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
    if (!files.length) return null;
    return JSON.parse(await readFile(path.join(dir, files.at(-1)!), 'utf8')) as PoliticsEdition;
  } catch {
    return null;
  }
}

export async function getNewsFeed(): Promise<NewsFeed> {
  const [radar, politics] = await Promise.all([radarEditions(), politicsEdition()]);
  const items: NewsItem[] = [];
  const briefings: NewsFeed['briefings'] = [];

  if (politics) {
    briefings.push({ label: 'Spain and the world', lines: politics.briefing, at: politics.publishedAt });
    for (const i of politics.items) {
      items.push({ id: `pol-${politics.id}-${i.id}`, section: i.sec, title: i.title, summary: i.summary, source: i.source, leaning: i.leaning, url: i.url, date: i.date });
    }
  }
  if (radar?.length) {
    const [latest] = radar;
    const lines = radarBriefing(latest);
    if (lines.length) briefings.push({ label: `Aviation · Radar.AE Nº ${latest.numero}`, lines, at: latest.publicadaISO });
    const seen = new Set<string>();
    for (const ed of radar) {
      for (const it of radarToItems(ed)) {
        if (seen.has(it.url)) continue;
        seen.add(it.url);
        // Top stories come from the latest edition only.
        items.push({ ...it, featured: ed === latest ? it.featured : false });
      }
    }
  }
  return {
    briefings,
    items,
    sources: { radar: radar ? 'ok' : 'error', politics: politics ? 'ok' : 'none' },
    radarEdition: radar?.[0] ? { numero: radar[0].numero, publicada: radar[0].publicada } : undefined,
    politicsAt: politics?.publishedAt,
  };
}
