import type { Metadata } from 'next';
import { HeartPulse } from 'lucide-react';
import { EmptyState, PageHeader } from '@/components/ui';
import { t } from '@/lib/i18n/en';

export const metadata: Metadata = { title: t.health.title };

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.health.title} />
      <EmptyState icon={HeartPulse} title={t.health.emptyTitle} body={t.health.emptyBody} />
    </div>
  );
}
