import { Briefcase, CalendarCheck2, FileText, HeartPulse, Rocket, Users, Wallet, type LucideIcon } from 'lucide-react';
import { Card, EmptyState, PageHeader, StatusBadge } from '@/components/ui';
import { t } from '@/lib/i18n/en';

const areas: { key: keyof typeof t.areas; icon: LucideIcon }[] = [
  { key: 'finance', icon: Wallet },
  { key: 'health', icon: HeartPulse },
  { key: 'work', icon: Briefcase },
  { key: 'sideHustle', icon: Rocket },
  { key: 'social', icon: Users },
  { key: 'routine', icon: CalendarCheck2 },
];

// Re-render hourly so the month label stays current.
export const revalidate = 3600;

export default function DashboardPage() {
  const month = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' }).format(new Date());
  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow={`${t.dashboard.eyebrow} · ${month}`} title={t.dashboard.title} />

      <section aria-labelledby="areas-heading" className="flex flex-col gap-3">
        <h2 id="areas-heading" className="sr-only">{t.dashboard.areasLabel}</h2>
        <p className="text-[0.9375rem] text-muted">{t.dashboard.areasIntro}</p>
        <ul className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          {areas.map(({ key, icon: Icon }) => (
            <Card as="li" key={key} className="flex flex-col gap-3 p-4">
              <span className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-ink">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="font-semibold">{t.areas[key]}</span>
              <div aria-hidden="true" className="h-1.5 rounded-full bg-surface-2" />
              <div><StatusBadge status="noData" /></div>
            </Card>
          ))}
        </ul>
      </section>

      <section aria-labelledby="report-heading" className="flex flex-col gap-3">
        <h2 id="report-heading" className="text-[1.375rem] font-semibold">{t.dashboard.reportTitle}</h2>
        <EmptyState icon={FileText} title={t.dashboard.reportEmptyTitle} body={t.dashboard.reportEmpty} />
      </section>
    </div>
  );
}
