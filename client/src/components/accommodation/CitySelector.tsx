"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type City = { Code: string; Name: string };

type CitiesResponse =
  | { success: true; data: { cities: City[] } }
  | { success: false; error: string };

const citiesCache = new Map<string, City[]>();
const citiesPromises = new Map<string, Promise<City[]>>();

function loadCities(countryCode: string): Promise<City[]> {
  const key = countryCode.toUpperCase();
  const cached = citiesCache.get(key);
  if (cached) return Promise.resolve(cached);
  const inflight = citiesPromises.get(key);
  if (inflight) return inflight;
  const p = fetch(`/api/hotels/cities?country=${encodeURIComponent(key)}`)
    .then((r) => r.json() as Promise<CitiesResponse>)
    .then((j) => {
      if (!j.success) throw new Error(j.error);
      citiesCache.set(key, j.data.cities);
      return j.data.cities;
    })
    .finally(() => {
      citiesPromises.delete(key);
    });
  citiesPromises.set(key, p);
  return p;
}

type Props = {
  countryCode: string | null;
  countryName: string | null;
  selectedCity: { code: string; name: string } | null;
  onChange: (city: { code: string; name: string } | null) => void;
};

export default function CitySelector({
  countryCode,
  countryName,
  selectedCity,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<City[]>(
    countryCode ? (citiesCache.get(countryCode) ?? []) : [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!countryCode) {
      setCities([]);
      setError(null);
      return;
    }
    const cached = citiesCache.get(countryCode);
    if (cached) {
      setCities(cached);
      return;
    }
    setLoading(true);
    setError(null);
    loadCities(countryCode)
      .then((list) => setCities(list))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load cities"),
      )
      .finally(() => setLoading(false));
  }, [countryCode]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filteredCities = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(
      (c) =>
        c.Name.toLowerCase().includes(q) || c.Code.toLowerCase().includes(q),
    );
  }, [cities, query]);

  const buttonText = selectedCity ? selectedCity.name : "Select city";
  const buttonSub = selectedCity ? `City code ${selectedCity.code}` : "Optional";

  const isDisabled = !countryCode;

  return (
    <div ref={wrapRef} className="relative flex flex-col gap-1">
      <span className="text-[12px] font-medium text-ink-muted">City</span>
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => !isDisabled && setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-left transition-colors",
          isDisabled
            ? "border-slate-100 bg-slate-50 text-ink-soft cursor-not-allowed"
            : "border-slate-200 hover:border-brand-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
        )}
      >
        <span className="flex min-w-0 flex-col">
          <span
            className={cn(
              "truncate text-[15px] font-bold leading-tight",
              selectedCity ? "text-ink" : "text-ink-soft",
            )}
          >
            {buttonText}
          </span>
          <span className="truncate text-[11px] text-ink-muted">
            {buttonSub}
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          width={14}
          height={14}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={cn(
            "shrink-0 text-ink-soft transition-transform duration-200",
            open && "rotate-180",
          )}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && !isDisabled ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_45px_-15px_rgba(15,23,42,0.25)]">
          <div className="p-3">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                City in {countryName}
              </span>
              <div className="relative mt-1">
                <svg
                  viewBox="0 0 24 24"
                  width={14}
                  height={14}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-soft"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3-3" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type to search cities"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-2.5 text-[13px] text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </label>
            <ul className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-slate-100">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-left text-[13px] transition-colors hover:bg-blue-50",
                    !selectedCity && "bg-blue-50 font-semibold text-brand-700",
                  )}
                >
                  <span className="truncate">Any city</span>
                </button>
              </li>
              {loading ? (
                <li className="px-3 py-2 text-[12px] text-ink-soft">
                  Loading cities…
                </li>
              ) : error ? (
                <li className="px-3 py-2 text-[12px] text-red-600">
                  {error}
                </li>
              ) : filteredCities.length === 0 ? (
                <li className="px-3 py-2 text-[12px] text-ink-soft">
                  {cities.length === 0
                    ? "No cities available"
                    : `No matches for "${query}"`}
                </li>
              ) : (
                filteredCities.slice(0, 250).map((c) => {
                  const isSelected = selectedCity?.code === c.Code;
                  return (
                    <li key={c.Code + c.Name}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange({ code: c.Code, name: c.Name });
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] transition-colors hover:bg-blue-50",
                          isSelected && "bg-blue-50 font-semibold text-brand-700",
                        )}
                      >
                        <span className="truncate">{c.Name}</span>
                        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-ink-soft">
                          {c.Code}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
