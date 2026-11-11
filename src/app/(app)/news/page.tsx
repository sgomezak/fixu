import type { Metadata } from 'next';
import { Suspense } from 'react';
import { t } from '@/lib/i18n/en';
import { getNewsFeed } from '@/modules/news/feed.server';
import { NewsView } from './NewsView';

export const metadata: Metadata = { title: t.news.title };
// Politics feeds refresh every 30 min; Radar.AE publishes Mon/Wed/Fri.
export const revalidate = 1800;

export default async function NewsPage() {
  const feed = await getNewsFeed();
  return (
    <Suspense>
      <NewsView feed={feed} />
    </Suspense>
  );
}
