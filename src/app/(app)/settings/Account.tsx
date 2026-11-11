'use client';

import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Sheet';
import { getBrowserClient } from '@/lib/supabase/client';
import { t } from '@/lib/i18n/en';

export function Account() {
  const supabase = getBrowserClient();
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase?.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [supabase]);
  if (!supabase) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="min-w-0 text-[0.9375rem] break-words text-muted">{email ? t.settings.signedInAs(email) : ' '}</p>
      <button
        type="button"
        onClick={async () => {
          await supabase.auth.signOut();
          try {
            localStorage.removeItem('fixu-calendar-v1');
          } catch {}
          window.location.assign('/login');
        }}
        className={buttonStyles.secondary}
      >
        <LogOut size={18} aria-hidden="true" /> {t.settings.signOut}
      </button>
    </div>
  );
}
