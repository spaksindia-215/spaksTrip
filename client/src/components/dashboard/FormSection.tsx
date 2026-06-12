import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

// Titled form block with a divider above (except the first, via :first-of-type).
// Keep form content to max-w-3xl at the page level.
export default function FormSection({ title, description, children, className }: Props) {
  return (
    <section
      className={cn(
        "border-t border-border-soft pt-6 first-of-type:border-t-0 first-of-type:pt-0",
        className,
      )}
    >
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
