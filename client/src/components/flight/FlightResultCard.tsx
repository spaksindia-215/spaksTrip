"use client";

import { useState } from "react";
import type { FlightOffer } from "@/lib/mock/flights";
import { airlineName } from "@/lib/mock/flights";
import { getAirport } from "@/lib/mock/airports";
import { formatDuration, formatINR, formatTime } from "@/lib/format";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import AirlineLogo from "./AirlineLogo";
import FareFamilyModal from "./FareFamilyModal";
import type { FareCategory } from "@/state/flightSearchStore";

const FARE_CATEGORY_LABEL: Record<FareCategory, string> = {
  regular: "",
  student: "Student Fare",
  armed_forces: "Armed Forces Fare",
  senior_citizen: "Senior Citizen Fare",
};

type Props = {
  offer: FlightOffer;
  searchParams: string;
  fareCategory?: FareCategory;
};

export default function FlightResultCard({ offer, searchParams, fareCategory = "regular" }: Props) {
  const [open, setOpen] = useState(false);
  const [expand, setExpand] = useState(false);
  const firstSeg = offer.segments[0];
  const lastSeg = offer.segments[offer.segments.length - 1];

  const discounted = fareCategory === "armed_forces" || fareCategory === "senior_citizen";
  const displayPrice = discounted ? Math.round(offer.basePrice * 0.95) : offer.basePrice;

  return (
    <article className="w-full rounded-xl bg-white border border-border-soft shadow-(--shadow-xs) hover:shadow-(--shadow-sm) transition-shadow overflow-hidden">
      <div className="grid lg:grid-cols-[1fr_auto] gap-0 lg:gap-4">
        <div className="p-2.5 sm:p-4">
          <div className="flex items-start justify-between gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
              <AirlineLogo code={firstSeg.airlineCode} size={28} />
              <div className="min-w-0">
                <div className="text-[11px] sm:text-[14px] font-semibold text-ink truncate">
                  {airlineName(firstSeg.airlineCode)}
                </div>
                <div className="text-[9px] sm:text-[11px] text-ink-muted truncate">
                  {firstSeg.flightNumber}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
              {fareCategory !== "regular" && (
                <Badge tone="info">{FARE_CATEGORY_LABEL[fareCategory]}</Badge>
              )}
              {offer.refundable && <Badge tone="success">Refundable</Badge>}
              {offer.seatsLeft <= 5 && (
                <Badge tone="danger">{offer.seatsLeft} seats left</Badge>
              )}
            </div>
          </div>

          <div className="mt-2 sm:mt-3 grid grid-cols-3 items-center gap-1.5 sm:gap-3">
            <div className="text-center sm:text-left">
              <div className="text-[14px] sm:text-[22px] font-bold text-ink leading-tight">
                {formatTime(firstSeg.depart)}
              </div>
              <div className="text-[9px] sm:text-[12px] font-semibold text-ink-soft mt-0.5">
                {firstSeg.from}
              </div>
              {firstSeg.fromTerminal && (
                <div className="text-[8px] sm:text-[11px] text-ink-muted">T{firstSeg.fromTerminal}</div>
              )}
            </div>

            <div className="flex flex-col items-center">
              <div className="text-[8px] sm:text-[11px] text-ink-muted whitespace-nowrap">{formatDuration(offer.totalDurationMin)}</div>
              <div className="relative w-full my-1 sm:my-1.5 flex items-center">
                <span className="h-px flex-1 bg-border" />
                <svg viewBox="0 0 24 24" width={12} height={12} className="sm:w-4 sm:h-4 text-brand-500 flex-shrink-0" fill="currentColor" aria-hidden>
                  <path d="M22 16v-2l-8.5-5V3.5a1.5 1.5 0 0 0-3 0V9L2 14v2l8.5-2.5V19L8 20.5v1.5l4-1 4 1V20.5L13.5 19v-5.5L22 16z" />
                </svg>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="text-[9px] sm:text-[11px] font-semibold">
                {offer.stops === 0 ? (
                  <span className="text-success-600">Non-stop</span>
                ) : (
                  <span className="text-warn-600">
                    {offer.stops}S
                  </span>
                )}
              </div>
            </div>

            <div className="text-center sm:text-right">
              <div className="text-[14px] sm:text-[22px] font-bold text-ink leading-tight">
                {formatTime(lastSeg.arrive)}
              </div>
              <div className="text-[9px] sm:text-[12px] font-semibold text-ink-soft mt-0.5">
                {lastSeg.to}
              </div>
              {lastSeg.toTerminal && (
                <div className="text-[8px] sm:text-[11px] text-ink-muted">T{lastSeg.toTerminal}</div>
              )}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-0.5 sm:gap-1.5">
            <Badge tone="neutral" className="text-[8px] sm:text-[11px] px-1.5 sm:px-2 py-0.5">C {offer.baggage.cabin}kg</Badge>
            <Badge tone="neutral" className="text-[8px] sm:text-[11px] px-1.5 sm:px-2 py-0.5">
              K {fareCategory === "student" ? offer.baggage.checkin + 5 : offer.baggage.checkin}kg
            </Badge>
            <Badge tone="info" className="text-[8px] sm:text-[11px] px-1.5 sm:px-2 py-0.5">{offer.cabin.replace("_", " ")}</Badge>
          </div>

          <button
            type="button"
            onClick={() => setExpand((e) => !e)}
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700 hover:text-brand-800"
          >
            {expand ? "Hide" : "View"} flight details
            <svg
              viewBox="0 0 24 24"
              width={14}
              height={14}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className={expand ? "rotate-180 transition-transform" : "transition-transform"}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {expand && (
            <div className="mt-3 border-t border-border-soft pt-3 space-y-3">
              {offer.segments.map((s, i) => (
                <div key={s.id} className="flex gap-3 text-[12px]">
                  <div className="w-16 shrink-0 text-ink-muted">
                    {formatTime(s.depart)}
                    <div className="text-[10px]">{s.durationMin}m</div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-ink">
                      {s.from} → {s.to} · {s.flightNumber}
                    </div>
                    <div className="text-ink-muted">
                      {getAirport(s.from)?.city} ({s.fromTerminal ?? "—"}) · {formatTime(s.depart)}
                      {"  →  "}
                      {getAirport(s.to)?.city} ({s.toTerminal ?? "—"}) · {formatTime(s.arrive)}
                    </div>
                    <div className="text-ink-muted">
                      {airlineName(s.airlineCode)} · {s.aircraft}
                    </div>
                  </div>
                  {i < offer.segments.length - 1 && (
                    <div className="text-[11px] text-warn-600 self-end font-semibold">
                      Layover in {s.to}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:border-l border-t lg:border-t-0 border-border-soft p-2.5 sm:p-4 flex flex-col items-stretch lg:items-end justify-between gap-1.5 sm:gap-3 bg-surface-muted lg:bg-transparent">
          <div className="text-center lg:text-right">
            <div className="text-[8px] sm:text-[11px] text-ink-muted">from</div>
            {discounted && (
              <div className="text-[9px] sm:text-[12px] text-ink-muted line-through leading-none">
                {formatINR(offer.basePrice)}
              </div>
            )}
            <div className="text-lg sm:text-2xl font-extrabold text-ink leading-none">
              {formatINR(displayPrice)}
            </div>
            {discounted && (
              <div className="text-[8px] sm:text-[11px] font-semibold text-success-600">5% off</div>
            )}
            <div className="text-[8px] sm:text-[11px] text-ink-muted">per adult</div>
          </div>
          <div className="flex flex-col gap-1 sm:gap-2 lg:min-w-45">
            <Button variant="accent" onClick={() => setOpen(true)} className="py-1.5 sm:py-3 text-[12px] sm:text-[15px]">
              Book now
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="text-[11px] sm:text-[13px]">
              View fares
            </Button>
          </div>
        </div>
      </div>

      <FareFamilyModal
        open={open}
        onClose={() => setOpen(false)}
        offer={offer}
        searchParams={searchParams}
      />
    </article>
  );
}
