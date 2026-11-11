'use client';

import { useId, useState } from 'react';
import { Upload } from 'lucide-react';
import { buttonStyles, fieldStyles } from '@/components/ui/Sheet';
import { t } from '@/lib/i18n/en';
import { calendarActions, useCalendarData } from '../store';
import type { CompanyHoliday } from '../types';
import { parseCompanyHolidays } from '../companyHolidays';
import { formatDay } from './ItemDetails';

/** Paste or upload the NTT DATA holiday list. Preview first; nothing is saved until confirmed. */
export function CompanyHolidaysImport() {
  const data = useCalendarData();
  const ids = { text: useId(), help: useId(), err: useId() };
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<{ ok: CompanyHoliday[]; bad: number[] } | null>(null);
  const [saved, setSaved] = useState('');

  const check = (raw: string) => {
    setSaved('');
    setPreview(raw.trim() ? parseCompanyHolidays(raw) : null);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[0.9375rem] text-muted">
        {data.companyHolidays.length ? t.settings.company.current(data.companyHolidays.length) : t.settings.company.empty}
      </p>
      <label className="flex flex-col gap-1">
        <span className={fieldStyles.label}>{t.settings.company.label}</span>
        <textarea
          id={ids.text}
          name="company-holidays"
          rows={4}
          autoComplete="off"
          spellCheck={false}
          placeholder={t.settings.company.placeholder}
          aria-describedby={ids.help}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            check(e.target.value);
          }}
          className={`${fieldStyles.input} py-2 font-mono text-[0.875rem]`}
        />
        <span id={ids.help} className="text-[0.8125rem] text-muted">{t.settings.company.help}</span>
      </label>
      <label className={`${buttonStyles.secondary} cursor-pointer self-start focus-within:outline-2 focus-within:outline-focus`}>
        <Upload size={18} aria-hidden="true" /> {t.settings.company.upload}
        <input
          type="file"
          accept=".csv,text/csv,text/plain"
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const content = await file.text();
            setText(content);
            check(content);
          }}
        />
      </label>

      {preview && (
        <div className="flex flex-col gap-2 rounded-[var(--radius-control)] bg-surface-2 p-3" aria-live="polite">
          <p className="text-[0.9375rem] font-medium">{t.settings.company.found(preview.ok.length)}</p>
          {preview.bad.length > 0 && <p id={ids.err} className={fieldStyles.error}>{t.settings.company.badLines(preview.bad)}</p>}
          <ul className="max-h-40 overflow-y-auto text-[0.875rem]" tabIndex={0} aria-label={t.settings.company.previewLabel}>
            {preview.ok.map((h) => (
              <li key={h.id} className="flex justify-between gap-3 py-0.5">
                <span className="truncate">{h.name}</span>
                <span className="tabular shrink-0 text-muted">{formatDay(h.date)}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={!preview.ok.length}
            onClick={() => {
              calendarActions.replaceCompanyHolidays(preview.ok);
              setSaved(t.settings.company.saved(preview.ok.length));
              setPreview(null);
              setText('');
            }}
            className={buttonStyles.primary}
          >
            {t.settings.company.save}
          </button>
        </div>
      )}
      <p aria-live="polite" className="text-[0.9375rem] text-ink empty:hidden">{saved}</p>
    </div>
  );
}
