import type { Metadata } from 'next';
import { Suspense } from 'react';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { HeartPulse } from 'lucide-react';
import { EmptyState, PageHeader } from '@/components/ui';
import { t } from '@/lib/i18n/en';
import { parseActivities, parseDaily } from '@/modules/health/garmin';
import { HealthView } from './HealthView';

export const metadata: Metadata = { title: t.health.title };

async function read(name: string) {
  try {
    return await readFile(path.join(process.cwd(), 'data/garmin', name), 'utf8');
  } catch {
    return '';
  }
}

export default async function HealthPage() {
  // The Garmin routine commits these files; every commit redeploys, so reading at build time stays current.
  const [daily, activities] = await Promise.all([read('daily.csv'), read('activities.csv')]);
  const days = parseDaily(daily);
  const acts = parseActivities(activities);
  if (!days.length) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t.health.title} />
        <EmptyState icon={HeartPulse} title={t.health.emptyTitle} body={t.health.emptyBody} />
      </div>
    );
  }
  return (
    <Suspense>
      <HealthView daily={days} activities={acts} />
    </Suspense>
  );
}
