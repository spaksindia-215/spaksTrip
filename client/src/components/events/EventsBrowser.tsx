"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import EventCard from "@/components/events/EventCard";
import EmptyState from "@/components/ui/EmptyState";
import { eventsService, type EventCard as EventCardType, type EventFilters } from "@/services/events";

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All categories" },
  { value: "concert", label: "Concerts" },
  { value: "comedy_show", label: "Comedy" },
  { value: "theatre", label: "Theatre" },
  { value: "workshop", label: "Workshops" },
  { value: "food_festival", label: "Food & Drink" },
  { value: "nightlife", label: "Nightlife" },
  { value: "sports", label: "Sports" },
  { value: "exhibition", label: "Exhibitions" },
  { value: "conference", label: "Conferences" },
];

const PRICE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Any price" },
  { value: "free", label: "Free only" },
  { value: "paid", label: "Paid only" },
];

export default function EventsBrowser() {
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<EventCardType[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const filters: EventFilters = { page, limit: 12 };
    if (city.trim()) filters.city = city.trim();
    if (category) filters.category = category;
    if (price === "free") filters.isFree = true;
    if (price === "paid") filters.isFree = false;
    try {
      const res = await eventsService.list(filters);
      setItems(res.items);
      setTotalPages(res.pagination.totalPages || 1);
    } catch {
      setError("We couldn't load events right now. Please try again.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [city, category, price, page]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [city, category, price]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce the city text input
    return () => clearTimeout(t);
  }, [load]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Search by city (e.g. Mumbai)"
          className="w-full flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-[#0E1E3A] outline-none focus:border-[#C5A572]"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-[#0E1E3A] outline-none focus:border-[#C5A572] sm:w-48"
        >
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-[#0E1E3A] outline-none focus:border-[#C5A572] sm:w-40"
        >
          {PRICE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-sm text-red-700">
            {error}
            <button onClick={load} className="ml-2 font-semibold underline">
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No events found"
            emoji="🍂"
            subtitle="Try a different city or category."
            cta={
              <Link href="/events/services" className="font-semibold text-[#C5A572] underline">
                Plan a private event with us
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((card) => (
                <EventCard key={`${card.source}-${card.id}`} card={card} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-[#0E1E3A] disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-[#0E1E3A] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
