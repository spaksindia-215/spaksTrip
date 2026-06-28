import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  cta?: ReactNode;
  /** Optional emoji shown after the title (e.g. "🍂"). */
  emoji?: string;
  /** Override the default "empty box" illustration. */
  illustration?: ReactNode;
  className?: string;
};

// Friendly "no results" empty state with a sad open-box illustration. Line art in
// currentColor so it adapts to the theme; used across browse grids and dashboards.
function EmptyBox() {
  return (
    <svg
      viewBox="0 0 160 130"
      width={150}
      height={122}
      fill="none"
      aria-hidden
      className="mb-4 text-ink-muted"
    >
      <g
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-50"
      >
        {/* scattered nodes + broken connections above the box */}
        <circle cx={52} cy={20} r={6} />
        <circle cx={96} cy={16} r={4} fill="currentColor" stroke="none" />
        <path d="M114 26 l8 8 M122 26 l-8 8" />
        <path d="M36 40 l7 7 M43 40 l-7 7" />
        <path d="M58 24 L78 34" strokeDasharray="2 5" />
        <path d="M92 22 L80 32" strokeDasharray="2 5" />

        {/* open carton flaps */}
        <path d="M46 60 L34 50 L60 44 L72 54" />
        <path d="M114 60 L126 50 L100 44 L88 54" />

        {/* box rim + body */}
        <path d="M46 60 L80 70 L114 60 L114 64 L80 74 L46 64 Z" />
        <path d="M46 64 L46 100 L80 112 L80 74" />
        <path d="M114 64 L114 100 L80 112" />

        {/* sad face */}
        <circle cx={66} cy={84} r={1.6} fill="currentColor" stroke="none" />
        <circle cx={88} cy={84} r={1.6} fill="currentColor" stroke="none" />
        <path d="M70 96 Q80 90 90 96" />
      </g>
    </svg>
  );
}

export default function EmptyState({ title, subtitle, cta, emoji, illustration, className }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-16 text-center ${className ?? ""}`}>
      {illustration ?? <EmptyBox />}
      <p className="text-[16px] font-bold text-ink">
        {title}
        {emoji ? ` ${emoji}` : ""}
      </p>
      {subtitle && <p className="mt-1.5 max-w-xs text-[13px] text-ink-muted">{subtitle}</p>}
      {cta && <div className="mt-5">{cta}</div>}
    </div>
  );
}
