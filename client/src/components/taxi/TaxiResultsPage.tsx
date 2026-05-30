"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Drawer from "@/components/ui/Drawer";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { useTaxiSearch } from "@/hooks/taxi/useTaxiSearch";
import { parseTaxiSearchParams } from "@/lib/taxiPackage";
import type { TaxiPackage, TaxiSort } from "@/types/taxi";
import TaxiFilters from "./TaxiFilters";
import TaxiPackageCard from "./TaxiPackageCard";
import TaxiResultsSkeleton from "./TaxiResultsSkeleton";
import TaxiSearchForm from "./TaxiSearchForm";
import { SlidersIcon, StarIcon } from "./TaxiIcons";

export default function TaxiResultsPage() {
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [compare, setCompare] = useState<TaxiPackage[]>([]);
  const parsedParams = useMemo(() => parseTaxiSearchParams(searchParams), [searchParams]);
  const { status, packages, filters, setFilters, sort, setSort } = useTaxiSearch(parsedParams);

  function addCompare(pkg: TaxiPackage) {
    setCompare((current) => {
      if (current.some((item) => item.slug === pkg.slug)) return current.filter((item) => item.slug !== pkg.slug);
      return [...current, pkg].slice(-2);
    });
  }

  return (
    <main className="bg-surface-muted">
      <section className="bg-ink px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-[12px] font-bold uppercase tracking-wide text-accent-300">Taxi search results</p>
          <h1 className="mt-2 text-3xl font-extrabold">Cabs from {parsedParams.pickupCity} to {parsedParams.destination}</h1>
          <p className="mt-2 text-sm text-white/72">{parsedParams.pickupDate} at {parsedParams.pickupTime} · {parsedParams.mode.replace("-", " ")}</p>
          <div className="mt-6">
            <TaxiSearchForm initial={parsedParams} compact />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr]">
        <div className="hidden lg:block">
          <div className="sticky top-24 rounded-lg border border-border-soft bg-white p-5 shadow-[var(--shadow-xs)]">
            <TaxiFilters filters={filters} onChange={setFilters} />
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-soft bg-white p-3">
            <div>
              <p className="text-[15px] font-extrabold text-ink">{packages.length} taxi packages found</p>
              <p className="text-[12px] text-ink-muted">Transparent fares with verified cab partners</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/taxi-package/list-your-taxi" className="hidden sm:block">
                <Button type="button" variant="secondary">
                  Add Your Taxi
                </Button>
              </Link>
              <Button type="button" variant="outline" className="lg:hidden" leading={<SlidersIcon className="h-4 w-4" />} onClick={() => setDrawerOpen(true)}>
                Filters
              </Button>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as TaxiSort)}
                className="h-10 rounded-md border border-border bg-white px-3 text-[13px] font-semibold text-ink outline-none focus:border-brand-500"
                aria-label="Sort taxi packages"
              >
                <option value="recommended">Recommended</option>
                <option value="price-asc">Price low to high</option>
                <option value="price-desc">Price high to low</option>
                <option value="rating-desc">Best rated</option>
              </select>
            </div>
          </div>

          {status === "loading" ? (
            <TaxiResultsSkeleton />
          ) : packages.length === 0 ? (
            <div className="rounded-lg border border-border-soft bg-white p-8">
              <EmptyState title="No cabs match these filters" subtitle="Try a different cab type, price range, or destination." />
            </div>
          ) : (
            <div className="space-y-4">
              {packages.map((pkg) => (
                <TaxiPackageCard key={pkg.slug} pkg={pkg} search={parsedParams} onCompare={addCompare} />
              ))}
            </div>
          )}
        </div>
      </section>

      {compare.length > 0 ? (
        <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-3xl rounded-lg border border-border-soft bg-white p-3 shadow-[var(--shadow-lg)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-bold text-ink">Compare selected cabs</p>
              <p className="text-[12px] text-ink-muted">{compare.map((item) => item.cabName).join(" vs ")}</p>
            </div>
            <div className="flex gap-3">
              {compare.map((item) => (
                <span key={item.slug} className="inline-flex items-center gap-1 text-[12px] font-bold text-ink-muted">
                  <StarIcon className="h-3.5 w-3.5 text-accent-500" /> {item.rating} · ₹{item.price.toLocaleString("en-IN")}
                </span>
              ))}
              <button type="button" onClick={() => setCompare([])} className="text-[12px] font-bold text-brand-700">
                Clear
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Taxi filters" side="bottom">
        <div className="p-5">
          <TaxiFilters filters={filters} onChange={setFilters} />
        </div>
      </Drawer>
    </main>
  );
}
