"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatWeekday, formatDayMonth } from "@/lib/format";
import type { CabinClass } from "@/lib/mock/flights";

type FareDay = {
  totalFare: number;
  isLowestFareOfMonth: boolean;
};

type FareCalendarDay = FareDay & {
  date: string;
};

type Props = {
  from: string;
  to: string;
  cabin: CabinClass;
  depart: string;
  onDateChange: (date: string) => void;
};

function buildDates(center: string): string[] {
  const [y, m, d] = center.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d);
  return Array.from({ length: 15 }, (_, i) => {
    const ts = base + (i - 7) * 86_400_000;
    const dt = new Date(ts);
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
  });
}

function toMonth(date: string): string {
  return date.slice(0, 7); // "YYYY-MM"
}

function formatFare(n: number): string {
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${Math.round(n / 1_000)}K`;
  return `₹${n}`;
}

export default function FareCalendar({ from, to, cabin, depart, onDateChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const days = useMemo(() => buildDates(depart), [depart]);

  const [fares, setFares] = useState<Map<string, FareDay>>(new Map());
  const [loading, setLoading] = useState(false);
  // Track which month we've loaded to avoid redundant fetches
  const loadedMonthRef = useRef<string>("");

  // Months visible in the current 15-day window (may span two months)
  const visibleMonths = useMemo(() => {
    const seen = new Set<string>();
    for (const d of days) seen.add(toMonth(d));
    return [...seen];
  }, [days]);

  useEffect(() => {
    // Re-fetch whenever route, cabin, or visible month window changes
    const key = `${from}|${to}|${cabin}|${visibleMonths.join(",")}`;
    if (loadedMonthRef.current === key) return;
    if (!from || !to || from === to) return;

    loadedMonthRef.current = key;
    setLoading(true);

    // Fetch all visible months in parallel
    Promise.all(
      visibleMonths.map((month) =>
        fetch("/api/flights/calendar-fare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from, to, cabin, month }),
        })
          .then((r) => r.json())
          .then((json): FareCalendarDay[] => (json.success ? (json.data as FareCalendarDay[]) : []))
          .catch((): FareCalendarDay[] => []),
      ),
    ).then((results) => {
      setFares((prev) => {
        const next = new Map(prev);
        for (const days of results) {
          for (const day of days) {
            next.set(day.date, { totalFare: day.totalFare, isLowestFareOfMonth: day.isLowestFareOfMonth });
          }
        }
        return next;
      });
      setLoading(false);
    });
  }, [from, to, cabin, visibleMonths]);

  // Scroll active date into view after render
  useEffect(() => {
    if (!scrollRef.current) return;
    const idx = days.findIndex((d) => d === depart);
    const el = scrollRef.current.children[idx] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [days, depart]);

  return (
    <div className="bg-white border-b border-border-soft">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div
          ref={scrollRef}
          className="flex gap-1 overflow-x-auto snap-x snap-mandatory py-3 scrollbar-none"
          style={{ scrollbarWidth: "none" }}
          role="list"
          aria-label="Fare calendar — select a date"
        >
          {days.map((date) => {
            const active = date === depart;
            const fare = fares.get(date);
            const isLowest = fare?.isLowestFareOfMonth ?? false;

            return (
              <button
                key={date}
                type="button"
                aria-pressed={active}
                aria-label={`${formatWeekday(date)} ${formatDayMonth(date)}${fare ? ` ₹${fare.totalFare}` : ""}`}
                onClick={() => !active && onDateChange(date)}
                className={[
                  "shrink-0 snap-start w-22 flex flex-col items-center gap-0.5 rounded-lg border py-2.5 px-1 transition-all",
                  active
                    ? "border-brand-600 bg-brand-50"
                    : "border-transparent hover:border-border-soft hover:bg-surface-muted cursor-pointer",
                ].join(" ")}
              >
                <span className={`text-[11px] font-semibold ${active ? "text-brand-600" : "text-ink-muted"}`}>
                  {formatWeekday(date)}
                </span>
                <span className={`text-[13px] font-bold leading-tight ${active ? "text-brand-700" : "text-ink"}`}>
                  {formatDayMonth(date)}
                </span>
                {loading && !fare ? (
                  <span className="mt-0.5 h-3.5 w-10 rounded bg-gray-200 animate-pulse" />
                ) : fare ? (
                  <span
                    className={`text-[10px] font-semibold leading-tight ${
                      active
                        ? "text-brand-600"
                        : isLowest
                          ? "text-green-600"
                          : "text-ink-muted"
                    }`}
                  >
                    {formatFare(fare.totalFare)}
                    {isLowest && !active && (
                      <span className="ml-0.5 text-[8px] align-super text-green-500">↓</span>
                    )}
                  </span>
                ) : (
                  <span className="text-[10px] text-ink-muted">—</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="pb-2 text-[10px] text-ink-muted">
          Fares shown are indicative for 1 adult. Select a date to search live inventory.
          <span className="ml-2 text-green-600">↓ lowest this month</span>
        </div>
      </div>
    </div>
  );
}
