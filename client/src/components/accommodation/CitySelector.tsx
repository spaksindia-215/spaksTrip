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
    .then(async (r) => {
      // Treat 404 (no cities for country) as an empty result, not an error.
      if (r.status === 404) {
        const empty: City[] = [];
        citiesCache.set(key, empty);
        return { __handled: true, cities: empty } as const;
      }
      if (!r.ok) {
        throw new Error(`HTTP ${r.status}: Failed to fetch cities`);
      }
      return (await r.json()) as CitiesResponse;
    })
    .then((j) => {
      console.log(`[CitySelector] API response for ${key}:`, j);

      if (j && typeof j === 'object' && '__handled' in j) {
        return j.cities;
      }

      if (!j || typeof j !== 'object') {
        throw new Error('Invalid response: expected object');
      }

      if ('success' in j && !j.success) {
        throw new Error(j.error || 'Unknown error from API');
      }

      if (!('data' in j) || !j.data || !Array.isArray(j.data.cities)) {
        console.warn(`[CitySelector] Unexpected response structure for ${key}:`, j);
        throw new Error('Invalid response: expected data.cities array');
      }
      
      const cities = j.data.cities.filter((c): c is City => {
        return c && typeof c === 'object' && 'Code' in c && 'Name' in c && 
               typeof c.Code === 'string' && typeof c.Name === 'string';
      });
      
      console.log(`[CitySelector] Filtered ${cities.length} valid cities for ${key}`);
      citiesCache.set(key, cities);
      return cities;
    })
    .catch((error) => {
      console.error(`[CitySelector] Error loading cities for ${key}:`, error);
      throw error;
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
  const [cities, setCities] = useState<City[]>(() => {
    if (!countryCode) return [];
    const cached = citiesCache.get(countryCode.toUpperCase());
    return Array.isArray(cached) ? cached : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCity || cities.length === 0) return;
    const exists = cities.some(
      (c) => String(c?.Code ?? "").toUpperCase() === selectedCity.code.toUpperCase(),
    );
    if (!exists) {
      console.warn(
        `[CitySelector] Selected city ${selectedCity.code} not in option list — clearing.`,
      );
      onChange(null);
    }
  }, [cities, selectedCity, onChange]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery("");
    if (!countryCode) {
      setCities([]);
      setError(null);
      return;
    }
    const key = countryCode.toUpperCase();
    const cached = citiesCache.get(key);
    if (cached && Array.isArray(cached)) {
      console.log(`[CitySelector] Using cached cities for ${key}`);
      setCities(cached);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    loadCities(countryCode)
      .then((list) => {
        const safeList = Array.isArray(list) ? list : [];
        console.log(`[CitySelector] Loaded ${safeList.length} cities for ${key}`, safeList.slice(0, 3));
        setCities(safeList);
        setError(null);
      })
      .catch((e) => {
        console.error(`[CitySelector] Caught error loading cities:`, e);
        setCities([]);
        setError("Cities unavailable right now");
      })
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
    const safeCities = Array.isArray(cities) ? cities : [];
    const valid = safeCities.filter(
      (c): c is City =>
        !!c &&
        typeof c === "object" &&
        typeof c.Code === "string" &&
        typeof c.Name === "string",
    );
    const q = query.trim().toLowerCase();
    if (!q) return valid;
    return valid.filter(
      (c) =>
        (c.Name?.toLowerCase().includes(q) ?? false) ||
        (c.Code?.toLowerCase().includes(q) ?? false),
    );
  }, [cities, query]);

  const buttonText = selectedCity?.name ?? "Select city";
  const buttonSub = selectedCity?.code ? `City code ${selectedCity.code}` : "Optional";

  const isDisabled = !countryCode;

  return (
    <div ref={wrapRef} className="relative flex flex-col gap-1">
      <span className="text-[12px] font-medium text-ink-muted">City</span>
      <button
        type="button"
        onClick={() => {
          if (!isDisabled) {
            setOpen((o) => !o);
          }
        }}
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
                <li className="px-3 py-2 text-[12px] text-ink-soft">
                  {error}. You can still continue without selecting a city.
                </li>
              ) : filteredCities.length === 0 ? (
                <li className="px-3 py-2 text-[12px] text-ink-soft">
                  {(cities?.length ?? 0) === 0
                    ? "No cities available"
                    : `No matches for "${query}"`}
                </li>
              ) : (
                filteredCities.slice(0, 250).map((c, idx) => {
                  if (!c || typeof c !== 'object' || !c.Code || !c.Name) {
                    return null;
                  }
                  // Normalize comparison: both should be uppercase strings
                  const normalizedSelectedCode = selectedCity?.code?.toUpperCase() ?? '';
                  const normalizedCityCode = String(c.Code).toUpperCase();
                  const isSelected = normalizedSelectedCode && normalizedSelectedCode === normalizedCityCode;
                  
                  return (
                    <li key={`${c.Code}-${c.Name}-${idx}`}>
                      <button
                        type="button"
                        onClick={() => {
                          // Store in lowercase to match component's expected format
                          const cityCode = String(c.Code).toUpperCase();
                          const cityName = String(c.Name);
                          console.log(`[CitySelector] Selected city: ${cityCode} - ${cityName}`);
                          onChange({ code: cityCode, name: cityName });
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
