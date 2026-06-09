"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import HotelResultCard from "@/components/accommodation/HotelResultCard";
import HotelFilters from "@/components/accommodation/HotelFilters";
import HotelSortBar from "@/components/accommodation/HotelSortBar";
import HotelResultsSkeleton from "@/components/accommodation/HotelResultsSkeleton";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import { useHotelSearch } from "@/hooks/useHotelSearch";
import { applyHotelFilters, sortHotels, type HotelFilters as FiltersType, type HotelSortBy } from "@/services/hotels";
import { CITIES } from "@/lib/mock/hotels";

export default function HotelResultsPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <HotelResultsInner />
    </Suspense>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <main className="flex-1 p-8"><HotelResultsSkeleton /></main>
      <Footer />
    </div>
  );
}

function HotelResultsInner() {
  const sp = useSearchParams();
  const cityCode = sp.get("city") ?? "";
  const checkIn = sp.get("checkIn") ?? "";
  const checkOut = sp.get("checkOut") ?? "";
  const rooms = Number(sp.get("rooms") ?? 1);
  const adults = Number(sp.get("adults") ?? 2);
  const children = Number(sp.get("children") ?? 0);
  const childrenAges = useMemo(() => {
    const raw = sp.get("childrenAges");
    if (!raw) return [];
    return raw.split(",").map(Number).filter((n) => !isNaN(n) && n >= 0);
  }, [sp]);
  const nationality = sp.get("nationality") ?? "IN";

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    return Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
  }, [checkIn, checkOut]);

  const cityObj = CITIES.find((c) => c.code === cityCode);

  const [filters, setFilters] = useState<FiltersType>({});
  const [sort, setSort] = useState<HotelSortBy>("price");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const { status, hotels, priceRange } = useHotelSearch(
    cityCode && checkIn && checkOut
      ? { cityCode, checkIn, checkOut, rooms, adults, children, childrenAges, guestNationality: nationality }
      : null,
  );

  const displayed = useMemo(() => {
    if (!hotels.length) return [];
    const filtered = applyHotelFilters(hotels, filters);
    return sortHotels(filtered, sort);
  }, [hotels, filters, sort]);

  const filtersPanel = (
    <HotelFilters
      filters={filters}
      priceRange={priceRange}
      onChange={setFilters}
    />
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />

      {/* Search context bar */}
      <div className="bg-brand-900 text-white px-4 py-3 text-[13px] font-medium">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-bold text-[15px]">
            {cityObj ? `${cityObj.name}, ${cityObj.country}` : cityCode}
          </span>
          {checkIn && checkOut && (
            <span className="text-white/70">{checkIn} — {checkOut} · {nights} night{nights !== 1 ? "s" : ""}</span>
          )}
          <span className="text-white/70">{rooms} room{rooms !== 1 ? "s" : ""} · {adults + children} guest{adults + children !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
          <div className="grid md:grid-cols-[260px_1fr] gap-6">
            {/* Sidebar filters — desktop */}
            <aside className="hidden md:block">
              <div className="sticky top-24 rounded-xl bg-white border border-border-soft p-4 shadow-(--shadow-xs)">
                <h2 className="text-[14px] font-bold text-ink mb-4">Filters</h2>
                {filtersPanel}
              </div>
            </aside>

            {/* Results */}
            <div className="flex flex-col gap-4">
              {/* Mobile filter button */}
              <div className="md:hidden flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterDrawerOpen(true)}
                  leading={
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
                      <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="12" y1="18" x2="20" y2="18" />
                    </svg>
                  }
                >
                  Filters
                </Button>
              </div>

              {status === "loading" && <HotelResultsSkeleton />}

              {status === "ready" && (
                <>
                  <HotelSortBar value={sort} onChange={setSort} hotels={displayed} total={displayed.length} />
                  {displayed.length === 0 ? (
                    <div className="rounded-xl bg-white border border-border-soft p-12 text-center">
                      <p className="text-[15px] font-semibold text-ink">No properties match your filters</p>
                      <p className="text-[13px] text-ink-muted mt-1">Try adjusting or clearing filters</p>
                      <button
                        type="button"
                        onClick={() => setFilters({})}
                        className="mt-4 text-[13px] font-semibold text-brand-600 hover:underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3" aria-live="polite" aria-label={`${displayed.length} hotels found`}>
                      {displayed.map((hotel) => (
                        <HotelResultCard
                          key={hotel.id}
                          hotel={hotel}
                          checkIn={checkIn}
                          checkOut={checkOut}
                          rooms={rooms}
                          adults={adults}
                          children={children}
                          nights={nights}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {status === "error" && (
                <div className="rounded-xl bg-white border border-border-soft p-12 text-center">
                  <p className="text-[15px] font-semibold text-ink">Something went wrong</p>
                  <p className="text-[13px] text-ink-muted mt-1">Please refresh and try again</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile filter drawer */}
      <Drawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        side="bottom"
        title="Filters"
      >
        <div className="p-4">
          {filtersPanel}
          <Button
            variant="accent"
            fullWidth
            size="lg"
            onClick={() => setFilterDrawerOpen(false)}
            className="mt-6"
          >
            Show {displayed.length} Properties
          </Button>
        </div>
      </Drawer>

      <Footer />
    </div>
  );
}
