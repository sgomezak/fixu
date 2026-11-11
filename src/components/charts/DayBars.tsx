'use client';

import { useId, useRef, useState } from 'react';

export type DayBar = { key: string; label: string; long: string; value: number | null; display: string };

/**
 * Single-series bar chart: one bar per day, a dashed neutral target line, value labels on bars,
 * a hover/tap tooltip and a screen-reader table. One series, so no legend: the title names it.
 */
export function DayBars({
  title,
  bars,
  target,
  targetLabel,
  noValue,
  tableCaption,
  dayHead,
  valueHead,
}: {
  title: string;
  bars: DayBar[];
  target?: number;
  targetLabel?: string;
  noValue: string;
  tableCaption: string;
  dayHead: string;
  valueHead: string;
}) {
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ i: number; x: number } | null>(null);
  const H = 140;
  const max = Math.max(target ?? 0, ...bars.map((b) => b.value ?? 0)) * 1.12 || 1;
  const y = (v: number) => H - (v / max) * H;

  return (
    <figure className="flex flex-col gap-2" aria-labelledby={`${id}-t`}>
      <figcaption id={`${id}-t`} className="text-[0.9375rem] font-semibold">{title}</figcaption>
      <div ref={wrap} className="relative" onMouseLeave={() => setTip(null)}>
        <div className="relative grid grid-cols-7 gap-1.5" style={{ height: H }} aria-hidden="true">
          {target != null && (
            <div className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-muted" style={{ top: y(target) }}>
              <span className="absolute -top-2.5 right-0 bg-surface pl-1 text-[0.6875rem] text-muted">{targetLabel}</span>
            </div>
          )}
          {bars.map((b, i) => (
            <div
              key={b.key}
              className="relative flex h-full cursor-default items-end justify-center"
              onMouseEnter={(e) => setTip({ i, x: (e.currentTarget.offsetLeft + e.currentTarget.offsetWidth / 2) })}
              onClick={(e) => setTip({ i, x: (e.currentTarget.offsetLeft + e.currentTarget.offsetWidth / 2) })}
            >
              {b.value != null ? (
                <div
                  className={`w-full max-w-9 rounded-t transition-opacity duration-150 ${tip && tip.i !== i ? 'opacity-60' : ''} bg-primary`}
                  style={{ height: Math.max(2, H - y(b.value)) }}
                />
              ) : (
                <div className="w-full max-w-9 border-t-2 border-dotted border-line" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1.5" aria-hidden="true">
          {bars.map((b) => (
            <div key={b.key} className="flex flex-col items-center leading-tight">
              <span className="tabular text-[0.6875rem] font-medium text-ink">{b.value != null ? b.display : '—'}</span>
              <span className="text-[0.6875rem] text-muted">{b.label}</span>
            </div>
          ))}
        </div>
        {tip && (
          <div
            role="presentation"
            className="pointer-events-none absolute top-0 z-20 -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-[0.75rem] whitespace-nowrap text-bg shadow-card"
            style={{ left: Math.min(Math.max(tip.x, 56), (wrap.current?.clientWidth ?? 300) - 56) }}
          >
            <span className="font-semibold">{bars[tip.i].long}</span>
            <span className="tabular block">{bars[tip.i].value != null ? bars[tip.i].display : noValue}</span>
          </div>
        )}
      </div>
      <table className="sr-only">
        <caption>{tableCaption}</caption>
        <thead>
          <tr><th scope="col">{dayHead}</th><th scope="col">{valueHead}</th></tr>
        </thead>
        <tbody>
          {bars.map((b) => (
            <tr key={b.key}><th scope="row">{b.long}</th><td>{b.value != null ? b.display : noValue}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
