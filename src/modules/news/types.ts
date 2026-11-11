export type NewsSection = 'aviation' | 'spain' | 'world';

/** One story, normalised from Radar.AE (aviation) or the FixU news routine (politics). */
export type NewsItem = {
  id: string;
  section: NewsSection;
  group?: string; // aviation sub-section: competencia | mro | operaciones
  kicker?: string;
  title: string;
  summary: string;
  source: string;
  /** Political leaning of the outlet, shown next to the source (politics only). */
  leaning?: string;
  url: string;
  date?: string;
  featured?: boolean;
  chip?: string;
};

export type Briefing = { label: string; lines: string[]; at: string };

export type NewsFeed = {
  briefings: Briefing[];
  items: NewsItem[];
  sources: { radar: 'ok' | 'error'; politics: 'ok' | 'none' };
  radarEdition?: { numero: number; publicada: string };
  politicsAt?: string;
};

/** Format of data/news/<yyyy-mm-dd-hhmm>.json, written by the "FixU · noticias" routine. */
export type PoliticsEdition = {
  id: string;
  publishedAt: string; // ISO with offset
  briefing: string[];
  items: { id: string; sec: 'spain' | 'world'; title: string; summary: string; source: string; leaning: string; url: string; date: string }[];
};
