import type { Metadata } from 'next';
import { Card, PageHeader, StatusBadge } from '@/components/ui';
import { LogoMark } from '@/components/brand/Logo';

export const metadata: Metadata = { title: 'Design tokens', robots: { index: false } };

const swatches: { name: string; token: string; role: string }[] = [
  { name: 'Background', token: 'bg', role: 'Page ground' },
  { name: 'Surface', token: 'surface', role: 'Cards, bars' },
  { name: 'Surface 2', token: 'surface-2', role: 'Wells, controls' },
  { name: 'Line', token: 'line', role: 'Borders' },
  { name: 'Ink', token: 'ink', role: 'Text' },
  { name: 'Muted', token: 'muted', role: 'Secondary text' },
  { name: 'Primary', token: 'primary', role: 'Actions, on track' },
  { name: 'Amber', token: 'catchup', role: 'Catch-up / behind only' },
  { name: 'Slate', token: 'risk', role: 'At risk' },
  { name: 'Danger', token: 'danger', role: 'Errors only' },
];

const type = [
  { size: '2.5rem', label: 'Display 40' },
  { size: '1.875rem', label: 'Title 30' },
  { size: '1.375rem', label: 'Heading 22' },
  { size: '1.0625rem', label: 'Body large 17' },
  { size: '0.9375rem', label: 'Body 15' },
  { size: '0.8125rem', label: 'Caption 13' },
];

const sample = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(1234.5);

export default function DesignPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="FixU" title="Design tokens" />
      <Card className="flex items-center gap-4">
        <LogoMark size={48} />
        <p className="text-[0.9375rem] text-muted">Instrument Sans, one family. Sand, ink and sage. Amber means catch-up, nothing else.</p>
      </Card>
      <Card className="flex flex-col gap-4">
        <h2 className="text-[1.0625rem] font-semibold">Colour</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {swatches.map((s) => (
            <li key={s.token} className="flex flex-col gap-2">
              <span className="h-14 rounded-xl border border-line" style={{ background: `var(--${s.token})` }} />
              <span className="text-[0.875rem] font-semibold">{s.name}</span>
              <span className="-mt-2 text-[0.8125rem] text-muted">{s.role}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="flex flex-col gap-4">
        <h2 className="text-[1.0625rem] font-semibold">Status</h2>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="onTrack" />
          <StatusBadge status="atRisk" />
          <StatusBadge status="behind" />
          <StatusBadge status="noData" />
        </div>
        <div className="flex items-start gap-3 rounded-[var(--radius-control)] border border-catchup/50 bg-catchup-soft p-4">
          <span className="mt-0.5 size-2.5 shrink-0 rounded-full bg-catchup" aria-hidden="true" />
          <p className="text-[0.9375rem] text-ink">
            <span className="font-semibold text-catchup-ink">Catch-up suggestion. </span>
            Example only: an amber card always carries a reason and one action.
          </p>
        </div>
      </Card>
      <Card className="flex flex-col gap-3">
        <h2 className="text-[1.0625rem] font-semibold">Type</h2>
        {type.map((x) => (
          <p key={x.label} style={{ fontSize: x.size }} className="leading-tight font-semibold">
            {x.label} <span className="tabular font-normal text-muted">{sample}</span>
          </p>
        ))}
      </Card>
    </div>
  );
}
