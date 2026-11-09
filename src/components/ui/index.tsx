import { CircleDashed, CircleDot, TriangleAlert, CircleCheck, type LucideIcon } from 'lucide-react';
import { t } from '@/lib/i18n/en';

export function PageHeader({ title, eyebrow, children }: { title: string; eyebrow?: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-[0.8125rem] font-medium tracking-wide text-muted uppercase">{eyebrow}</p>}
        <h1 className="text-[1.875rem] leading-tight font-semibold lg:text-[2.5rem]">{title}</h1>
      </div>
      {children}
    </header>
  );
}

export function Card({ children, className = '', as: Tag = 'section' }: { children: React.ReactNode; className?: string; as?: 'section' | 'div' | 'li' | 'article' }) {
  return <Tag className={`rounded-[var(--radius-card)] border border-line bg-surface p-5 ${className}`}>{children}</Tag>;
}

export function EmptyState({ icon: Icon, title, body, children }: { icon: LucideIcon; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[var(--radius-card)] border border-dashed border-line bg-surface/60 p-6">
      <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon size={22} aria-hidden="true" />
      </span>
      <h2 className="text-[1.0625rem] font-semibold">{title}</h2>
      <p className="max-w-prose text-[0.9375rem] text-muted">{body}</p>
      {children}
    </div>
  );
}

export type Status = 'onTrack' | 'atRisk' | 'behind' | 'noData';

const statusStyle: Record<Status, { icon: LucideIcon; className: string }> = {
  onTrack: { icon: CircleCheck, className: 'bg-primary-soft text-ink [&_svg]:text-primary' },
  atRisk: { icon: CircleDot, className: 'bg-risk-soft text-ink [&_svg]:text-risk' },
  behind: { icon: TriangleAlert, className: 'bg-catchup-soft text-catchup-ink' },
  noData: { icon: CircleDashed, className: 'bg-surface-2 text-muted' },
};

// Status is never colour alone: icon + label every time.
export function StatusBadge({ status }: { status: Status }) {
  const { icon: Icon, className } = statusStyle[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8125rem] font-medium ${className}`}>
      <Icon size={14} strokeWidth={2.25} aria-hidden="true" />
      {t.status[status]}
    </span>
  );
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-line bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          tabIndex={value === o.value ? 0 : -1}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            e.preventDefault();
            const i = options.findIndex((x) => x.value === value);
            const next = options[(i + (e.key === 'ArrowRight' ? 1 : options.length - 1)) % options.length];
            onChange(next.value);
            (e.currentTarget.parentElement?.querySelector(`[data-v="${next.value}"]`) as HTMLElement | null)?.focus();
          }}
          data-v={o.value}
          className={`min-h-10 rounded-full px-4 text-[0.9375rem] font-medium transition-colors duration-150 ${
            value === o.value ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
