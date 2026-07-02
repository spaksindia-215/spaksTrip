"use client";

import Link from "next/link";
import type { CabOffer } from "@/services/cabs";
import { formatINR } from "@/lib/format";
import Badge from "@/components/ui/Badge";

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} viewBox="0 0 24 24" width={11} height={11}
            fill={i < full ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5}
            className={i < full ? "text-warn-500" : "text-border"} aria-hidden>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
      <span className="text-[12px] font-semibold text-ink">{rating}</span>
      <span className="text-[11px] text-ink-muted">({(rating > 4.5 ? "Excellent" : rating > 4 ? "Very Good" : "Good")})</span>
    </div>
  );
}

type Props = {
  cab: CabOffer;
  searchParams: string;
};

export default function CabResultCard({ cab, searchParams }: Props) {
  return (
    <article className="flex flex-col sm:flex-row items-center gap-4 rounded-xl bg-white border border-border-soft p-4 shadow-(--shadow-xs) hover:shadow-(--shadow-sm) transition-shadow">
      {/* Cab avatar */}
      <div
        className="h-20 w-28 shrink-0 rounded-xl flex items-center justify-center text-white font-black text-[22px]"
        style={{ background: `hsl(${cab.imageHue} 60% 45%)` }}
        aria-hidden
      >
        {cab.type[0]}
      </div>

      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-[15px] font-bold text-ink">{cab.name}</h3>
            <p className="text-[12px] text-ink-muted">{cab.type} · {cab.seats} seats · AC</p>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <p className="text-[22px] font-extrabold text-ink leading-tight">{formatINR(cab.basePrice)}</p>
            <p className="text-[11px] text-ink-muted">+ {formatINR(cab.pricePerKm)}/km after included</p>
          </div>
        </div>

        <StarRating rating={cab.rating} />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {cab.features.map((f) => <Badge key={f} tone="neutral" size="sm">{f}</Badge>)}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-ink-muted">ETA {cab.eta} min</span>
            <Link
              href={`/taxi/${encodeURIComponent(cab.id)}/booking?${searchParams}`}
              className="rounded-lg bg-accent-500 px-4 py-2 text-[13px] font-bold text-white hover:bg-accent-600 transition-colors"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
