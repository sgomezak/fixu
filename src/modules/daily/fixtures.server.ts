import 'server-only';
import type { Fixture } from './types';

/**
 * Real Madrid fixtures.
 * Primary: football-data.org (team 86). Its free tier covers La Liga and the Champions League only.
 * Fallback: any ICS feeds in FIXTURES_ICS_URLS (comma-separated) for the rest (Copa del Rey, Supercopa,
 * Club World Cup…). ICS games on a day already covered by football-data are skipped.
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
export function parseIcs(text: string): { uid: string; start: string; summary: string; allDay: boolean }[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  const out: { uid: string; start: string; summary: string; allDay: boolean }[] = [];
  for (const block of unfolded.split('BEGIN:VEVENT').slice(1)) {
    const get = (k: string) => block.match(new RegExp(`^${k}(?:;[^:\\n]*)?:(.*)$`, 'm'))?.[1]?.trim();
    const raw = get('DTSTART');
    const summary = get('SUMMARY')?.replace(/\\,/g, ',').replace(/\\;/g, ';');
    if (!raw || !summary) continue;
    const allDay = /^\d{8}$/.test(raw);
    const m = raw.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/);
    if (!m) continue;
    const iso = allDay
      ? `${m[1]}-${m[2]}-${m[3]}T12:00:00Z`
      : `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7] ? 'Z' : ''}`;
    out.push({ uid: get('UID') ?? `${raw}-${summary}`, start: iso, summary, allDay });
  }
  return out;
}

async function fromIcs(): Promise<{ list: Fixture[]; status: FixturesResult['sources']['ics'] }> {
  const urls = (process.env.FIXTURES_ICS_URLS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!urls.length) return { list: [], status: 'not_configured' };
  try {
    const lists = await Promise.all(
      urls.map(async (url) => {
        const res = await fetch(url, { next: { revalidate: REVALIDATE, tags: ['fixtures'] } });
        if (!res.ok) throw new Error(String(res.status));
        return parseIcs(await res.text());
      }),
    );
    return {
      status: 'ok',
      list: lists.flat().filter((e) => /real madrid/i.test(e.summary)).map((e) => {
        const [home, away] = e.summary.split(/\s+(?:-|–|vs\.?|v)\s+/i);
        return {
          id: `ics-${e.uid}`,
          competition: 'Other',
          home: home ?? e.summary,
          away: away ?? '',
          kickoff: e.start,
          timeConfirmed: !e.allDay,
          source: 'ics' as const,
        };
      }),
    };
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
