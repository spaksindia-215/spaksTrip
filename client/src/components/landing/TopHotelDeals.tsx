"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTranslate } from "@tolgee/react";
import SectionHeading from "./SectionHeading";
import { useCountryLocale } from "@/state/localeStore";
import { formatCurrency } from "@/lib/format";

type Hotel = {
  city: string;
  image: string;
  basePrice: number;
};

const HOTELS: Hotel[] = [
  { city: "Haridwar",  image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=900&q=80", basePrice: 2500 },
  { city: "Bangkok",   image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=900&q=80", basePrice: 4800 },
  { city: "Abu Dhabi", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80", basePrice: 8500 },
  { city: "Mumbai",    image: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=900&q=80", basePrice: 3200 },
  { city: "Manali",    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=900&q=80", basePrice: 2800 },
  { city: "Dubai",     image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=900&q=80", basePrice: 9200 },
  { city: "Goa",       image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=80", basePrice: 3500 },
  { city: "Jaipur",    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=900&q=80", basePrice: 2100 },
  { city: "Singapore", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=80", basePrice: 7600 },
  { city: "Paris",     image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80", basePrice: 11000 },
];

function getSlidePositions(element: HTMLDivElement) {
  const containerLeft = element.getBoundingClientRect().left;

  return Array.from(element.children).map((child) => {
    const slide = child as HTMLElement;
    return slide.getBoundingClientRect().left - containerLeft + element.scrollLeft;
  });
}

function getNearestSlide(element: HTMLDivElement) {
  const positions = getSlidePositions(element);

  return positions.reduce(
    (nearest, position, index) => {
      const distance = Math.abs(position - element.scrollLeft);
      return distance < nearest.distance ? { distance, index } : nearest;
    },
    { distance: Number.POSITIVE_INFINITY, index: 0 },
  ).index;
}

export default function TopHotelDeals() {
  const { t } = useTranslate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const [page, setPage] = useState(0);

  const pageCount = HOTELS.length;

  const syncPage = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    setPage(getNearestSlide(element));
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const onScroll = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(syncPage);
    };

    element.addEventListener("scroll", onScroll, { passive: true });
    syncPage();

    const resizeObserver = new ResizeObserver(syncPage);
    resizeObserver.observe(element);

    return () => {
      element.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();

      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [syncPage]);

  const scrollToPage = useCallback((index: number) => {
    const element = scrollRef.current;
    if (!element) return;

    const positions = getSlidePositions(element);
    const nextIndex = Math.max(0, Math.min(index, positions.length - 1));

    element.scrollTo({
      left: positions[nextIndex],
      behavior: "smooth",
    });
  }, []);

  const scrollCards = (direction: "left" | "right") => {
    const element = scrollRef.current;
    if (!element) return;

    const currentPage = getNearestSlide(element);
    scrollToPage(currentPage + (direction === "left" ? -1 : 1));
  };

  const handleTrackKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollCards("left");
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollCards("right");
    }
  };

  return (
    <section className="py-14 sm:py-16 lg:py-20">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <SectionHeading
          title={t("hotel.top_deals")}
          subtitle={t("hotel.top_choices_subtitle")}
        />

        {/* SLIDER */}
        <div className="relative mt-8 w-full sm:mt-10 lg:mt-12">
          <button
            type="button"
            aria-label={t("landing.scroll_left")}
            onClick={() => scrollCards("left")}
            className="absolute left-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white text-zinc-700 shadow-md ring-1 ring-black/5 hover:bg-zinc-50 lg:-left-4"
          >
            <Chevron direction="left" />
          </button>
          <button
            type="button"
            aria-label={t("landing.scroll_right")}
            onClick={() => scrollCards("right")}
            className="absolute right-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white text-zinc-700 shadow-md ring-1 ring-black/5 hover:bg-zinc-50 lg:-right-4"
          >
            <Chevron direction="right" />
          </button>
          <div
            ref={scrollRef}
            role="region"
            aria-label={t("hotel.top_deals")}
            aria-roledescription="carousel"
            tabIndex={0}
            onKeyDown={handleTrackKeyDown}
            className="flex w-full touch-pan-x snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {HOTELS.map((h) => (
              <div
                key={h.city}
                className="flex min-w-0 flex-[0_0_92%] snap-center justify-center px-1 sm:flex-[0_0_76%] sm:px-3 md:flex-[0_0_50%] md:px-4 lg:px-6"
              >
                <HotelCard hotel={h} />
              </div>
            ))}
          </div>
        </div>

        {/* DOTS */}
        <div className="mt-6 flex items-center justify-center gap-2 sm:mt-8">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={t("landing.hotel_deals_page", { n: i + 1 })}
              aria-current={i === page ? "true" : undefined}
              onClick={() => scrollToPage(i)}
              className={`h-2 rounded-full transition-all ${
                i === page ? "w-8 bg-[#E0382E]" : "w-2 bg-zinc-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  const { t } = useTranslate();
  const { locale, currency } = useCountryLocale();
  const price = formatCurrency(hotel.basePrice, locale, currency);

  return (
    <a
      href="#"
      className="group relative block h-[340px] w-full overflow-hidden rounded-xl sm:h-[400px] md:h-[430px] lg:h-[460px]"
      aria-label={t("landing.explore_hotels_in", { city: hotel.city })}
    >
      <img
        src={hotel.image}
        alt={hotel.city}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

      <div className="absolute bottom-4 left-4 flex flex-col gap-0.5">
        <span className="text-xl font-bold text-white drop-shadow">{hotel.city}</span>
        <span className="text-[11px] text-white/80">{t("landing.from_per_night", { price })}</span>
      </div>

      <span className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white text-[#0E1E3A] shadow transition-transform group-hover:translate-x-1">
        <svg
          viewBox="0 0 24 24"
          width={16}
          height={16}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1={5} y1={12} x2={19} y2={12} />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </span>
    </a>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {direction === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  );
}