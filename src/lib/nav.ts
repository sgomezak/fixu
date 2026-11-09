import { CalendarDays, HeartPulse, LayoutGrid, Newspaper, Wallet, type LucideIcon } from 'lucide-react';
import { t } from '@/lib/i18n/en';

export type NavItem = { href: string; label: string; icon: LucideIcon };

// New life-area modules add one entry here.
export const navItems: NavItem[] = [
  { href: '/', label: t.nav.dashboard, icon: LayoutGrid },
  { href: '/daily', label: t.nav.daily, icon: CalendarDays },
  { href: '/health', label: t.nav.health, icon: HeartPulse },
  { href: '/finance', label: t.nav.finance, icon: Wallet },
  { href: '/news', label: t.nav.news, icon: Newspaper },
];

export const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
