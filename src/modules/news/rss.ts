import type { NewsItem, NewsSection } from './types';

/**
 * Politics feeds for the Spain and World sections: outlets across the spectrum, each labelled
 * with its leaning. Only headline, outlet and link are shown (no article text is copied).
 */
export type Feed = { url: string; source: string; leaning: string; section: Extract<NewsSection, 'spain' | 'world'> };

export const FEEDS: Feed[] = [
  // Spain
  { section: 'spain', source: 'elDiario.es', leaning: 'left', url: 'https://www.eldiario.es/rss/politica/' },
  { section: 'spain', source: 'El País', leaning: 'centre-left', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/espana/portada' },
  { section: 'spain', source: 'La Vanguardia', leaning: 'centre', url: 'https://www.lavanguardia.com/rss/politica.xml' },
  { section: 'spain', source: 'El Confidencial', leaning: 'centre', url: 'https://rss.elconfidencial.com/espana/' },
  { section: 'spain', source: 'RTVE', leaning: 'public broadcaster', url: 'https://api2.rtve.es/rss/temas_espana.xml' },
  { section: 'spain', source: 'El Mundo', leaning: 'centre-right', url: 'https://e00-elmundo.uecdn.es/elmundo/rss/espana.xml' },
  { section: 'spain', source: 'ABC', leaning: 'right', url: 'https://www.abc.es/rss/2.0/espana/' },
  // World
  { section: 'world', source: 'BBC News', leaning: 'public broadcaster', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { section: 'world', source: 'The Guardian', leaning: 'centre-left', url: 'https://www.theguardian.com/world/rss' },
  { section: 'world', source: 'Le Monde', leaning: 'centre-left', url: 'https://www.lemonde.fr/en/international/rss_full.xml' },
  { section: 'world', source: 'Politico Europe', leaning: 'centre', url: 'https://www.politico.eu/feed/' },
  { section: 'world', source: 'Al Jazeera', leaning: 'Qatar-based', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { section: 'world', source: 'The Wall Street Journal', leaning: 'centre-right', url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml' },
];

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const tag = (block: string, name: string) => block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'))?.[1];

/** Minimal RSS 2.0 / Atom reader: title, link and date of each entry. */
export function parseFeed(xml: string): { title: string; link: string; date: string | null }[] {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];
  return blocks.flatMap((b) => {
    const title = decode(tag(b, 'title') ?? '');
    const link = decode(tag(b, 'link') ?? '') || b.match(/<link[^>]*href="([^"]+)"/i)?.[1] || decode(tag(b, 'guid') ?? '');
    const raw = tag(b, 'pubDate') ?? tag(b, 'updated') ?? tag(b, 'published') ?? tag(b, 'dc:date');
    const time = raw ? Date.parse(decode(raw)) : NaN;
    if (!title || !/^https?:\/\//.test(link)) return [];
    return [{ title, link, date: Number.isNaN(time) ? null : new Date(time).toISOString() }];
  });
}

const dateLabel = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }).format(new Date(iso));

/**
 * Builds a section from several feeds: recent stories only, at most `perSource` from each outlet
 * so no single outlet dominates, newest first.
 */
export function mergeFeeds(
  parsed: { feed: Feed; entries: ReturnType<typeof parseFeed> }[],
  now = new Date(),
  { maxAgeHours = 36, perSource = 3, limit = 16 } = {},
): NewsItem[] {
  const cutoff = now.getTime() - maxAgeHours * 3_600_000;
  const out: (NewsItem & { _t: number })[] = [];
  for (const { feed, entries } of parsed) {
    entries
      .filter((e) => e.date && Date.parse(e.date) >= cutoff)
      .slice(0, perSource)
      .forEach((e) =>
        out.push({
          id: `rss-${feed.source}-${e.link}`,
          section: feed.section,
          title: e.title,
          summary: '',
          source: feed.source,
          leaning: feed.leaning,
          url: e.link,
          date: dateLabel(e.date!),
          _t: Date.parse(e.date!),
        }),
      );
  }
  return out
    .sort((a, b) => b._t - a._t)
    .slice(0, limit)
    .map(({ _t, ...i }) => (void _t, i));
}
