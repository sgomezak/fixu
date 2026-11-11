import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Fixture } from './types';

/**
 * Real Madrid fixtures, all competitions.
 * 1. ICS feeds in FIXTURES_ICS_URLS (comma-separated), e.g. a FotMob team calendar link; otherwise the
 *    bundled snapshot in data/fixtures/real-madrid.ics (FotMob export, all competitions).
 * 2. football-data.org (team 86), if FOOTBALL_DATA_API_KEY works: La Liga + Champions League with live
 *    kick-off times. When both list a game on the same day, football-data wins.
 * Responses are cached for 6 hours, so kick-off times refresh several times a day.
 */
const TEAM_ID = 86;
const REVALIDATE = 6 * 60 * 60;

type FDMatch = {
  id: number;
  utcDate: string;
  status: string;
  competition: { name: string };
  homeTeam: { shortName?: string; name: string };
  awayTeam: { shortName?: string; name: string };
};

export type FixturesResult = {
  fixtures: Fixture[];
  sources: { footballData: 'ok' | 'not_configured' | 'error'; ics: 'ok' | 'not_configured' | 'error' };
};

async function fromFootballData(): Promise<{ list: Fixture[]; status: FixturesResult['sources']['footballData'] }> {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) return { list: [], status: 'not_configured' };
  try {
    const res = await fetch(`https://api.football-data.org/v4/teams/${TEAM_ID}/matches`, {
      headers: { 'X-Auth-Token': key },
      next: { revalidate: REVALIDATE, tags: ['fixtures'] },
    });
    if (!res.ok) return { list: [], status: 'error' };
    const json = (await res.json()) as { matches: FDMatch[] };
    return {
      status: 'ok',
      list: json.matches.map((m) => ({
        id: `fd-${m.id}`,
        competition: m.competition.name,
        home: m.homeTeam.shortName || m.homeTeam.name,
        away: m.awayTeam.shortName || m.awayTeam.name,
        kickoff: m.utcDate,
        // SCHEDULED = date known, kick-off time not yet confirmed; TIMED = confirmed.
        timeConfirmed: m.status !== 'SCHEDULED',
        source: 'football-data' as const,
      })),
    };
  } catch {
    return { list: [], status: 'error' };
  }
}

/** Minimal ICS parser: VEVENT with DTSTART and SUMMARY. */
export type IcsEvent = { uid: string; start: string; summary: string; description: string; allDay: boolean };

export function parseIcs(text: string): IcsEvent[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  const out: IcsEvent[] = [];
  for (const block of unfolded.split('BEGIN:VEVENT').slice(1)) {
    const event = block.split('BEGIN:VALARM')[0]; // alarms repeat SUMMARY/DESCRIPTION
    const get = (k: string) => event.match(new RegExp(`^${k}(?:;[^:\\n]*)?:(.*)$`, 'm'))?.[1]?.trim();
    const raw = get('DTSTART');
    const summary = get('SUMMARY')?.replace(/\\,/g, ',').replace(/\\;/g, ';');
    if (!raw || !summary) continue;
    const allDay = /^\d{8}$/.test(raw);
    const m = raw.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/);
    if (!m) continue;
    const iso = allDay
      ? `${m[1]}-${m[2]}-${m[3]}T12:00:00Z`
      : `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7] ? 'Z' : ''}`;
    const description = (get('DESCRIPTION') ?? '').replace(/\\,/g, ',');
    out.push({ uid: get('UID') ?? `${raw}-${summary}`, start: iso, summary, description, allDay });
  }
  return out;
}

// Leagues usually confirm kick-off times about 3 weeks ahead; further out, a listed time is a placeholder.
const CONFIRMED_WITHIN_DAYS = 21;

/** Turns calendar events into fixtures. Handles FotMob's "⚽️ Home - Away  (2-1)" summaries. */
export function icsToFixtures(events: IcsEvent[], now = new Date()): Fixture[] {
  return events
    .filter((e) => /real madrid/i.test(e.summary))
    .map((e) => {
      const clean = e.summary.replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s*\(\d+\s*-\s*\d+\)\s*$/, '').trim();
      const [home, away] = clean.split(/\s+(?:-|–|vs\.?|v)\s+/i);
      const competition = e.description.split('\\n').map((x) => x.trim()).filter((x) => x && !/^https?:/.test(x)).pop() || 'Other';
      const days = (new Date(e.start).getTime() - now.getTime()) / 86_400_000;
      return {
        id: `ics-${e.uid}`,
        competition,
        home: home ?? clean,
        away: away ?? '',
        kickoff: e.start,
        timeConfirmed: !e.allDay && days <= CONFIRMED_WITHIN_DAYS,
        source: 'ics' as const,
      };
    });
}

async function fromIcs(): Promise<{ list: Fixture[]; status: FixturesResult['sources']['ics'] }> {
  const urls = (process.env.FIXTURES_ICS_URLS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  try {
    const texts = urls.length
      ? await Promise.all(
          urls.map(async (url) => {
            const res = await fetch(url, { next: { revalidate: REVALIDATE, tags: ['fixtures'] } });
            if (!res.ok) throw new Error(String(res.status));
            return res.text();
          }),
        )
      : [await readFile(path.join(process.cwd(), 'data/fixtures/real-madrid.ics'), 'utf8')];
    return { status: 'ok', list: icsToFixtures(texts.flatMap(parseIcs)) };
  } catch {
    return { list: [], status: 'error' };
  }
}

export async function getFixtures(): Promise<FixturesResult> {
  const [fd, ics] = await Promise.all([fromFootballData(), fromIcs()]);
  const days = new Set(fd.list.map((f) => f.kickoff.slice(0, 10)));
  const extra = ics.list.filter((f) => !days.has(f.kickoff.slice(0, 10)));
  return {
    fixtures: [...fd.list, ...extra].sort((a, b) => a.kickoff.localeCompare(b.kickoff)),
    sources: { footballData: fd.status, ics: ics.status },
  };
}
