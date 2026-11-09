import { BottomTabs, MobileTopBar, Sidebar } from '@/components/shell/NavLinks';
import { QuickAddButton, QuickAddProvider } from '@/components/shell/QuickAdd';
import { t } from '@/lib/i18n/en';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuickAddProvider>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t.app.skipToContent}
      </a>
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileTopBar />
          <main
            id="main"
            tabIndex={-1}
            className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-[calc(4rem+env(safe-area-inset-bottom)+6rem)] focus-visible:outline-none sm:px-6 lg:px-10 lg:pt-10 lg:pb-16"
          >
            {children}
          </main>
        </div>
      </div>
      <QuickAddButton variant="fab" />
      <BottomTabs />
    </QuickAddProvider>
  );
}
