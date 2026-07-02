"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import {
  listTourListings,
  categoryLabel,
  operatorName,
  fromPrice,
  durationLabel,
  type TourListingSummary,
  type TourCategory,
} from "@/lib/tourListingsClient";
import { formatINR } from "@/lib/format";

const CATEGORIES: { key: TourCategory | ""; label: string }[] = [
  { key: "", label: "All" },
  { key: "sightseeing", label: "Sightseeing" },
  { key: "adventure", label: "Adventure" },
  { key: "cultural", label: "Cultural" },
  { key: "religious", label: "Religious" },
  { key: "wildlife", label: "Wildlife" },
  { key: "honeymoon", label: "Honeymoon" },
  { key: "group", label: "Group" },
  { key: "cruise_day", label: "Day Cruise" },
];

function OperatorCard({ listing }: { listing: TourListingSummary }) {
  const img = listing.images[0]?.url ?? "/placeholder.jpg";
  const price = fromPrice(listing);
  const dur = durationLabel(listing);
  const operator = operatorName(listing);
  const adultPricing = listing.pricing.find((p) => p.label.toLowerCase().includes("adult")) ?? listing.pricing[0];

  return (
    <Link
      href={`/tours/listing/${listing.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border-soft bg-white shadow-(--shadow-xs) transition-shadow hover:shadow-(--shadow-md)"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={img}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {listing.privateAvailable && (
          <span className="absolute right-3 top-3 rounded-full bg-accent-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
            Private Available
          </span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-brand-900/80 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          {categoryLabel(listing.category)}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-[15px] font-bold leading-snug text-ink">{listing.title}</h3>
          <p className="mt-0.5 text-[12px] text-ink-muted">{operator}</p>
        </div>

        {/* Meta: duration, group size */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-ink-soft">
          {dur && <span className="flex items-center gap-1">🕐 {dur}</span>}
          {listing.minGroupSize > 1 && (
            <span className="flex items-center gap-1">👥 Min {listing.minGroupSize}</span>
          )}
          {listing.pickupIncluded !== undefined && listing.pickupIncluded && (
            <span className="flex items-center gap-1 text-success-600">✓ Pickup</span>
          )}
        </div>

        {/* Itinerary snippet */}
        {listing.highlights.length > 0 && (
          <ul className="flex flex-col gap-1">
            {listing.highlights.slice(0, 2).map((h) => (
              <li key={h} className="flex items-start gap-1.5 text-[12px] text-ink-muted">
                <span className="mt-0.5 text-success-500">✓</span>
                <span className="line-clamp-1">{h}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Pricing */}
        <div className="mt-auto flex items-end justify-between border-t border-border-soft pt-3">
          <div>
            {price != null ? (
              <>
                <p className="text-[11px] text-ink-muted">
                  {adultPricing?.label ?? "Starting from"}
                </p>
                <p className="text-[20px] font-extrabold leading-tight text-brand-700">
                  {formatINR(price)}
                </p>
              </>
            ) : (
              <p className="text-[13px] font-semibold text-ink-muted">Enquire for price</p>
            )}
          </div>
          <span className="rounded-xl bg-accent-500 px-4 py-2 text-[13px] font-bold text-white transition-colors group-hover:bg-accent-600">
            View Tour
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function TourDestinationPage({
  params,
}: {
  params: Promise<{ destination: string }>;
}) {
  const { destination } = use(params);
  const decoded = decodeURIComponent(destination);

  const [listings, setListings] = useState<TourListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<TourCategory | "">("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listTourListings({ destination: decoded, category: category || undefined, limit: 50 })
      .then((r) => { if (!cancelled) setListings(r.items); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [decoded, category]);

  return (
    <div className="min-h-screen bg-white text-ink">
      <Header />
      <main>
        {/* Hero strip */}
        <section className="bg-gradient-to-r from-brand-900 via-[#0b1f4d] to-brand-900 py-10 text-white">
          <div className="mx-auto max-w-7xl px-6">
            <Link
              href="/tours"
              className="inline-flex items-center gap-1.5 text-[13px] text-brand-200 hover:text-white"
            >
              ← All Destinations
            </Link>
            <h1 className="mt-2 text-[30px] font-extrabold sm:text-[36px]">{decoded}</h1>
            {!loading && (
              <p className="mt-1 text-[14px] text-brand-200">
                {listings.length} tour{listings.length === 1 ? "" : "s"} available
              </p>
            )}
          </div>
        </section>

        {/* Category filter chips */}
        <section className="sticky top-0 z-20 border-b border-border-soft bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-3 scrollbar-none">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key as TourCategory | "")}
                className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                  category === c.key
                    ? "bg-brand-600 text-white"
                    : "bg-surface-muted text-ink-soft hover:bg-border-soft"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        {/* Listings grid */}
        <section className="mx-auto max-w-7xl px-6 py-10">
          {error && (
            <p className="mb-6 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-[13px] text-danger-700">
              {error}
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-96 animate-pulse rounded-2xl bg-border-soft/60" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
              <p className="text-[40px]">🏔️</p>
              <p className="mt-3 text-[16px] font-bold text-ink">No tours found</p>
              <p className="mt-1 text-[13px] text-ink-muted">
                {category
                  ? `No ${categoryLabel(category)} tours in ${decoded} yet. Try a different category.`
                  : `No active tours in ${decoded} yet.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((l) => (
                <OperatorCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
