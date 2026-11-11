import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DailyView } from './DailyView';
import { t } from '@/lib/i18n/en';

export const metadata: Metadata = { title: t.daily.title };

function Loading() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <p className="sr-only" role="status">{t.daily.loading}</p>
      <div className="h-10 w-40 animate-pulse rounded-lg bg-surface-2" />
      <div className="h-11 w-full animate-pulse rounded-full bg-surface-2" />
      <div className="h-[28rem] w-full animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
    </div>
  );
}

export default function DailyPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DailyView />
    </Suspense>
  );
}
