"use client";

import { cn } from "@/lib/cn";

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
};

/**
 * Builds a compact page list with ellipses, e.g. for page 6 of 12:
 *   1 … 5 6 7 … 12
 * Always shows first/last and a window around the current page.
 */
function pageItems(page: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: Array<number | "…"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) items.push("…");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < total - 1) items.push("…");
  items.push(total);
  return items;
}

export default function Pagination({ page, totalPages, onChange, className }: Props) {
  if (totalPages <= 1) return null;

  const go = (p: number) => onChange(Math.min(totalPages, Math.max(1, p)));

  return (
    <nav
      className={cn("flex items-center justify-center gap-1.5", className)}
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page === 1}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border-soft text-ink-soft hover:bg-surface-muted disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        aria-label="Previous page"
      >
        ‹
      </button>

      {pageItems(page, totalPages).map((it, i) =>
        it === "…" ? (
          <span key={`gap-${i}`} className="h-9 w-9 grid place-items-center text-[13px] text-ink-muted">
            …
          </span>
        ) : (
          <button
            key={it}
            type="button"
            onClick={() => go(it)}
            aria-current={it === page ? "page" : undefined}
            className={cn(
              "h-9 min-w-9 px-2 grid place-items-center rounded-full text-[14px] font-semibold transition-colors",
              it === page
                ? "bg-brand-600 text-white"
                : "border border-border-soft text-ink hover:bg-surface-muted",
            )}
          >
            {it}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border-soft text-ink-soft hover:bg-surface-muted disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
}
