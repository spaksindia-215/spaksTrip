"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import ResultsSearchStrip from "@/components/flight/ResultsSearchStrip";
import FareCalendar from "@/components/flight/FareCalendar";
import FlightFiltersPanel from "@/components/flight/FlightFilters";
import FlightSortBar from "@/components/flight/FlightSortBar";
import FlightResultCard from "@/components/flight/FlightResultCard";
import FlightResultsSkeleton from "@/components/flight/FlightResultsSkeleton";
import ActiveFilterChips from "@/components/flight/ActiveFilterChips";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";
import Pagination from "@/components/ui/Pagination";
import { useFlightSearch } from "@/hooks/useFlightSearch";
import { applyFilters, sortOffers, countActiveFilters, type FlightFilters, type SortBy } from "@/services/flights";

const PER_PAGE = 10;
import type { CabinClass } from "@/lib/mock/flights";
import type { FareCategory } from "@/state/flightSearchStore";

const CABINS: CabinClass[] = ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"];
const FARE_CATEGORIES: FareCategory[] = ["regular", "student", "armed_forces", "senior_citizen"];

export default function FlightResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-surface-muted">
          <Header />
          <main className="flex-1 p-6">
            <div className="mx-auto max-w-7xl">
              <FlightResultsSkeleton />
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <FlightResultsInner />
    </Suspense>
  );
}

function FlightResultsInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const from = sp.get("from") ?? "DEL";
  const to = sp.get("to") ?? "BOM";
  const depart = sp.get("depart") ?? new Date().toISOString().slice(0, 10);
  const returnDate = sp.get("return") ?? undefined;
  const trip = sp.get("trip") ?? "ONEWAY";
  const cabinParam = (sp.get("cabin") as CabinClass) ?? "ECONOMY";
  const cabin = CABINS.includes(cabinParam) ? cabinParam : "ECONOMY";
  const adults = Number(sp.get("adults") ?? "1");
  const children = Number(sp.get("children") ?? "0");
  const infants = Number(sp.get("infants") ?? "0");
  const directOnly = sp.get("direct") === "1";
  const fareCategoryParam = (sp.get("fareCategory") as FareCategory) ?? "regular";
  const fareCategory = FARE_CATEGORIES.includes(fareCategoryParam) ? fareCategoryParam : "regular";

  const input = useMemo(
    () => ({ from, to, date: depart, cabin, adults, children, infants, directOnly }),
    [from, to, depart, cabin, adults, children, infants, directOnly],
  );

  const { status, offers, priceRange } = useFlightSearch(input);

  const [filters, setFilters] = useState<FlightFilters>({});
  const [sort, setSort] = useState<SortBy>("price");
  const [mobileFilters, setMobileFilters] = useState(false);
  const [page, setPage] = useState(1);
  const resultsTopRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    return sortOffers(applyFilters(offers, filters), sort);
  }, [offers, filters, sort]);

  // Pagination. The page is clamped during render so a shrinking result set
  // (new search / added filter) never leaves us on an out-of-range page —
  // avoids a setState-in-effect.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PER_PAGE;
  const paged = filtered.slice(pageStart, pageStart + PER_PAGE);
  const activeFilterCount = countActiveFilters(filters);

  // Changing filters or sort resets to the first page (done in handlers, not an effect).
  const changeFilters = (f: FlightFilters) => {
    setFilters(f);
    setPage(1);
  };
  const changeSort = (s: SortBy) => {
    setSort(s);
    setPage(1);
  };
  const goToPage = (p: number) => {
    setPage(p);
    resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDateChange = (date: string) => {
    const next = new URLSearchParams(sp.toString());
    next.set("depart", date);
    router.push(`/flight/results?${next.toString()}`);
  };

  const searchParamsString = sp.toString();

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <ResultsSearchStrip
        from={from}
        to={to}
        depart={depart}
        returnDate={returnDate}
        trip={trip}
        adults={adults}
        children={children}
        infants={infants}
        cabin={cabin}
      />
      <FareCalendar
        from={from}
        to={to}
        cabin={cabin}
        depart={depart}
        onDateChange={handleDateChange}
      />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-5">
          <div className="grid lg:grid-cols-[280px_1fr] gap-6">
            <aside className="hidden lg:block sticky top-[calc(theme(spacing.0)+140px)] self-start rounded-xl bg-white border border-border-soft p-5 shadow-(--shadow-xs)">
              <FlightFiltersPanel
                offers={offers}
                filters={filters}
                onChange={changeFilters}
                priceRange={priceRange}
              />
            </aside>

            <section>
              <div ref={resultsTopRef} className="scroll-mt-40" />
              <div className="flex items-center gap-3 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setMobileFilters(true)}
                  leading={
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                      <line x1="4" y1="21" x2="4" y2="14" />
                      <line x1="4" y1="10" x2="4" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12" y2="3" />
                      <line x1="20" y1="21" x2="20" y2="16" />
                      <line x1="20" y1="12" x2="20" y2="3" />
                      <line x1="1" y1="14" x2="7" y2="14" />
                      <line x1="9" y1="8" x2="15" y2="8" />
                      <line x1="17" y1="16" x2="23" y2="16" />
                    </svg>
                  }
                >
                  Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </Button>
                <div className="flex-1">
                  <FlightSortBar
                    value={sort}
                    onChange={changeSort}
                    offers={offers}
                    total={filtered.length}
                  />
                </div>
              </div>

              {status !== "loading" && (
                <ActiveFilterChips filters={filters} onChange={changeFilters} />
              )}

              {status === "loading" ? (
                <FlightResultsSkeleton />
              ) : filtered.length === 0 ? (
                <EmptyResults onClearFilters={() => changeFilters({})} />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3 text-[12px] text-ink-muted">
                    <span>
                      Showing <span className="font-semibold text-ink">{pageStart + 1}–{pageStart + paged.length}</span> of{" "}
                      <span className="font-semibold text-ink">{filtered.length}</span> flights
                    </span>
                    {totalPages > 1 && (
                      <span>Page {safePage} of {totalPages}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    {paged.map((o) => (
                      <FlightResultCard
                        key={o.id}
                        offer={o}
                        searchParams={searchParamsString}
                        fareCategory={fareCategory}
                      />
                    ))}
                  </div>
                  <Pagination
                    page={safePage}
                    totalPages={totalPages}
                    onChange={goToPage}
                    className="mt-6"
                  />
                </>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />

      <Drawer
        open={mobileFilters}
        onClose={() => setMobileFilters(false)}
        title="Filters"
        side="left"
        width="min(340px, 92vw)"
        footer={
          <Button fullWidth onClick={() => setMobileFilters(false)}>
            Show {filtered.length} flights
          </Button>
        }
      >
        <div className="p-4">
          <FlightFiltersPanel
            offers={offers}
            filters={filters}
            onChange={changeFilters}
            priceRange={priceRange}
          />
        </div>
      </Drawer>
    </div>
  );
}

function EmptyResults({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="rounded-xl bg-white border border-border-soft p-10 text-center">
      <div className="mx-auto h-14 w-14 grid place-items-center rounded-full bg-brand-50 text-brand-600 mb-3">
        <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <h3 className="text-[17px] font-bold text-ink">No flights match your filters</h3>
      <p className="text-[13px] text-ink-muted mt-1">
        Try clearing a filter or broaden your search.
      </p>
      <div className="mt-4">
        <Button variant="outline" onClick={onClearFilters}>Clear all filters</Button>
      </div>
    </div>
  );
}
