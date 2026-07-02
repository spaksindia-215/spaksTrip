"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import { listDestinations, categoryLabel, type TourDestination } from "@/lib/tourListingsClient";
import { formatINR } from "@/lib/format";

function DestinationCard({ dest }: { dest: TourDestination }) {
  const img = dest.image ?? "/forest.jpg";
  return (
    <Link
      href={`/tours/${encodeURIComponent(dest.name)}`}
      className="group relative overflow-hidden rounded-2xl shadow-(--shadow-sm) hover:shadow-(--shadow-md) transition-shadow duration-300"
    >
      {/* Cover image */}
      <div className="relative h-60 overflow-hidden">
        <img
          src={img}
          alt={dest.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Text overlay */}
        <div className="absolute bottom-0 left-0 p-5">
          <h2 className="text-xl font-extrabold text-white leading-tight drop-shadow-sm">
            {dest.name}
          </h2>
          {dest.categories.length > 0 && (
            <p className="mt-1 text-[12px] font-medium text-white/80">
              {dest.categories.slice(0, 2).map(categoryLabel).join(" · ")}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 text-[12px] text-white/90">
            <span className="font-semibold">{dest.count} tour{dest.count === 1 ? "" : "s"}</span>
            {dest.fromPrice != null && (
              <>
                <span className="opacity-50">·</span>
                <span>From {formatINR(dest.fromPrice)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="h-60 animate-pulse rounded-2xl bg-border-soft/60" />
  );
}

export default function ToursPage() {
  const [destinations, setDestinations] = useState<TourDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDestinations()
      .then((r) => setDestinations(r.destinations))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load destinations"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white text-ink">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-[#0b1f4d] to-brand-900 py-16 text-white">
          <div className="absolute inset-0 bg-[url('/forest.jpg')] bg-cover bg-center opacity-15 mix-blend-luminosity" />
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-brand-200">
              Curated by partners
            </p>
            <h1 className="mt-3 text-[36px] font-extrabold leading-tight sm:text-[44px]">
              Explore Tour Experiences
            </h1>
            <p className="mt-3 text-[15px] text-brand-100/80">
              Day tours, multi-day packages, and guided experiences — hand-picked by local experts.
            </p>
          </div>
        </section>

        {/* Destination grid */}
        <section className="mx-auto max-w-7xl px-6 py-14">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[22px] font-extrabold text-ink">Explore by Destination</h2>
              <p className="mt-1 text-[14px] text-ink-muted">
                Pick a destination to see all available tours and operators.
              </p>
            </div>
            {!loading && destinations.length > 0 && (
              <span className="text-[13px] text-ink-muted">
                {destinations.length} destination{destinations.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-[13px] text-danger-700">
              {error}
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : destinations.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
              <p className="text-[40px]">🗺️</p>
              <p className="mt-3 text-[16px] font-bold text-ink">No tour destinations yet</p>
              <p className="mt-1 text-[13px] text-ink-muted">
                Tour listings will appear here once partners publish them.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((d) => (
                <DestinationCard key={d.name} dest={d} />
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
