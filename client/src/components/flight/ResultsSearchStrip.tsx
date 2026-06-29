"use client";

import Link from "next/link";
import { getAirport } from "@/lib/mock/airports";
import { formatDayMonth } from "@/lib/format";

type Props = {
  from: string;
  to: string;
  depart: string;
  returnDate?: string;
  trip: string;
  adults: number;
  children: number;
  infants: number;
  cabin: string;
};

export default function ResultsSearchStrip(p: Props) {
  const fromA = getAirport(p.from);
  const toA = getAirport(p.to);
  const total = p.adults + p.children + p.infants;

  return (
    <div className="bg-brand-900 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3">
            <div>
              <div className="text-[9px] sm:text-[11px] uppercase tracking-wide text-white/60">From</div>
              <div className="text-[13px] sm:text-[15px] font-bold">
                {fromA?.city} <span className="text-white/70 text-[11px] sm:text-[13px]">({p.from})</span>
              </div>
            </div>
            <svg viewBox="0 0 24 24" width={14} height={14} className="sm:w-[18px] sm:h-[18px] fill-current text-accent-400" aria-hidden>
              <path d="M22 16v-2l-8.5-5V3.5a1.5 1.5 0 0 0-3 0V9L2 14v2l8.5-2.5V19L8 20.5v1.5l4-1 4 1V20.5L13.5 19v-5.5L22 16z" />
            </svg>
            <div>
              <div className="text-[9px] sm:text-[11px] uppercase tracking-wide text-white/60">To</div>
              <div className="text-[13px] sm:text-[15px] font-bold">
                {toA?.city} <span className="text-white/70 text-[11px] sm:text-[13px]">({p.to})</span>
              </div>
            </div>
          </div>
          <div className="h-6 sm:h-8 w-px bg-white/20 hidden sm:block" />
          <div>
            <div className="text-[9px] sm:text-[11px] uppercase tracking-wide text-white/60">Depart</div>
            <div className="text-[12px] sm:text-[14px] font-bold">{formatDayMonth(p.depart)}</div>
          </div>
          {p.returnDate && (
            <div className="hidden md:block">
              <div className="text-[9px] sm:text-[11px] uppercase tracking-wide text-white/60">Return</div>
              <div className="text-[12px] sm:text-[14px] font-bold">{formatDayMonth(p.returnDate)}</div>
            </div>
          )}
          <div className="hidden lg:block">
            <div className="text-[9px] sm:text-[11px] uppercase tracking-wide text-white/60">Travellers</div>
            <div className="text-[12px] sm:text-[14px] font-bold">{total} · {p.cabin.replace("_", " ").toLowerCase()}</div>
          </div>
        </div>
        <Link
          href="/flight"
          className="inline-flex items-center gap-1.5 rounded-md bg-white/10 hover:bg-white/15 border border-white/20 px-3 sm:px-4 h-9 sm:h-10 text-[11px] sm:text-[13px] font-semibold transition-colors"
        >
          <svg viewBox="0 0 24 24" width={12} height={12} className="sm:w-[14px] sm:h-[14px]" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Modify
        </Link>
      </div>
    </div>
  );
}
