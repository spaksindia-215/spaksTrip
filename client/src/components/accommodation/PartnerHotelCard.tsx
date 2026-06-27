"use client";

import { useState } from "react";
import type { PartnerHotel } from "@/services/partnerHotels";
import { formatINR } from "@/lib/format";
import Badge from "@/components/ui/Badge";

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${stars} star hotel`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width={12}
          height={12}
          fill={i < stars ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.5}
          className={i < stars ? "text-warn-500" : "text-border"}
          aria-hidden
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

type Props = {
  hotel: PartnerHotel;
  nights: number;
  rooms: number;
  onEnquire: (hotel: PartnerHotel) => void;
};

export default function PartnerHotelCard({ hotel, nights, rooms, onEnquire }: Props) {
  const images = (hotel.images ?? []).map((i) => i.url).filter(Boolean);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasMultipleImages = images.length > 1;
  const cover = images[currentImageIndex];

  const place = [hotel.address?.street, hotel.address?.city, hotel.address?.state]
    .filter(Boolean)
    .join(", ");
  const price = hotel.pricing?.basePricePerNight;
  const amenities = hotel.amenities ?? [];

  const goPrev = () => setCurrentImageIndex((p) => (p === 0 ? images.length - 1 : p - 1));
  const goNext = () => setCurrentImageIndex((p) => (p === images.length - 1 ? 0 : p + 1));

  return (
    <article className="flex flex-col sm:flex-row overflow-hidden rounded-xl bg-white border border-border-soft shadow-(--shadow-xs) hover:shadow-(--shadow-sm) transition-shadow">
      <div className="relative h-48 sm:h-auto sm:w-52 shrink-0 overflow-hidden group bg-surface-muted">
        {cover ? (
          <img src={cover} alt={hotel.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid h-full w-full place-items-center text-[12px] text-ink-subtle">
            No image
          </div>
        )}
        <span className="absolute top-2 left-2 rounded-full bg-accent-500/90 px-2 py-0.5 text-[11px] font-semibold text-white">
          Partner Hotel
        </span>

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-bold text-ink leading-snug">{hotel.name}</h3>
            {hotel.starRating ? <StarRating stars={hotel.starRating} /> : null}
          </div>

          {place && (
            <p className="text-[12px] text-ink-muted flex items-center gap-1">
              <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {place}
            </p>
          )}

          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {amenities.slice(0, 4).map((a) => (
                <Badge key={a} tone="neutral" size="sm">{a}</Badge>
              ))}
              {amenities.length > 4 && (
                <Badge tone="neutral" size="sm">+{amenities.length - 4} more</Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 pt-2 border-t border-border-soft">
          <div>
            {typeof price === "number" ? (
              <>
                <p className="text-[11px] text-ink-muted">
                  {nights} night{nights !== 1 ? "s" : ""} · {rooms} room{rooms !== 1 ? "s" : ""}
                </p>
                <p className="text-[22px] font-extrabold text-ink leading-tight">
                  {formatINR(price)}
                  <span className="text-[13px] font-medium text-ink-muted"> /night</span>
                </p>
                <p className="text-[11px] text-ink-muted">Price on enquiry · taxes extra</p>
              </>
            ) : (
              <p className="text-[13px] font-semibold text-ink">Price on enquiry</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onEnquire(hotel)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent-500 px-5 py-2.5 text-[14px] font-bold text-white hover:bg-accent-600 transition-colors"
          >
            Enquire Now
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
