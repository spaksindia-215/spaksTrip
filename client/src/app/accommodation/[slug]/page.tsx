"use client";

import { use, useEffect, useState } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import AccommodationEnquiryModal from "@/components/accommodation/AccommodationEnquiryModal";
import { formatINR } from "@/lib/format";
import { getAccommodation, type PartnerHotel } from "@/services/partnerHotels";

export default function AccommodationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [stay, setStay] = useState<PartnerHotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAccommodation(slug)
      .then((s) => { if (!cancelled) setStay(s); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {loading && <div className="h-96 animate-pulse rounded-2xl bg-border-soft/60" />}
        {error && <p className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-[14px] text-danger-700">{error}</p>}

        {stay && (
          <div className="flex flex-col gap-8">
            {/* Hero */}
            <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="overflow-hidden rounded-2xl">
                {stay.images?.[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={stay.images[0].url} alt={stay.name} className="h-72 w-full object-cover sm:h-96" />
                ) : (
                  <div className="flex h-72 w-full items-center justify-center bg-surface-muted text-ink-muted sm:h-96">No image</div>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {stay.type && (
                  <span className="w-fit rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold capitalize text-brand-700">
                    {stay.type.replace("_", " ")}
                  </span>
                )}
                <h1 className="text-[26px] font-extrabold leading-tight">{stay.name}</h1>
                <p className="text-[13px] font-semibold text-ink-muted">
                  {stay.starRating ? `${stay.starRating}★ · ` : ""}
                  {[stay.address?.street, stay.address?.city, stay.address?.state, stay.address?.country].filter(Boolean).join(", ")}
                </p>
                {stay.pricing?.basePricePerNight != null && (
                  <p className="text-[20px] font-extrabold text-ink">
                    {formatINR(stay.pricing.basePricePerNight)}
                    <span className="text-[12px] font-medium text-ink-muted"> /night</span>
                  </p>
                )}
                {stay.description && <p className="text-[14px] leading-relaxed text-ink-soft">{stay.description}</p>}
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="mt-1 w-fit rounded-lg bg-accent-500 px-6 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-accent-600"
                >
                  Enquire Now
                </button>
              </div>
            </section>

            {/* Amenities */}
            {stay.amenities && stay.amenities.length > 0 && (
              <section>
                <h2 className="mb-2 text-[18px] font-bold">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {stay.amenities.map((a) => (
                    <span key={a} className="rounded-full border border-border bg-surface-muted px-3 py-1 text-[12px] text-ink-soft">{a}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Rooms */}
            {stay.rooms && stay.rooms.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-[18px] font-bold">Rooms</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {stay.rooms.map((r, i) => (
                    <div key={i} className="rounded-xl border border-border-soft bg-white p-4">
                      <p className="text-[14px] font-bold text-ink">{r.name}</p>
                      <p className="mt-1 text-[12px] text-ink-muted">
                        {[r.bedType, r.roomSize, r.maxAdults ? `${r.maxAdults} adults` : null].filter(Boolean).join(" · ")}
                      </p>
                      {r.description && <p className="mt-1 text-[13px] text-ink-soft">{r.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Policies + host contact */}
            <section className="grid gap-6 sm:grid-cols-2">
              {stay.policies && (stay.policies.checkIn || stay.policies.checkOut || stay.policies.cancellation) && (
                <div>
                  <h3 className="mb-2 text-[15px] font-bold">Policies</h3>
                  <ul className="flex flex-col gap-1 text-[13px] text-ink-soft">
                    {stay.policies.checkIn && <li>Check-in: {stay.policies.checkIn}</li>}
                    {stay.policies.checkOut && <li>Check-out: {stay.policies.checkOut}</li>}
                    {stay.policies.cancellation && <li>Cancellation: {stay.policies.cancellation}</li>}
                  </ul>
                </div>
              )}
            </section>

            <AccommodationEnquiryModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              hotelId={stay.id}
              hotelName={stay.name}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
