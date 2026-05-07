"use client";

import { useState } from "react";
import Link from "next/link";

type Category = "all" | "outstation" | "airport" | "sightseeing";

type Destination = {
  name: string;
  state: string;
  category: Exclude<Category, "all">;
  tagline: string;
  fromPrice: string;
  cityCode: string;
  hue: number;
};

const DESTINATIONS: Destination[] = [
  { name: "Agra", state: "Uttar Pradesh", category: "outstation", tagline: "Home of the Taj Mahal", fromPrice: "₹2,499", cityCode: "AGR", hue: 24 },
  { name: "Jaipur", state: "Rajasthan", category: "outstation", tagline: "The Pink City", fromPrice: "₹1,999", cityCode: "JAI", hue: 340 },
  { name: "Mysuru", state: "Karnataka", category: "sightseeing", tagline: "City of Palaces", fromPrice: "₹899", cityCode: "MYS", hue: 270 },
  { name: "Pondicherry", state: "Tamil Nadu", category: "sightseeing", tagline: "French Colonial Charm", fromPrice: "₹999", cityCode: "PNY", hue: 200 },
  { name: "Goa", state: "Goa", category: "sightseeing", tagline: "Sun, Sand & Seafood", fromPrice: "₹799", cityCode: "GOI", hue: 160 },
  { name: "Lonavala", state: "Maharashtra", category: "outstation", tagline: "The Hill Station Escape", fromPrice: "₹1,299", cityCode: "LON", hue: 130 },
  { name: "Mumbai Airport", state: "Maharashtra", category: "airport", tagline: "BOM — Chhatrapati Shivaji", fromPrice: "₹649", cityCode: "BOM", hue: 210 },
  { name: "Delhi Airport", state: "Delhi", category: "airport", tagline: "DEL — Indira Gandhi International", fromPrice: "₹599", cityCode: "DEL", hue: 230 },
  { name: "Bangalore Airport", state: "Karnataka", category: "airport", tagline: "BLR — Kempegowda International", fromPrice: "₹699", cityCode: "BLR", hue: 150 },
  { name: "Udaipur", state: "Rajasthan", category: "sightseeing", tagline: "The City of Lakes", fromPrice: "₹1,099", cityCode: "UDR", hue: 50 },
  { name: "Coorg", state: "Karnataka", category: "sightseeing", tagline: "Scotland of India", fromPrice: "₹1,199", cityCode: "CRG", hue: 100 },
  { name: "Shimla", state: "Himachal Pradesh", category: "outstation", tagline: "Queen of Hills", fromPrice: "₹2,799", cityCode: "SLV", hue: 190 },
];

const CATEGORY_LABELS: Record<Category, string> = {
  all: "All",
  outstation: "Outstation",
  airport: "Airport Transfer",
  sightseeing: "Sightseeing",
};

function destinationHref(d: Destination): string {
  if (d.category === "airport") return `/taxi-package/airport-transfer/results?airport=${d.cityCode}&direction=pickup&date=${new Date().toISOString().slice(0, 10)}&time=10%3A00&flightNo=&pax=1&address=`;
  if (d.category === "sightseeing") return `/taxi-package/sightseeing/results?city=${d.cityCode}&date=${new Date().toISOString().slice(0, 10)}&pax=2`;
  return `/taxi-package/outstation/results?from=DEL&to=${d.cityCode}&tripType=one-way&date=${new Date().toISOString().slice(0, 10)}&pax=1`;
}

export default function TaxiPackageDestinations() {
  const [category, setCategory] = useState<Category>("all");

  const filtered = category === "all" ? DESTINATIONS : DESTINATIONS.filter((d) => d.category === category);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-[var(--ink)] sm:text-3xl">
          Explore Cab Destinations
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--ink-muted)]">
          Pick a destination and book your ride in minutes — outstation, airport transfers, and sightseeing tours.
        </p>
      </div>

      {/* Category pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={[
              "rounded-full border px-4 py-1.5 text-[13px] font-semibold transition-colors",
              category === c
                ? "border-[var(--brand-600)] bg-[var(--brand-600)] text-white"
                : "border-[var(--border-soft)] bg-white text-[var(--ink-soft)] hover:border-[var(--brand-400)]",
            ].join(" ")}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((d) => (
          <Link
            key={d.cityCode + d.category}
            href={destinationHref(d)}
            className="group relative overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-white shadow-[var(--shadow-xs)] transition-shadow hover:shadow-[var(--shadow-md)]"
          >
            {/* Colour swatch header */}
            <div
              className="h-28 w-full"
              style={{
                background: `linear-gradient(135deg, hsl(${d.hue} 55% 40%) 0%, hsl(${d.hue} 65% 55%) 100%)`,
              }}
            >
              <div className="flex h-full items-end p-4">
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                  {CATEGORY_LABELS[d.category]}
                </span>
              </div>
            </div>

            <div className="p-4">
              <p className="text-[15px] font-bold text-[var(--ink)]">{d.name}</p>
              <p className="text-[12px] text-[var(--ink-muted)]">{d.state}</p>
              <p className="mt-1 text-[12px] text-[var(--ink-soft)]">{d.tagline}</p>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[13px] text-[var(--ink-muted)]">
                  Starting from{" "}
                  <span className="font-bold text-[var(--brand-600)]">{d.fromPrice}</span>
                </span>
                <span
                  className="text-[12px] font-semibold text-[var(--brand-600)] transition-transform group-hover:translate-x-1"
                  aria-hidden
                >
                  Book →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-[var(--ink-muted)]">No destinations found for this category.</p>
        </div>
      )}
    </main>
  );
}
