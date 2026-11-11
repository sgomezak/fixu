'use client';

import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from 'react';
import { X } from 'lucide-react';

export type SheetHandle = { open: () => void; close: () => void };

/** Bottom sheet on phones, centred dialog on larger screens. Native <dialog>: focus trap + Esc. */
export const Sheet = forwardRef<SheetHandle, { title: string; description?: string; closeLabel: string; children: React.ReactNode; onClose?: () => void }>(
  function Sheet({ title, description, closeLabel, children, onClose }, ref) {
    const dialog = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const descId = useId();
    useImperativeHandle(ref, () => ({ open: () => dialog.current?.showModal(), close: () => dialog.current?.close() }), []);
    useEffect(() => {
      const d = dialog.current;
      if (!d || !onClose) return;
      d.addEventListener('close', onClose);
      return () => d.removeEventListener('close', onClose);
    }, [onClose]);
    return (
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-0 mt-auto max-h-[90dvh] w-full max-w-none overscroll-contain rounded-t-[1.5rem] bg-surface p-0 text-ink shadow-card sm:m-auto sm:max-w-lg sm:rounded-[1.5rem]"
      >
        <div className="flex flex-col gap-4 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
          <div aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-line sm:hidden" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-[1.375rem] leading-tight font-semibold break-words">{title}</h2>
              {description && <p id={descId} className="mt-1 text-[0.9375rem] text-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label={closeLabel}
              className="-mt-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
            >
              <X size={22} aria-hidden="true" />
            </button>
          </div>
          {children}
        </div>
      </dialog>
    );
  },
);

export const buttonStyles = {
  primary:
    'flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-primary px-5 font-semibold text-on-primary transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50',
  secondary:
    'flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-line bg-surface px-5 font-semibold text-ink transition-[background-color,transform] duration-150 hover:bg-surface-2 active:scale-[0.98]',
  quiet:
    'flex min-h-11 items-center justify-center gap-2 rounded-full px-4 font-medium text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink',
  danger:
    'flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] px-5 font-semibold text-danger transition-colors duration-150 hover:bg-danger-soft',
  icon: 'flex size-11 items-center justify-center rounded-full text-ink transition-colors duration-150 hover:bg-surface-2',
};

export const fieldStyles = {
  label: 'text-[0.875rem] font-medium text-ink',
  input:
    'min-h-12 w-full rounded-[var(--radius-control)] border border-line bg-bg px-3 text-[1rem] text-ink placeholder:text-muted focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 aria-[invalid=true]:border-danger',
  error: 'text-[0.875rem] text-danger',
};
