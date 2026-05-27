"use client";

import { useState } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";

const DURATIONS = ["1-3 Days", "4-7 Days", "8-14 Days", "15+ Days"];

export default function ManualTourListing() {
  const [sortBy, setSortBy] = useState("price-low");
  const [durations, setDurations] = useState<Record<string, boolean>>({});

  const toggleDuration = (d: string) =>
    setDurations((prev) => ({ ...prev, [d]: !prev[d] }));

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#0E1E3A]">
      <Header />
      <main className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-extrabold text-ink">Manual International Tour Listing</h1>
          <div className="flex items-center gap-2">
            <label className="text-[13px] font-semibold text-ink-muted whitespace-nowrap">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-[13px] text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="price-low">Price — Low to High</option>
              <option value="price-high">Price — High to Low</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Sidebar filters */}
          <aside className="w-full md:w-56 shrink-0">
            <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
              <h2 className="text-[13px] font-bold text-ink mb-3">Duration</h2>
              <div className="flex flex-col gap-2">
                {DURATIONS.map((d) => (
                  <label key={d} className="flex items-center gap-2 text-[13px] text-ink cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!durations[d]}
                      onChange={() => toggleDuration(d)}
                      className="accent-brand-600"
                    />
                    {d}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0 flex flex-col items-center justify-center rounded-xl border border-border bg-white py-16 shadow-sm">
            <svg viewBox="0 0 24 24" width={40} height={40} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted mb-3" aria-hidden>
              <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <p className="text-sm font-medium text-ink-soft">No international tour listings found.</p>
            <p className="text-[12px] text-ink-muted mt-1">Adjust filters or add tours manually.</p>
          </div>
        </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
