"use client";

import { useState } from "react";
import { useTranslate } from "@tolgee/react";
import SectionHeading from "./SectionHeading";

type Destination = {
  name: string;
  reviews: number;
  image: string;
};

const DESTINATIONS: Destination[] = [
  {
    name: "Turkey",
    reviews: 452,
    image:
      "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Thailand",
    reviews: 400,
    image:
      "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Australia",
    reviews: 400,
    image:
      "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Brazil",
    reviews: 422,
    image:
      "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Japan",
    reviews: 388,
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Italy",
    reviews: 510,
    image:
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=900&q=80",
  },
];

export default function Destinations() {
  const { t } = useTranslate();
  const [current, setCurrent] = useState(0);
  const total = DESTINATIONS.length;

  const prev = () => setCurrent((s) => (s - 1 + total) % total);
  const next = () => setCurrent((s) => (s + 1) % total);

  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          title={t("landing.destinations_world")}
          subtitle={t("landing.destinations_subtitle")}
        />

        <div className="relative mt-12">
          <button
            type="button"
            aria-label={t("landing.previous_destinations")}
            onClick={prev}
            className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-700 shadow-md ring-1 ring-black/5 hover:bg-zinc-50"
          >
            <Chevron direction="left" />
          </button>
          <button
            type="button"
            aria-label={t("landing.next_destinations")}
            onClick={next}
            className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-700 shadow-md ring-1 ring-black/5 hover:bg-zinc-50"
          >
            <Chevron direction="right" />
          </button>

          <div className="grid grid-cols-1 gap-6">
            <DestinationCard destination={DESTINATIONS[current]} />
          </div>
        </div>
      </div>
    </section>
  );
}

function DestinationCard({ destination }: { destination: Destination }) {
  const { t } = useTranslate();
  return (
    <article className="group relative h-[440px] overflow-hidden rounded-2xl">
      <img
        src={destination.image}
        alt={destination.name}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <h3 className="text-2xl font-bold">{destination.name}</h3>
        <div className="mt-2 flex items-center gap-2">
          <Stars />
          <span className="text-sm text-white/90">{t("landing.reviews_count", { count: destination.reviews })}</span>
        </div>
      </div>
    </article>
  );
}

function Stars() {
  return (
    <div className="flex items-center gap-0.5 text-[#FFC72C]">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden="true">
          <path d="m12 2 3 7h7l-5.6 4.1L18.2 20 12 15.9 5.8 20l1.8-6.9L2 9h7Z" />
        </svg>
      ))}
    </div>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {direction === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  );
}
