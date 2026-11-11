'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpRight, Bookmark, BookmarkCheck, Landmark, Newspaper, Plane, Globe2 } from 'lucide-react';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { t } from '@/lib/i18n/en';
import type { NewsFeed, NewsItem } from '@/modules/news/types';

type Tab = 'briefing' | 'aviation' | 'spain' | 'world' | 'saved';
const tabs: Tab[] = ['briefing', 'aviation', 'spain', 'world', 'saved'];
const KEY = 'fixu-news-saved-v1';

// Saved stories live on this device (a copy of each, so they survive the feed moving on).
function useSaved() {
  const [saved, setSaved] = useState<NewsItem[]>([]);
  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
    } catch {}
  }, []);
  const toggle = (item: NewsItem) =>
    setSaved((prev) => {
      const next = prev.some((s) => s.id === item.id) ? prev.filter((s) => s.id !== item.id) : [item, ...prev];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  return { saved, toggle, isSaved: (id: string) => saved.some((s) => s.id === id) };
}

const when = (iso?: string) =>
  iso ? new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: iso.length > 10 ? '2-digit' : undefined, minute: iso.length > 10 ? '2-digit' : undefined, timeZone: 'Europe/Madrid' }).format(new Date(iso.length > 10 ? iso : `${iso}T12:00:00Z`)) : '';

function Story({ item, saved, onToggle }: { item: NewsItem; saved: boolean; onToggle: () => void }) {
  return (
    <article className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-4">
      {(item.kicker || item.chip) && (
        <p className="text-[0.75rem] font-medium tracking-wide text-muted uppercase">{item.kicker ?? item.chip}</p>
      )}
      <h3 className="text-[1.0625rem] leading-snug font-semibold">
        <a href={item.url} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
          {item.title}
          <ArrowUpRight size={16} aria-hidden="true" className="ml-1 inline align-[-2px] text-muted" />
          <span className="sr-only"> {t.news.opensNew}</span>
        </a>
      </h3>
      <p className="line-clamp-3 text-[0.9375rem] text-muted">{item.summary}</p>
      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="min-w-0 text-[0.8125rem] text-muted">
          <span className="font-medium text-ink">{item.source}</span>
          {item.leaning && <span> · {item.leaning}</span>}
          {item.date && <span> · {item.date}</span>}
        </p>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={saved}
          aria-label={saved ? t.news.unsave : `${t.news.save}: ${item.title}`}
          className="-mr-2 flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-[0.875rem] font-medium text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink aria-pressed:text-primary"
        >
          {saved ? <BookmarkCheck size={18} aria-hidden="true" /> : <Bookmark size={18} aria-hidden="true" />}
          {saved ? t.news.saved : t.news.save}
        </button>
      </div>
    </article>
  );
}

export function NewsView({ feed }: { feed: NewsFeed }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab: Tab = tabs.includes(params.get('s') as Tab) ? (params.get('s') as Tab) : 'briefing';
  const { saved, toggle, isSaved } = useSaved();
  const of = (s: NewsItem['section']) => feed.items.filter((i) => i.section === s);
  const list = (items: NewsItem[]) => (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((i) => (
        <Story key={i.id} item={i} saved={isSaved(i.id)} onToggle={() => toggle(i)} />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t.news.title} />

      <nav aria-label={t.news.sectionsLabel} className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <ul className="flex gap-2">
          {tabs.map((s) => (
            <li key={s}>
              <a
                href={`${pathname}?s=${s}`}
                onClick={(e) => {
                  e.preventDefault();
                  router.replace(`${pathname}?s=${s}`, { scroll: false });
                }}
                aria-current={tab === s ? 'page' : undefined}
                className={`flex min-h-11 items-center rounded-full border px-4 text-[0.9375rem] font-medium whitespace-nowrap transition-colors duration-150 ${
                  tab === s ? 'border-ink bg-ink text-bg' : 'border-line text-muted hover:bg-surface-2 hover:text-ink'
                }`}
              >
                {t.news.sections[s]}
                {s === 'saved' && saved.length > 0 && <span className="tabular ml-1.5">{saved.length}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {feed.sources.radar === 'error' && tab !== 'spain' && tab !== 'world' && tab !== 'saved' && (
        <p role="status" className="rounded-[var(--radius-control)] bg-danger-soft px-4 py-3 text-[0.9375rem]">{t.news.radarError}</p>
      )}

      {tab === 'briefing' && (
        <div className="flex flex-col gap-4">
          {feed.briefings.length ? (
            feed.briefings.map((b) => (
              <Card key={b.label} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-[1.0625rem] font-semibold">{t.news.briefingTitle} · {b.label}</h2>
                  <span className="text-[0.8125rem] text-muted">{t.news.updated(when(b.at))}</span>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {b.lines.map((l) => (
                    <li key={l} className="flex gap-3 text-[0.9375rem]">
                      <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))
          ) : (
            <EmptyState icon={Newspaper} title={t.news.emptyTitle} body={t.news.emptyBody} />
          )}
          {feed.items.some((i) => i.featured) && (
            <section aria-labelledby="feat-h" className="flex flex-col gap-3">
              <h2 id="feat-h" className="text-[1.375rem] font-semibold">{t.news.featured}</h2>
              {list(feed.items.filter((i) => i.featured))}
            </section>
          )}
          {feed.radarEdition && <p className="text-[0.8125rem] text-muted">{t.news.radarFrom(feed.radarEdition.numero, feed.radarEdition.publicada)}</p>}
        </div>
      )}

      {tab === 'aviation' &&
        (['competencia', 'mro', 'operaciones'] as const).map((g) => {
          const items = of('aviation').filter((i) => i.group === g);
          if (!items.length) return null;
          return (
            <section key={g} aria-labelledby={`g-${g}`} className="flex flex-col gap-3">
              <h2 id={`g-${g}`} className="flex items-center gap-2 text-[1.375rem] font-semibold"><Plane size={20} aria-hidden="true" />{t.news.groups[g]}</h2>
              {list(items)}
            </section>
          );
        })}
      {tab === 'aviation' && !of('aviation').length && feed.sources.radar === 'ok' && <EmptyState icon={Plane} title={t.news.emptyTitle} body={t.news.emptyBody} />}

      {(tab === 'spain' || tab === 'world') &&
        (of(tab).length ? (
          list(of(tab))
        ) : (
          <EmptyState icon={tab === 'spain' ? Landmark : Globe2} title={t.news.politicsEmptyTitle} body={t.news.politicsEmptyBody} />
        ))}

      {tab === 'saved' && (saved.length ? list(saved) : <EmptyState icon={Bookmark} title={t.news.savedEmptyTitle} body={t.news.savedEmptyBody} />)}
    </div>
  );
}
