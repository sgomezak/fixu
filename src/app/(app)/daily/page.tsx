import type { Metadata } from 'next';
import { DailyView } from './DailyView';
import { t } from '@/lib/i18n/en';

export const metadata: Metadata = { title: t.daily.title };

export default function DailyPage() {
  return <DailyView />;
}
