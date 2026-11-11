import { describe, expect, it } from 'vitest';
import { FEEDS, mergeFeeds, parseFeed } from './rss';

const rss = `<?xml version="1.0"?><rss><channel><title>X</title>
<item><title><![CDATA[El Gobierno aprueba el techo de gasto]]></title><link>https://example.es/a</link><pubDate>Wed, 11 Nov 2026 18:00:00 +0100</pubDate><description>Texto del artículo</description></item>
<item><title>Feijóo &amp; Sánchez: debate</title><link>https://example.es/b</link><pubDate>Wed, 11 Nov 2026 09:00:00 +0100</pubDate></item>
<item><title>Old story</title><link>https://example.es/c</link><pubDate>Fri, 06 Nov 2026 09:00:00 +0100</pubDate></item>
</channel></rss>`;
const atom = `<feed><entry><title>EU summit ends</title><link rel="alternate" href="https://example.com/eu"/><updated>2026-11-11T19:30:00Z</updated></entry></feed>`;

describe('RSS feeds', () => {
  it('reads RSS and Atom entries without article text', () => {
    expect(parseFeed(rss)[0]).toEqual({ title: 'El Gobierno aprueba el techo de gasto', link: 'https://example.es/a', date: '2026-11-11T17:00:00.000Z' });
    expect(parseFeed(rss)[1].title).toBe('Feijóo & Sánchez: debate');
    expect(parseFeed(atom)).toEqual([{ title: 'EU summit ends', link: 'https://example.com/eu', date: '2026-11-11T19:30:00.000Z' }]);
  });

  it('keeps recent stories, newest first, capped per outlet, with outlet and leaning', () => {
    const now = new Date('2026-11-11T21:00:00Z');
    const left = FEEDS.find((f) => f.leaning === 'left')!;
    const right = FEEDS.find((f) => f.leaning === 'right')!;
    const items = mergeFeeds([{ feed: left, entries: parseFeed(rss) }, { feed: right, entries: parseFeed(atom) }], now, { perSource: 1 });
    expect(items.map((i) => [i.title, i.source, i.leaning])).toEqual([
      ['EU summit ends', right.source, 'right'],
      ['El Gobierno aprueba el techo de gasto', left.source, 'left'],
    ]);
    expect(items.every((i) => i.summary === '')).toBe(true);
  });

  it('covers both sides of the spectrum in each section', () => {
    for (const sec of ['spain', 'world'] as const) {
      const l = FEEDS.filter((f) => f.section === sec).map((f) => f.leaning);
      expect(l.some((x) => x.includes('left'))).toBe(true);
      expect(l.some((x) => x.includes('right'))).toBe(true);
    }
  });
});
