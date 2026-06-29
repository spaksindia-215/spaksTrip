"use client";

import { use, useEffect, useMemo, useState } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import AccommodationEnquiryModal from "@/components/accommodation/AccommodationEnquiryModal";
import { formatINR } from "@/lib/format";
import { getAccommodation, type PartnerHotel, type PartnerHotelPromotion } from "@/services/partnerHotels";

function formatDiscount(p: PartnerHotelPromotion): string {
  const value = p.discountValue ?? 0;
  if (p.discountType === "Percentage") return `${value}% off`;
  return `${formatINR(value)} off`;
}

export default function AccommodationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [stay, setStay] = useState<PartnerHotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getAccommodation(slug)
      .then((s) => { if (!cancelled) setStay(s); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  const images = useMemo(() => (stay?.images ?? []).map((i) => i.url).filter(Boolean), [stay]);

  const addressLine = stay
    ? [stay.address?.street, stay.address?.city, stay.address?.state, stay.address?.country, stay.address?.postalCode]
        .filter(Boolean)
        .join(", ")
    : "";

  // Keyless Google Maps embed: prefer exact coordinates, else the address text.
  const mapQuery = useMemo(() => {
    const coords = stay?.coordinates?.coordinates;
    if (coords && coords.length === 2) {
      const [lng, lat] = coords;
      return `${lat},${lng}`;
    }
    return addressLine;
  }, [stay, addressLine]);

  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {loading && <div className="h-96 animate-pulse rounded-2xl bg-border-soft/60" />}
        {error && <p className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-[14px] text-danger-700">{error}</p>}

        {stay && (
          <div className="flex flex-col gap-8">
            {/* Hero + gallery */}
            <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="flex flex-col gap-3">
                <div className="overflow-hidden rounded-2xl">
                  {images[activeImg] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={images[activeImg]} alt={stay.name} className="h-72 w-full object-cover sm:h-96" />
                  ) : (
                    <div className="flex h-72 w-full items-center justify-center bg-surface-muted text-ink-muted sm:h-96">No image</div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {images.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImg(i)}
                        className={`h-16 w-24 overflow-hidden rounded-lg ring-2 transition-all ${
                          i === activeImg ? "ring-brand-600" : "ring-transparent hover:ring-border"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`${stay.name} ${i + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
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
                  {addressLine}
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

            {/* Offers */}
            {stay.promotions && stay.promotions.length > 0 && (
              <section>
                <h2 className="mb-2 text-[18px] font-bold">Offers</h2>
                <div className="flex flex-wrap gap-3">
                  {stay.promotions.map((p, i) => (
                    <div
                      key={p.key ?? i}
                      className="flex items-center gap-3 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-500 text-white" aria-hidden>
                        %
                      </span>
                      <div>
                        <p className="text-[14px] font-bold text-ink">{p.name || "Special offer"}</p>
                        <p className="text-[12px] font-semibold text-accent-700">
                          {formatDiscount(p)}
                          {p.endDate ? ` · till ${new Date(p.endDate).toLocaleDateString("en-IN")}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

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
                <div className="flex flex-col gap-4">
                  {stay.rooms.map((r, i) => {
                    const coverImg = r.images?.[0];
                    const occupancy = [
                      r.maxAdults ? `${r.maxAdults} adult${r.maxAdults > 1 ? "s" : ""}` : null,
                      r.maxChildren ? `${r.maxChildren} child${r.maxChildren > 1 ? "ren" : ""}` : null,
                    ].filter(Boolean).join(", ");
                    const meta = [
                      r.bedType,
                      r.roomSize ? `${r.roomSize} sqft` : null,
                      occupancy || null,
                    ].filter(Boolean).join(" · ");
                    return (
                      <div key={i} className="flex overflow-hidden rounded-xl border border-border-soft bg-white shadow-sm">
                        <div className="w-44 shrink-0 sm:w-56">
                          {coverImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={coverImg} alt={r.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full min-h-35 w-full items-center justify-center bg-surface-muted text-[12px] text-ink-muted">
                              No photo
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col justify-between p-4">
                          <div>
                            <p className="text-[15px] font-bold text-ink">{r.name}</p>
                            {meta && <p className="mt-0.5 text-[12px] text-ink-muted">{meta}</p>}
                            {r.description && (
                              <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-soft">{r.description}</p>
                            )}
                            {r.amenities && r.amenities.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {r.amenities.map((a) => (
                                  <span key={a} className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-ink-soft">{a}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            {stay.pricing?.basePricePerNight != null && (
                              <p className="text-[15px] font-extrabold text-ink">
                                {formatINR(stay.pricing.basePricePerNight)}
                                <span className="text-[11px] font-medium text-ink-muted"> /night</span>
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={() => setModalOpen(true)}
                              className="ml-auto rounded-lg bg-accent-500 px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-accent-600"
                            >
                              Enquire
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Location + map */}
            {(addressLine || mapQuery) && (
              <section className="flex flex-col gap-3">
                <h2 className="text-[18px] font-bold">Location</h2>
                {addressLine && <p className="text-[13px] text-ink-soft">{addressLine}</p>}
                {mapQuery && (
                  <div className="overflow-hidden rounded-2xl border border-border-soft">
                    <iframe
                      title={`Map of ${stay.name}`}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`}
                      className="h-72 w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                    <div className="border-t border-border-soft bg-surface-muted px-4 py-2.5">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] font-semibold text-brand-700 hover:underline"
                      >
                        Open in Google Maps →
                      </a>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Policies + host contact */}
            <section className="grid gap-6 sm:grid-cols-2">
              {stay.policies &&
                (stay.policies.checkIn ||
                  stay.policies.checkOut ||
                  stay.policies.cancellation ||
                  stay.policies.child ||
                  stay.policies.pet ||
                  stay.policies.smoking) && (
                  <div>
                    <h3 className="mb-2 text-[15px] font-bold">Policies</h3>
                    <ul className="flex flex-col gap-1 text-[13px] text-ink-soft">
                      {stay.policies.checkIn && <li>Check-in: {stay.policies.checkIn}</li>}
                      {stay.policies.checkOut && <li>Check-out: {stay.policies.checkOut}</li>}
                      {stay.policies.cancellation && <li>Cancellation: {stay.policies.cancellation}</li>}
                      {stay.policies.child && <li>Children: {stay.policies.child}</li>}
                      {stay.policies.pet && <li>Pets: {stay.policies.pet}</li>}
                      {stay.policies.smoking && <li>Smoking: {stay.policies.smoking}</li>}
                    </ul>
                  </div>
                )}
              {stay.contact && (stay.contact.phone || stay.contact.email) && (
                <div>
                  <h3 className="mb-2 text-[15px] font-bold">Contact</h3>
                  <ul className="flex flex-col gap-1 text-[13px] text-ink-soft">
                    {stay.contact.phone && <li>Phone: {stay.contact.phone}</li>}
                    {stay.contact.email && <li>Email: {stay.contact.email}</li>}
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
