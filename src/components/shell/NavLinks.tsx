'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import { navItems, isActive } from '@/lib/nav';
import { t } from '@/lib/i18n/en';
import { Logo } from '@/components/brand/Logo';
import { QuickAddButton } from './QuickAdd';

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-line bg-surface px-4 py-6 lg:flex">
      <Link href="/" className="self-start rounded-lg px-2 py-1" aria-label={`${t.app.name}, ${t.nav.dashboard}`}>
        <Logo />
      </Link>
      <QuickAddButton variant="wide" />
      <nav aria-label={t.nav.label}>
        <ul className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 text-[0.9375rem] font-medium transition-colors duration-150 ${
                    active ? 'bg-primary-soft text-ink' : 'text-muted hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" className={active ? 'text-primary' : ''} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <Link
        href="/settings"
        aria-current={isActive(pathname, '/settings') ? 'page' : undefined}
        className="mt-auto flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 text-[0.9375rem] font-medium text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink aria-[current=page]:bg-primary-soft aria-[current=page]:text-ink"
      >
        <Settings size={20} strokeWidth={1.75} aria-hidden="true" />
        {t.nav.settings}
      </Link>
    </aside>
  );
}

export function BottomTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label={t.nav.label}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5 px-[max(0.5rem,env(safe-area-inset-left))]">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[0.75rem] font-medium transition-colors duration-150 ${
                  active ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-150 ${
                    active ? 'bg-primary-soft text-primary' : ''
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line/60 bg-bg/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden">
      <Link href="/" className="flex h-14 items-center rounded-lg" aria-label={`${t.app.name}, ${t.nav.dashboard}`}>
        <Logo />
      </Link>
      <Link
        href="/settings"
        aria-label={t.nav.settings}
        className="-mr-2 flex size-11 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
      >
        <Settings size={22} strokeWidth={1.75} aria-hidden="true" />
      </Link>
    </header>
  );
}
