"use client";

import { useState } from "react";
import Link from "next/link";
import type { CruiseOffer } from "@/lib/mock/cruises";
import { formatINR } from "@/lib/format";
import Badge from "@/components/ui/Badge";
import EnquiryModal from "@/components/holiday-packages/EnquiryModal";

type Props = { cruise: CruiseOffer };

export default function CruiseResultCard({ cruise }: Props) {
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  return (
    <>
      <article className="flex flex-col sm:flex-row overflow-hidden rounded-xl bg-white border border-border-soft shadow-(--shadow-xs) hover:shadow-(--shadow-sm) transition-shadow">
        <div className="relative h-48 sm:h-auto sm:w-52 shrink-0 overflow-hidden">
          <img
            src={cruise.image}
            alt={cruise.shipName}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <span className="absolute bottom-2 left-2 rounded-full bg-brand-900/80 px-2 py-0.5 text-[11px] font-semibold text-white">
            {cruise.nights} Nights
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-[16px] font-bold text-ink">{cruise.shipName}</h3>
              <p className="text-[12px] text-ink-muted">{cruise.line}</p>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-brand-700 px-1.5 py-0.5 text-[12px] font-bold text-white">
                  {cruise.rating.toFixed(1)}
                </span>
                <span className="text-[11px] text-ink-muted">({cruise.ratingCount.toLocaleString()})</span>
              </div>
            </div>
          </div>

          {/* Itinerary */}
          <div className="flex items-center gap-1.5 flex-wrap text-[12px] text-ink-soft">
            <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-brand-500 shrink-0">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            {cruise.itinerary.join(" → ")}
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap gap-1.5">
            {cruise.highlights.slice(0, 3).map((h) => (
              <Badge key={h} tone="neutral" size="sm">{h}</Badge>
            ))}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3 pt-2 border-t border-border-soft mt-auto">
            <div>
              <p className="text-[11px] text-ink-muted">Departs {cruise.departure} · Per person</p>
              <p className="text-[22px] font-extrabold text-ink leading-tight">
                {formatINR(cruise.pricePerPerson)}
              </p>
              <p className="text-[11px] text-ink-muted">Cabin: {cruise.cabinTypes.join(", ")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/cruise/${cruise.id}`}
                className="rounded-lg border border-brand-500 px-4 py-2.5 text-[14px] font-bold text-brand-600 hover:bg-brand-50 transition-colors"
              >
                View Details
              </Link>
              <button
                type="button"
                onClick={() => setEnquiryOpen(true)}
                className="rounded-lg bg-accent-500 px-5 py-2.5 text-[14px] font-bold text-white hover:bg-accent-600 transition-colors"
              >
                Enquire Now
              </button>
            </div>
          </div>
        </div>
      </article>

      <EnquiryModal
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        packageTitle={`${cruise.shipName} — ${cruise.nights} Nights`}
      />
    </>
  );
}
