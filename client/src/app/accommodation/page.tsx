"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Chip from "@/components/ui/Chip";
import EmptyState from "@/components/ui/EmptyState";
import { formatINR } from "@/lib/format";
import {
  browseAccommodation,
  ACCOMMODATION_TYPES,
  ACCOMMODATION_TYPE_LABELS,
  type AccommodationType,
  type PartnerHotel,
} from "@/services/partnerHotels";

function isType(v: string | null): v is AccommodationType {
  return !!v && (ACCOMMODATION_TYPES as readonly string[]).includes(v);
}

function Card({ stay }: { stay: PartnerHotel }) {
  const img = stay.images?.[0]?.url;
  const price = stay.pricing?.basePricePerNight;
  return (
    <Link
      href={`/accommodation/${stay.slug}`}
      className="flex flex-col overflow-hidden rounded-xl border border-border-soft bg-white shadow-(--shadow-xs) transition-shadow hover:shadow-(--shadow-sm)"
    >
      <div className="relative">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={stay.name} loading="lazy" className="h-48 w-full object-cover" />
        ) : (
          <div className="flex h-48 w-full items-center justify-center bg-surface-muted text-sm text-ink-muted">No photo</div>
        )}
        {stay.type && (
          <span className="absolute left-2 top-2 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold capitalize text-white">
            {stay.type.replace("_", " ")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-[15px] font-bold leading-snug text-ink">{stay.name}</h3>
        <p className="text-[12px] text-ink-muted">
          {stay.starRating ? `${stay.starRating}★ · ` : ""}
          {[stay.address?.city, stay.address?.country].filter(Boolean).join(", ")}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-border-soft pt-3">
          {price != null ? (
            <div>
              <p className="text-[11px] text-ink-muted">From</p>
              <p className="text-[17px] font-extrabold leading-tight text-ink">{formatINR(price)}<span className="text-[11px] font-medium text-ink-muted">/night</span></p>
            </div>
          ) : <span className="text-[12px] text-ink-muted">Enquire for pricing</span>}
          <span className="rounded-lg bg-accent-500 px-4 py-2 text-[13px] font-bold text-white">View</span>
        </div>
      </div>
    </Link>
  );
}

function AccommodationBrowse() {
  const params = useSearchParams();
  const initial = params.get("type");
  const [type, setType] = useState<AccommodationType | "all">(isType(initial) ? initial : "all");
  const [items, setItems] = useState<PartnerHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    browseAccommodation({ type: type === "all" ? undefined : type, page: 1 })
      .then((res) => { if (!cancelled) setItems(res.items); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [type]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-[28px] font-extrabold">Accommodation</h1>
      <p className="mt-1 text-[14px] text-ink-muted">
        Stays from our partner hosts — hotels, homestays, villas, houseboats and more. Enquire directly with the host.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Chip active={type === "all"} onClick={() => setType("all")}>All</Chip>
        {ACCOMMODATION_TYPES.map((t) => (
          <Chip key={t} active={type === t} onClick={() => setType(t)}>{ACCOMMODATION_TYPE_LABELS[t]}</Chip>
        ))}
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-xl bg-border-soft/60" />)}
          </div>
        ) : error ? (
          <p className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-[13px] text-danger-700">{error}</p>
        ) : items.length === 0 ? (
          <EmptyState
            title="No listings found"
            emoji="🍂"
            subtitle="Try adjusting your search or category filters."
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((s) => <Card key={s.id} stay={s} />)}
          </div>
        )}
      </div>
    </main>
  );
}

export default function AccommodationPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <Suspense fallback={<div className="mx-auto max-w-7xl px-6 py-10 text-ink-muted">Loading…</div>}>
        <AccommodationBrowse />
      </Suspense>
      <Footer />
    </div>
  );
}
