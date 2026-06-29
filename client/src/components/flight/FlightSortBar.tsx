"use client";

import type { SortBy } from "@/services/flights";
import { formatDuration, formatINRShort } from "@/lib/format";
import type { FlightOffer } from "@/lib/mock/flights";
import { cn } from "@/lib/cn";

const ITEMS: Array<{ v: SortBy; label: string; sub: (offers: FlightOffer[]) => string }> = [
  {
    v: "price",
    label: "Cheapest",
    sub: (offers) => (offers.length ? formatINRShort(Math.min(...offers.map((o) => o.basePrice))) : "—"),
  },
  {
    v: "duration",
    label: "Fastest",
    sub: (offers) =>
      offers.length
        ? formatDuration(Math.min(...offers.map((o) => o.totalDurationMin)))
        : "—",
  },
  {
    v: "departure",
    label: "Earliest",
    sub: () => "By departure",
  },
  {
    v: "arrival",
    label: "Latest",
    sub: () => "By arrival",
  },
];

export default function FlightSortBar({
  value,
  onChange,
  offers,
  total,
}: {
  value: SortBy;
  onChange: (v: SortBy) => void;
  offers: FlightOffer[];
  total: number;
}) {
  return (
    <div className="rounded-xl bg-white border border-border-soft shadow-[var(--shadow-xs)] p-1 flex flex-wrap lg:flex-nowrap items-stretch gap-1">
      {ITEMS.map((it) => {
        const active = it.v === value;
        return (
          <button
            key={it.v}
            type="button"
            onClick={() => onChange(it.v)}
            className={cn(
              "flex-1 min-w-[100px] lg:min-w-0 flex flex-col items-start px-2 sm:px-4 py-2 rounded-md transition-colors",
              active
                ? "bg-brand-50 text-brand-700"
                : "text-ink-soft hover:bg-surface-muted",
            )}
          >
            <span className="text-[10px] sm:text-[12px] font-semibold uppercase tracking-wide">
              {it.label}
            </span>
            <span className="text-[12px] sm:text-[14px] font-bold text-ink">{it.sub(offers)}</span>
          </button>
        );
      })}
      <div className="hidden lg:flex items-center px-4 text-[12px] font-semibold text-ink-muted border-l border-border-soft ml-1">
        {total} flights
      </div>
    </div>
  );
}
