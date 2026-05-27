"use client";

import { useState } from "react";
import { formatINR } from "@/lib/format";
import Badge from "@/components/ui/Badge";
import EnquiryModal from "@/components/holiday-packages/EnquiryModal";
import type { CruiseOffer } from "@/lib/mock/cruises";

const CABIN_DETAILS: Record<string, { desc: string; icon: string }> = {
  Interior:    { desc: "Cosy interior cabin with all standard amenities.", icon: "🛏️" },
  "Ocean View": { desc: "External cabin with a fixed porthole or window overlooking the sea.", icon: "🪟" },
  Balcony:     { desc: "Private balcony with unobstructed ocean views.", icon: "🌊" },
  Suite:       { desc: "Spacious suite with butler service and premium inclusions.", icon: "✨" },
};

type Props = { cruise: CruiseOffer };

export default function CruiseDetailContent({ cruise }: Props) {
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [selectedCabin, setSelectedCabin] = useState(cruise.cabinTypes[0]);

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="rounded-xl border border-border bg-white p-6 shadow-(--shadow-xs)">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-ink">{cruise.shipName}</h1>
              <p className="mt-1 text-sm text-ink-muted">{cruise.line}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded bg-brand-700 px-2 py-0.5 text-[13px] font-bold text-white">
                  {cruise.rating.toFixed(1)}
                </span>
                <span className="text-sm text-ink-muted">({cruise.ratingCount.toLocaleString()} reviews)</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[12px] text-ink-muted">Starting from (per person)</p>
              <p className="text-3xl font-extrabold text-ink">{formatINR(cruise.pricePerPerson)}</p>
              <p className="text-[12px] text-ink-muted mt-0.5">{cruise.nights} Nights · Departs {cruise.departure}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left — main content */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Hero image */}
            <div className="rounded-xl overflow-hidden h-72">
              <img
                src={cruise.image}
                alt={cruise.shipName}
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>

            {/* Itinerary */}
            <div className="rounded-xl border border-border bg-white p-5 shadow-(--shadow-xs)">
              <h2 className="text-[16px] font-bold text-ink mb-4">Itinerary</h2>
              <ol className="flex flex-col gap-3">
                {cruise.itinerary.map((port, i) => (
                  <li key={port} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-600">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">Day {i + 1}</p>
                      <p className="text-sm text-ink-muted">{port}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-[11px] text-ink-muted italic">
                Ports of call may vary by departure date and are subject to weather and other conditions.
              </p>
            </div>

            {/* Highlights */}
            <div className="rounded-xl border border-border bg-white p-5 shadow-(--shadow-xs)">
              <h2 className="text-[16px] font-bold text-ink mb-4">What's Included</h2>
              <div className="flex flex-wrap gap-2">
                {cruise.highlights.map((h) => (
                  <Badge key={h} tone="success" size="sm">{h}</Badge>
                ))}
              </div>
            </div>

            {/* Cabin types */}
            <div className="rounded-xl border border-border bg-white p-5 shadow-(--shadow-xs)">
              <h2 className="text-[16px] font-bold text-ink mb-4">Choose Your Cabin</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cruise.cabinTypes.map((cabin) => {
                  const info = CABIN_DETAILS[cabin] ?? { desc: "Comfortable cabin with standard amenities.", icon: "🛏️" };
                  const active = selectedCabin === cabin;
                  return (
                    <button
                      key={cabin}
                      type="button"
                      onClick={() => setSelectedCabin(cabin)}
                      className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                        active
                          ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                          : "border-border bg-white hover:border-brand-300"
                      }`}
                    >
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <p className={`text-sm font-semibold ${active ? "text-brand-700" : "text-ink"}`}>{cabin}</p>
                        <p className="text-[12px] text-ink-muted mt-0.5">{info.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right — booking sidebar */}
          <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-white p-5 shadow-(--shadow-xs) sticky top-4">
              <h2 className="text-[16px] font-bold text-ink mb-1">Book This Cruise</h2>
              <p className="text-[12px] text-ink-muted mb-4">Get a personalised quote from our cruise experts.</p>

              <div className="flex flex-col gap-2 mb-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Ship</span>
                  <span className="font-semibold text-ink">{cruise.shipName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Duration</span>
                  <span className="font-semibold text-ink">{cruise.nights} Nights</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Departs</span>
                  <span className="font-semibold text-ink">{cruise.departure}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Cabin</span>
                  <span className="font-semibold text-ink">{selectedCabin}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="text-ink-muted">Price (per person)</span>
                  <span className="font-extrabold text-ink text-base">{formatINR(cruise.pricePerPerson)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEnquiryOpen(true)}
                className="w-full rounded-lg bg-accent-500 py-3 text-[15px] font-bold text-white hover:bg-accent-600 transition-colors"
              >
                Enquire Now
              </button>

              <p className="mt-3 text-center text-[11px] text-ink-muted">
                Our cruise expert will call you within 2 hours
              </p>
            </div>

            {/* Departure ports */}
            <div className="rounded-xl border border-border bg-white p-5 shadow-(--shadow-xs)">
              <h3 className="text-sm font-bold text-ink mb-3">Departure Ports</h3>
              {cruise.departurePorts.map((p) => (
                <div key={p} className="flex items-center gap-2 text-sm text-ink-soft">
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-brand-500 shrink-0" aria-hidden>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {p}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      <EnquiryModal
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        packageTitle={`${cruise.shipName} — ${cruise.nights} Nights (${selectedCabin})`}
      />
    </>
  );
}
