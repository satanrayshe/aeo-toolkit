/**
 * Brand mark v2 — a printer's registration mark: the crosshair-in-circle used to align
 * plates on press. Chosen for what it means here: print (the audit, printed), precision
 * (a calibrated instrument), and hitting the target (the citation). Simple authored
 * geometry, monochrome via currentColor with the center dot in the drafting-ink accent,
 * so it works on both the dark shell and paper surfaces.
 */

interface BrandMarkProps {
  size?: number;
  className?: string;
  /** Accent for the center dot; defaults to the drafting-ink blue that reads on dark. */
  dotColor?: string;
}

export function BrandMark({
  size = 24,
  className,
  dotColor = '#7C8CF0',
}: BrandMarkProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.4" fill={dotColor} />
    </svg>
  );
}

/** Mark + wordmark lockup. `tone` picks the wordmark color for dark or paper grounds. */
export function BrandLockup({
  size = 24,
  tone = 'dark',
}: {
  size?: number;
  tone?: 'dark' | 'paper';
}): React.ReactElement {
  const color = tone === 'dark' ? '#F4F1E9' : '#16150F';
  return (
    <span className="inline-flex items-center gap-2.5" style={{ color }}>
      <BrandMark size={size} />
      <span
        className="text-[17px] font-bold tracking-tight"
        style={{ fontFamily: 'var(--font-brand), var(--font-sans), system-ui, sans-serif' }}
      >
        AEO&nbsp;Toolkit
      </span>
    </span>
  );
}
