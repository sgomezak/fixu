'use client';

import { useEffect, useState } from 'react';
import { Segmented } from '@/components/ui';
import { t } from '@/lib/i18n/en';

type Theme = 'system' | 'light' | 'dark';

export function ThemePicker() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fixu-theme');
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch {}
  }, []);

  const apply = (next: Theme) => {
    setTheme(next);
    const root = document.documentElement;
    if (next === 'system') delete root.dataset.theme;
    else root.dataset.theme = next;
    try {
      if (next === 'system') localStorage.removeItem('fixu-theme');
      else localStorage.setItem('fixu-theme', next);
    } catch {}
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-[0.9375rem] text-muted" id="theme-label">{t.settings.theme}</span>
      <Segmented
        label={t.settings.theme}
        value={theme}
        onChange={apply}
        options={(['system', 'light', 'dark'] as const).map((v) => ({ value: v, label: t.settings.themes[v] }))}
      />
    </div>
  );
}
