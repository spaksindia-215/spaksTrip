import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
  className?: string;
};

// Single metric tile. White card, subtle shadow, mono value.
// No coloured backgrounds — restraint by design.
export default function StatCard({ label, value, hint, href, className }: Props) {
  const body = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-2 font-mono text-xxl font-semibold leading-none text-ink">{value}</p>
      {hint ? <p className="mt-2 text-[13px] text-ink-muted">{hint}</p> : null}
    </>
  );

  const base = "block rounded-md border border-border-soft bg-surface p-5 shadow-card";

  if (href) {
    return (
      <Link href={href} className={cn(base, "transition-shadow hover:shadow-card-hover", className)}>
        {body}
      </Link>
    );
  }

  return <div className={cn(base, className)}>{body}</div>;
}
