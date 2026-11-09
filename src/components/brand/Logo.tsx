// The FixU mark ("Seam"): a U whose right arm is set back in place. Colours follow the theme.
export function LogoMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="144 104 224 284"
      aria-hidden="true"
      className={className}
      style={{ width: (size * 224) / 284, height: size }}
    >
      <path d="M180 140 V276 a76 76 0 0 0 152 0 V246" fill="none" stroke="currentColor" strokeWidth="72" strokeLinecap="round" />
      <path d="M332 140 V186" fill="none" stroke="var(--primary)" strokeWidth="72" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-ink ${className}`} translate="no">
      <LogoMark size={22} />
      <span className="text-[1.375rem] leading-none font-bold tracking-[-0.02em]">FixU</span>
    </span>
  );
}
