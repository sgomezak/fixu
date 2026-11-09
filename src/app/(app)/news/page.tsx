import type { Metadata } from 'next';
import { Newspaper } from 'lucide-react';
import { EmptyState, PageHeader } from '@/components/ui';
import { t } from '@/lib/i18n/en';

export const metadata: Metadata = { title: t.news.title };

const sections = Object.values(t.news.sections);

export default function NewsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.news.title} />
      <div>
        <ul aria-label={t.news.sectionsLabel} className="flex flex-wrap gap-2">
          {sections.map((s, i) => (
            <li key={s}>
              <span
                                className={`flex min-h-10 items-center rounded-full border px-4 text-[0.9375rem] font-medium whitespace-nowrap ${
                  i === 0 ? 'border-ink bg-ink text-bg' : 'border-line text-muted'
                }`}
              >
                {s}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <EmptyState icon={Newspaper} title={t.news.emptyTitle} body={t.news.emptyBody} />
    </div>
  );
}
