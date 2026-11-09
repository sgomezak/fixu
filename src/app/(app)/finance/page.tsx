import type { Metadata } from 'next';
import { ReceiptText } from 'lucide-react';
import { EmptyState, PageHeader } from '@/components/ui';
import { t } from '@/lib/i18n/en';

export const metadata: Metadata = { title: t.finance.title };

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.finance.title} />
      <EmptyState icon={ReceiptText} title={t.finance.emptyTitle} body={t.finance.emptyBody} />
    </div>
  );
}
