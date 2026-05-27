"use client";

import { useState } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";

const CAB_TYPES = ["Sedan", "SUV", "Hatchback", "Tempo Traveller", "Mini"];

const INPUT_CLS =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

export default function ManualCabListing() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departure, setDeparture] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [cabTypes, setCabTypes] = useState<Record<string, boolean>>({});

  const toggleType = (t: string) =>
    setCabTypes((prev) => ({ ...prev, [t]: !prev[t] }));

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#0E1E3A]">
      <Header />
      <main className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        <h1 className="text-xl font-extrabold text-ink mb-4">Manual Cab Listing</h1>

        {/* Search bar */}
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-ink-muted mb-1">From</label>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="E-38, Budh Vihar Rd, Badarpur Delhi"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-ink-muted mb-1">To</label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Alwar Rajasthan"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-ink-muted mb-1">Departure</label>
              <input
                type="date"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-ink-muted mb-1">Pickup Time</label>
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              Search Cabs
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Filters */}
          <aside className="w-full md:w-56 shrink-0">
            <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
              <h2 className="text-[13px] font-bold text-ink mb-3">Cab Type</h2>
              <div className="flex flex-col gap-2">
                {CAB_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!cabTypes[t]}
                      onChange={() => toggleType(t)}
                      className="accent-brand-600"
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0 flex flex-col items-center justify-center rounded-xl border border-border bg-white py-16 shadow-sm">
            <svg viewBox="0 0 24 24" width={40} height={40} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted mb-3" aria-hidden>
              <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <p className="text-sm font-medium text-ink-soft">No cab results found.</p>
            <p className="text-[12px] text-ink-muted mt-1">Search using the form above.</p>
          </div>
        </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
