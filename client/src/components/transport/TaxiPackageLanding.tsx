"use client";

import { useState } from "react";
import Link from "next/link";
import OutstationSearch from "./OutstationSearch";
import AirportTransferSearch from "./AirportTransferSearch";
import SightseeingSearch from "./SightseeingSearch";

type Tab = "outstation" | "airport" | "sightseeing";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "outstation",
    label: "Outstation",
    icon: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M1 3h15l2 9H2z" /><path d="M1 12h17v4H1z" />
        <circle cx="5.5" cy="17.5" r="1.5" /><circle cx="14.5" cy="17.5" r="1.5" />
      </svg>
    ),
  },
  {
    id: "airport",
    label: "Airport Transfer",
    icon: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M22 16.5H2" /><path d="M12 2L2 9l2 1 3-1.5L9 16h2l4-6 3 1.5 2-1L12 2z" />
      </svg>
    ),
  },
  {
    id: "sightseeing",
    label: "Sightseeing",
    icon: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="10" r="3" /><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      </svg>
    ),
  },
];

const WHY_ITEMS = [
  { title: "Verified Drivers", body: "All drivers are background-verified and rated by real travelers." },
  { title: "Fixed Fares", body: "No surge pricing. What you see is what you pay — always." },
  { title: "24 × 7 Support", body: "Round-the-clock assistance for every booking, any time." },
  { title: "Free Cancellation", body: "Cancel up to 24 hours before pickup at zero charge." },
];

const POPULAR_ROUTES = [
  { from: "Delhi", to: "Agra", km: "233 km", fare: "₹2,499" },
  { from: "Mumbai", to: "Pune", km: "149 km", fare: "₹1,799" },
  { from: "Bangalore", to: "Mysuru", km: "145 km", fare: "₹1,699" },
  { from: "Chennai", to: "Pondicherry", km: "162 km", fare: "₹1,899" },
  { from: "Hyderabad", to: "Vijayawada", km: "275 km", fare: "₹2,899" },
  { from: "Jaipur", to: "Jodhpur", km: "336 km", fare: "₹3,299" },
];

export default function TaxiPackageLanding() {
  const [activeTab, setActiveTab] = useState<Tab>("outstation");

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--brand-900)] py-16 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 60% 40%, rgba(47,99,224,.35) 0%, transparent 70%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[var(--brand-300)]">
              SpaksTrip Cabs
            </p>
            <h1 className="mb-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Book Cabs Across India — Outstation, Airport & Sightseeing
            </h1>
            <p className="text-base text-white/70">
              Thousands of verified cabs. Fixed fares. No hidden charges. Travel anywhere with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* Search card */}
      <section className="mx-auto -mt-8 max-w-4xl px-4 sm:px-6 relative z-10">
        <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-lg)]">
          {/* Tabs */}
          <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-[var(--surface-muted)] p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-all",
                  activeTab === tab.id
                    ? "bg-white text-[var(--brand-600)] shadow-[var(--shadow-xs)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
                ].join(" ")}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search form */}
          {activeTab === "outstation" && <OutstationSearch />}
          {activeTab === "airport" && <AirportTransferSearch />}
          {activeTab === "sightseeing" && <SightseeingSearch />}
        </div>
      </section>

      {/* Popular routes */}
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
        <h2 className="mb-6 text-xl font-bold text-[var(--ink)]">Popular Outstation Routes</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_ROUTES.map((r) => (
            <div
              key={`${r.from}-${r.to}`}
              className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-white p-4 shadow-[var(--shadow-xs)] transition-shadow hover:shadow-[var(--shadow-sm)]"
            >
              <div>
                <p className="text-[14px] font-bold text-[var(--ink)]">
                  {r.from} → {r.to}
                </p>
                <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">{r.km}</p>
              </div>
              <span className="text-[15px] font-extrabold text-[var(--brand-600)]">{r.fare}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Why book */}
      <section className="mx-auto mt-16 max-w-7xl px-4 pb-20 sm:px-6">
        <h2 className="mb-8 text-xl font-bold text-[var(--ink)]">Why Book with SpaksTrip Cabs?</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_ITEMS.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[var(--border-soft)] bg-white p-5 shadow-[var(--shadow-xs)]"
            >
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "var(--brand-50)" }}
              >
                <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="var(--brand-500)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="mb-1 text-[14px] font-bold text-[var(--ink)]">{item.title}</p>
              <p className="text-[13px] leading-relaxed text-[var(--ink-muted)]">{item.body}</p>
            </div>
          ))}
        </div>

        {/* Partner CTA */}
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl bg-[var(--brand-50)] border border-[var(--brand-100)] px-6 py-8 text-center sm:flex-row sm:text-left">
          <div className="flex-1">
            <p className="text-[15px] font-bold text-[var(--ink)]">Are you a cab operator?</p>
            <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
              List your fleet on SpaksTrip and get bookings from millions of travelers across India.
            </p>
          </div>
          <Link
            href="/taxi-package/add-your-taxi"
            className="inline-flex shrink-0 items-center rounded-xl bg-[var(--brand-600)] px-6 py-3 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
          >
            Add Your Taxi →
          </Link>
        </div>
      </section>
    </div>
  );
}
