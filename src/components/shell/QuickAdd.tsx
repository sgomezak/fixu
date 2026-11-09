'use client';

import { createContext, useCallback, useContext, useId, useRef, useState } from 'react';
import { Mic, Plus, X } from 'lucide-react';
import { t } from '@/lib/i18n/en';

const QuickAddContext = createContext<() => void>(() => {});

export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [notice, setNotice] = useState('');
  const [text, setText] = useState('');
  const titleId = useId();
  const hintId = useId();

  const open = useCallback(() => {
    setNotice('');
    dialogRef.current?.showModal();
    // Focus the field on larger screens only; on phones the keyboard would cover the sheet.
    if (window.matchMedia('(pointer: fine)').matches) inputRef.current?.focus();
  }, []);

  const close = () => dialogRef.current?.close();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      inputRef.current?.focus();
      return;
    }
    // The natural-language parser connects in Phase 2. Nothing is written here.
    setNotice(t.quickAdd.notConnected);
  };

  return (
    <QuickAddContext.Provider value={open}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={hintId}
        onClick={(e) => e.target === dialogRef.current && close()}
        className="m-0 mt-auto w-full max-w-none overscroll-contain rounded-t-[1.5rem] bg-surface p-0 text-ink shadow-card backdrop:backdrop-blur-[2px] sm:m-auto sm:max-w-lg sm:rounded-[1.5rem]"
      >
        <form onSubmit={submit} className="flex flex-col gap-4 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
          <div aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-line sm:hidden" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-[1.375rem] font-semibold">
                {t.quickAdd.title}
              </h2>
              <p id={hintId} className="mt-1 text-[0.9375rem] text-muted">
                {t.quickAdd.hint}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label={t.quickAdd.close}
              className="-mt-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
            >
              <X size={22} aria-hidden="true" />
            </button>
          </div>

          <label className="sr-only" htmlFor="quick-add-text">
            {t.quickAdd.label}
          </label>
          <div className="flex items-end gap-2 rounded-[var(--radius-control)] border border-line bg-bg p-2 focus-within:border-primary">
            <textarea
              id="quick-add-text"
              ref={inputRef}
              name="quick-add"
              rows={2}
              autoComplete="off"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.quickAdd.placeholder}
              className="min-h-12 flex-1 resize-none bg-transparent px-2 py-1.5 text-[1.0625rem] text-ink placeholder:text-muted focus-visible:outline-none"
            />
            <button
              type="button"
              aria-label={t.quickAdd.voice}
              onClick={() => setNotice(t.quickAdd.notConnected)}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink transition-[background-color,transform] duration-150 hover:bg-primary-soft active:scale-95"
            >
              <Mic size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.8125rem] text-muted">{t.quickAdd.examplesLabel}</span>
            {t.quickAdd.examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setText(ex);
                  inputRef.current?.focus();
                }}
                className="min-h-9 rounded-full border border-line px-3 text-[0.8125rem] text-ink transition-colors duration-150 hover:bg-surface-2"
              >
                {ex}
              </button>
            ))}
          </div>

          <p aria-live="polite" className="min-h-0 text-[0.9375rem] text-muted empty:hidden">
            {notice}
          </p>

          <button
            type="submit"
            className="flex min-h-12 items-center justify-center rounded-[var(--radius-control)] bg-primary px-5 text-[1rem] font-semibold text-on-primary transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
          >
            {t.quickAdd.submit}
          </button>
        </form>
      </dialog>
    </QuickAddContext.Provider>
  );
}

export function QuickAddButton({ variant }: { variant: 'fab' | 'wide' }) {
  const open = useContext(QuickAddContext);
  if (variant === 'wide') {
    return (
      <button
        type="button"
        onClick={open}
        className="flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-primary px-4 font-semibold text-on-primary transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
      >
        <Plus size={20} aria-hidden="true" />
        {t.quickAdd.open}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={open}
      aria-label={t.quickAdd.open}
      className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] z-30 flex size-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-card transition-[filter,transform] duration-150 hover:brightness-110 active:scale-95 lg:hidden"
    >
      <Plus size={26} strokeWidth={2.25} aria-hidden="true" />
    </button>
  );
}
