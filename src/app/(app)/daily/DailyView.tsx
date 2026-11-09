'use client';

import { useState } from 'react';
import { CalendarPlus, Sofa } from 'lucide-react';
import { Card, EmptyState, PageHeader, Segmented } from '@/components/ui';
import { t } from '@/lib/i18n/en';

type View = 'day' | 'week' | 'month' | 'year';
const views: View[] = ['day', 'week', 'month', 'year'];

export function DailyView() {
  const [view, setView] = useState<View>('day');
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.daily.title}>
        <Segmented label={t.daily.viewsLabel} value={view} onChange={setView} options={views.map((v) => ({ value: v, label: t.daily.views[v] }))} />
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <EmptyState icon={CalendarPlus} title={t.daily.emptyTitle} body={t.daily.emptyBody} />
        <Card className="flex flex-col gap-3">
          <h2 className="text-[1.0625rem] font-semibold">{t.daily.goalsTitle}</h2>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Sofa size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold">{t.daily.relax}</p>
              <p className="text-[0.875rem] text-muted">{t.daily.relaxBody}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
