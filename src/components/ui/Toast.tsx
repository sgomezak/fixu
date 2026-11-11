'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type ToastState = { id: number; message: string; undo?: () => void } | null;

/** One toast at a time, announced politely, with an optional Undo. Stays 6 s (longer than a glance). */
export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((message: string, undo?: () => void) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, undo });
    timer.current = setTimeout(() => setToast(null), 6000);
  }, []);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  return { toast, show, dismiss: () => setToast(null) };
}

export function Toast({ toast, undoLabel, onDismiss }: { toast: ToastState; undoLabel: string; onDismiss: () => void }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom)+5.5rem)] z-40 flex justify-center px-4 lg:bottom-8">
      {toast && (
        <div key={toast.id} className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-5 text-[0.9375rem] text-bg shadow-card">
          <span className="min-w-0 truncate">{toast.message}</span>
          {toast.undo && (
            <button
              type="button"
              onClick={() => {
                toast.undo?.();
                onDismiss();
              }}
              className="min-h-10 shrink-0 rounded-full px-4 font-semibold text-bg underline-offset-4 transition-colors duration-150 hover:bg-bg/15"
            >
              {undoLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
