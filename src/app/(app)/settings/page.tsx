import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card, PageHeader } from '@/components/ui';
import { ThemePicker } from './ThemePicker';
import { CompanyHolidaysImport } from '@/modules/daily/components/CompanyHolidaysImport';
import { profileDefaults } from '@/lib/profile';
import { t } from '@/lib/i18n/en';

export const metadata: Metadata = { title: t.settings.title };

export default function SettingsPage() {
  const n = profileDefaults.notifications;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.settings.title} />
      <Card className="flex flex-col gap-4">
        <h2 className="text-[1.0625rem] font-semibold">{t.settings.appearance}</h2>
        <ThemePicker />
      </Card>
      <Card className="flex flex-col gap-3">
        <h2 className="text-[1.0625rem] font-semibold">{t.settings.notifications}</h2>
        <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-[0.9375rem]">
          <dt className="text-muted">{t.settings.nightly}</dt>
          <dd className="tabular font-medium">{n.nightlyCheckin}</dd>
          <dt className="text-muted">{t.settings.weekly}</dt>
          <dd className="tabular font-medium">{n.sundayReport}</dd>
        </dl>
        <p className="text-[0.875rem] text-muted">{t.settings.notificationsSoon}</p>
      </Card>
      <Card className="flex flex-col gap-3">
        <h2 className="text-[1.0625rem] font-semibold">{t.settings.company.title}</h2>
        <CompanyHolidaysImport />
      </Card>
      <Link
        href="/design"
        className="flex min-h-14 items-center justify-between rounded-[var(--radius-card)] border border-line bg-surface px-5 font-medium transition-colors duration-150 hover:bg-surface-2"
      >
        {t.settings.designLink}
        <ChevronRight size={20} aria-hidden="true" className="text-muted" />
      </Link>
    </div>
  );
}
