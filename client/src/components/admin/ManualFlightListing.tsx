"use client";

import { useState } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";

const STOPS = ["Non-Stop", "1 Stop", "2+ Stops"];
const AIRLINES = ["IndiGo", "Air India", "SpiceJet", "GoAir", "Air Vistara"];

export default function ManualFlightListing() {
  const [stops, setStops] = useState<Record<string, boolean>>({});
  const [airlines, setAirlines] = useState<Record<string, boolean>>({});

  const toggle = (
    map: Record<string, boolean>,
    set: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
    key: string
  ) => set((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#0E1E3A]">
      <Header />
      <main className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-ink">Manual Flight Listing</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Sidebar filters */}
          <aside className="w-full md:w-56 shrink-0">
            <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
              <h2 className="text-[13px] font-bold text-ink mb-3">Stops</h2>
              <div className="flex flex-col gap-2 mb-5">
                {STOPS.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
                    <input type="checkbox" checked={!!stops[s]} onChange={() => toggle(stops, setStops, s)} className="accent-brand-600" />
                    {s}
                  </label>
                ))}
              </div>
              <h2 className="text-[13px] font-bold text-ink mb-3">Airlines</h2>
              <div className="flex flex-col gap-2">
                {AIRLINES.map((a) => (
                  <label key={a} className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
                    <input type="checkbox" checked={!!airlines[a]} onChange={() => toggle(airlines, setAirlines, a)} className="accent-brand-600" />
                    {a}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0 flex flex-col items-center justify-center rounded-xl border border-border bg-white py-16 shadow-sm">
            <svg viewBox="0 0 24 24" width={40} height={40} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted mb-3" aria-hidden>
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
            <p className="text-sm font-medium text-ink-soft">No flight listings found.</p>
            <p className="text-[12px] text-ink-muted mt-1">Adjust filters or add flights manually.</p>
          </div>
        </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
