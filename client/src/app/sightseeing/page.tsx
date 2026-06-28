"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import EmptyState from "@/components/ui/EmptyState";
import { browseSightseeing, type SightseeingFilters } from "@/lib/sightseeingClient";
import type { SightseeingListingApi } from "@/lib/partnerClient";
import { SIGHTSEEING_CATEGORIES, CATEGORY_LABELS } from "@/lib/sightseeingForm";

function priceLabel(item: SightseeingListingApi): string {
  const v = item.pricing?.adult ?? item.pricing?.groupPrice;
  if (v === undefined) return "Enquire";
  return `From ${item.currency} ${v.toLocaleString("en-IN")}`;
}

export default function SightseeingLandingPage() {
  const [items, setItems] = useState<SightseeingListingApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [q, setQ] = useState("");
  const [island, setIsland] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SightseeingFilters["sort"]>("newest");

  const load = useCallback(async (filters: SightseeingFilters) => {
    setLoading(true);
    setError(null);
    try {
      const res = await browseSightseeing(filters);
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load activities.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load({ sort: "newest" });
  }, [load]);

  function applyFilters() {
    void load({
      q: q.trim() || undefined,
      island: island.trim() || undefined,
      category: category || undefined,
      sort,
    });
  }

  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-[28px] font-extrabold">SightSeeing</h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          Discover tours, activities and experiences. Enquire with the operator to book.
        </p>

        {/* Search & filters */}
        <section className="mt-6 grid gap-3 rounded-2xl border border-border-soft bg-surface-muted p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input id="ss-q" label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Dolphin cruise" />
          <Input id="ss-island" label="Island / City" value={island} onChange={(e) => setIsland(e.target.value)} placeholder="Havelock" />
          <Select id="ss-category" label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {SIGHTSEEING_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </Select>
          <Select id="ss-sort" label="Sort" value={sort} onChange={(e) => setSort(e.target.value as SightseeingFilters["sort"])}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </Select>
          <div className="flex items-end">
            <Button type="button" variant="accent" fullWidth onClick={applyFilters}>Search</Button>
          </div>
        </section>

        {/* Results */}
        <section className="mt-8">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-surface-sunken" />
              ))}
            </div>
          ) : error ? (
            <EmptyState title="Something went wrong" subtitle={error} />
          ) : items.length === 0 ? (
            <EmptyState title="No activities found" subtitle="Try a different search or check back soon." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/sightseeing/${item.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border-soft bg-white shadow-(--shadow-xs) transition hover:shadow-(--shadow-pop)"
                >
                  {item.images[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.images[0].url} alt={item.title} className="h-44 w-full object-cover" />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-surface-muted text-sm text-ink-muted">No image</div>
                  )}
                  <div className="space-y-2 p-4">
                    <span className="inline-block rounded-full bg-accent-50 px-2.5 py-0.5 text-[11px] font-semibold text-accent-700">
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </span>
                    <h2 className="line-clamp-1 text-[16px] font-bold text-ink">{item.title}</h2>
                    <p className="text-[13px] text-ink-muted">{item.location?.island ?? "—"}</p>
                    <p className="pt-1 text-[15px] font-extrabold text-ink">{priceLabel(item)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
