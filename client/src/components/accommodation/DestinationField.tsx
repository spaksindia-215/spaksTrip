"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { AIRPORTS } from "@/lib/mock/airports";

export type Destination =
  | {
      kind: "country";
      code: string;
      name: string;
      city?: { code: string; name: string };
    }
  | { kind: "postal"; postalCode: string };

type Country = { Code: string; Name: string };
type City = { Code: string; Name: string };

type CountriesResponse =
  | { success: true; data: { countries: Country[] } }
  | { success: false; error: string };

type CitiesResponse =
  | { success: true; data: { cities: City[] } }
  | { success: false; error: string };

let countriesCache: Country[] | null = null;
let countriesPromise: Promise<Country[]> | null = null;
const citiesCache = new Map<string, City[]>();
const citiesPromises = new Map<string, Promise<City[]>>();
const COUNTRIES_API_URL = "/api/hotels/countries";
const FALLBACK_COUNTRIES: Country[] = Array.from(
  new Map(
    AIRPORTS.map((airport) => [
      airport.countryCode.toUpperCase(),
      { Code: airport.countryCode.toUpperCase(), Name: airport.country },
    ]),
  ).values(),
).sort((a, b) => a.Name.localeCompare(b.Name));

async function parseCountriesResponse(response: Response): Promise<CountriesResponse> {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to fetch countries`);
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.toLowerCase().includes("application/json")) {
    const text = await response.text();
    console.error("[DestinationField] Non-JSON countries response", {
      url: response.url || COUNTRIES_API_URL,
      status: response.status,
      contentType,
      preview: text.slice(0, 500),
    });
    throw new Error("Country list unavailable right now");
  }

  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch (error) {
    console.error("[DestinationField] Failed to parse countries JSON", {
      url: response.url || COUNTRIES_API_URL,
      status: response.status,
      contentType,
      error,
    });
    throw new Error("Invalid country list response");
  }

  if (!payload || typeof payload !== "object") {
    console.error("[DestinationField] Invalid countries payload", payload);
    throw new Error("Invalid country list response");
  }

  return payload as CountriesResponse;
}

async function parseCitiesResponse(
  response: Response,
  countryCode: string,
): Promise<CitiesResponse | { success: true; data: { cities: City[] } }> {
  if (response.status === 404) {
    console.warn("[DestinationField] No cities returned for country", {
      countryCode,
      url: response.url || `/api/hotels/cities?country=${encodeURIComponent(countryCode)}`,
      status: response.status,
    });
    return { success: true, data: { cities: [] } };
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to fetch cities`);
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.toLowerCase().includes("application/json")) {
    const text = await response.text();
    console.error("[DestinationField] Non-JSON cities response", {
      countryCode,
      url: response.url || `/api/hotels/cities?country=${encodeURIComponent(countryCode)}`,
      status: response.status,
      contentType,
      preview: text.slice(0, 500),
    });
    throw new Error("City list unavailable right now");
  }

  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch (error) {
    console.error("[DestinationField] Failed to parse cities JSON", {
      countryCode,
      url: response.url || `/api/hotels/cities?country=${encodeURIComponent(countryCode)}`,
      status: response.status,
      contentType,
      error,
    });
    throw new Error("Invalid city list response");
  }

  if (!payload || typeof payload !== "object") {
    console.error("[DestinationField] Invalid cities payload", {
      countryCode,
      payload,
    });
    throw new Error("Invalid city list response");
  }

  return payload as CitiesResponse;
}

function loadCountries(): Promise<Country[]> {
  if (countriesCache) return Promise.resolve(countriesCache);
  if (countriesPromise) return countriesPromise;
  countriesPromise = fetch(COUNTRIES_API_URL)
    .then(parseCountriesResponse)
    .then((j) => {
      if (!("success" in j)) {
        console.error("[DestinationField] Missing success flag in countries response", j);
        throw new Error("Invalid country list response");
      }
      if (!j.success) throw new Error(j.error);
      if (!Array.isArray(j.data?.countries)) {
        console.error("[DestinationField] Missing countries array in response", j);
        throw new Error("Invalid country list response");
      }
      countriesCache = j.data.countries;
      return countriesCache;
    })
    .catch((error) => {
      console.error("[DestinationField] Error loading countries", {
        url: COUNTRIES_API_URL,
        message: error instanceof Error ? error.message : String(error),
        error,
      });
      if (FALLBACK_COUNTRIES.length > 0) {
        console.warn("[DestinationField] Using fallback country list", {
          count: FALLBACK_COUNTRIES.length,
          reason: error instanceof Error ? error.message : String(error),
        });
        countriesCache = FALLBACK_COUNTRIES;
        return countriesCache;
      }
      throw error;
    })
    .finally(() => {
      countriesPromise = null;
    });
  return countriesPromise;
}

function loadCities(countryCode: string): Promise<City[]> {
  const key = countryCode.toUpperCase();
  const cached = citiesCache.get(key);
  if (cached) return Promise.resolve(cached);
  const inflight = citiesPromises.get(key);
  if (inflight) return inflight;
  const p = fetch(`/api/hotels/cities?country=${encodeURIComponent(key)}`)
    .then((r) => parseCitiesResponse(r, key))
    .then((j) => {
      if (!("success" in j)) {
        console.error("[DestinationField] Missing success flag in cities response", {
          countryCode: key,
          response: j,
        });
        throw new Error("Invalid city list response");
      }
      if (!j.success) throw new Error(j.error);
      if (!Array.isArray(j.data?.cities)) {
        console.error("[DestinationField] Missing cities array in response", {
          countryCode: key,
          response: j,
        });
        throw new Error("Invalid city list response");
      }
      citiesCache.set(key, j.data.cities);
      return j.data.cities;
    })
    .catch((error) => {
      console.error("[DestinationField] Error loading cities", {
        countryCode: key,
        message: error instanceof Error ? error.message : String(error),
        error,
      });
      throw error;
    })
    .finally(() => {
      citiesPromises.delete(key);
    });
  citiesPromises.set(key, p);
  return p;
}

type Props = {
  label?: string;
  value: Destination | null;
  onChange: (d: Destination | null) => void;
};

export default function DestinationField({
  label = "Destination",
  value,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [postal, setPostal] = useState(
    value?.kind === "postal" ? value.postalCode : "",
  );
  const [countries, setCountries] = useState<Country[]>(countriesCache ?? []);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [countriesError, setCountriesError] = useState<string | null>(null);

  const selectedCountry =
    value?.kind === "country" ? { code: value.code, name: value.name } : null;

  const [cities, setCities] = useState<City[]>(
    selectedCountry ? (citiesCache.get(selectedCountry.code) ?? []) : [],
  );
  const [loadingCities, setLoadingCities] = useState(false);
  const [citiesError, setCitiesError] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (countriesCache) {
      setCountries(countriesCache);
      return;
    }
    setLoadingCountries(true);
    setCountriesError(null);
    loadCountries()
      .then((list) => setCountries(list))
      .catch((e) =>
        setCountriesError(e instanceof Error ? e.message : "Failed to load"),
      )
      .finally(() => setLoadingCountries(false));
  }, [open]);

  useEffect(() => {
    if (!selectedCountry) {
      setCities([]);
      setCitiesError(null);
      return;
    }
    const cached = citiesCache.get(selectedCountry.code);
    if (cached) {
      setCities(cached);
      return;
    }
    setLoadingCities(true);
    setCitiesError(null);
    loadCities(selectedCountry.code)
      .then((list) => setCities(list))
      .catch((e) =>
        setCitiesError(e instanceof Error ? e.message : "Failed to load"),
      )
      .finally(() => setLoadingCities(false));
  }, [selectedCountry?.code]);

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

  const filteredCountries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.Name.toLowerCase().includes(q) || c.Code.toLowerCase().includes(q),
    );
  }, [countries, query]);

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(
      (c) =>
        c.Name.toLowerCase().includes(q) || c.Code.toLowerCase().includes(q),
    );
  }, [cities, cityQuery]);

  const buttonText =
    value?.kind === "country"
      ? value.city
        ? `${value.city.name}, ${value.name}`
        : value.name
      : value?.kind === "postal"
        ? `Postal · ${value.postalCode}`
        : "Choose country, city, or postal code";

  const buttonSub =
    value?.kind === "country"
      ? value.city
        ? `City code ${value.city.code}`
        : `Country code ${value.code} · pick a city for hotels`
      : value?.kind === "postal"
        ? "Postal code"
        : "Pick from list or type a code";

  function applyPostal() {
    const trimmed = postal.trim();
    if (!trimmed) return;
    onChange({ kind: "postal", postalCode: trimmed });
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative flex flex-col gap-1">
      <span className="text-[12px] font-medium text-ink-muted">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-left transition-colors",
          "border-slate-200 hover:border-brand-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
        )}
      >
        <span className="flex min-w-0 flex-col">
          <span
            className={cn(
              "truncate text-[15px] font-bold leading-tight",
              value ? "text-ink" : "text-ink-soft",
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

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_45px_-15px_rgba(15,23,42,0.25)]">
          <div className="border-b border-slate-100 p-3">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                Country
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
                  placeholder="Type to search countries"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-2.5 text-[13px] text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </label>
            <ul className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-slate-100">
              {loadingCountries ? (
                <li className="px-3 py-2 text-[12px] text-ink-soft">
                  Loading countries…
                </li>
              ) : countriesError ? (
                <li className="px-3 py-2 text-[12px] text-red-600">
                  {countriesError}
                </li>
              ) : filteredCountries.length === 0 ? (
                <li className="px-3 py-2 text-[12px] text-ink-soft">
                  No matches for &ldquo;{query}&rdquo;
                </li>
              ) : (
                filteredCountries.slice(0, 250).map((c) => {
                  const isSelected =
                    value?.kind === "country" && value.code === c.Code;
                  return (
                    <li key={c.Code + c.Name}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange({
                            kind: "country",
                            code: c.Code,
                            name: c.Name,
                          });
                          setPostal("");
                          setCityQuery("");
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

          {selectedCountry ? (
            <div className="border-b border-slate-100 p-3">
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                  City in {selectedCountry.name}
                </span>
                <input
                  type="text"
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  placeholder="Type to search cities (optional)"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[13px] text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </label>
              <ul className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-slate-100">
                {loadingCities ? (
                  <li className="px-3 py-2 text-[12px] text-ink-soft">
                    Loading cities…
                  </li>
                ) : citiesError ? (
                  <li className="px-3 py-2 text-[12px] text-red-600">
                    {citiesError}
                  </li>
                ) : filteredCities.length === 0 ? (
                  <li className="px-3 py-2 text-[12px] text-ink-soft">
                    {cities.length === 0
                      ? "No cities for this country"
                      : `No matches for "${cityQuery}"`}
                  </li>
                ) : (
                  filteredCities.slice(0, 250).map((c) => {
                    const isSelected =
                      value?.kind === "country" &&
                      value.city?.code === c.Code;
                    return (
                      <li key={c.Code + c.Name}>
                        <button
                          type="button"
                          onClick={() => {
                            onChange({
                              kind: "country",
                              code: selectedCountry.code,
                              name: selectedCountry.name,
                              city: { code: c.Code, name: c.Name },
                            });
                            setOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] transition-colors hover:bg-blue-50",
                            isSelected &&
                              "bg-blue-50 font-semibold text-brand-700",
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
          ) : null}

          <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
            <span className="h-px flex-1 bg-slate-200" />
            <span>Or</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="px-3 pb-3">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                Postal code
              </span>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  inputMode="text"
                  value={postal}
                  onChange={(e) => setPostal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyPostal();
                    }
                  }}
                  placeholder="e.g. 110001"
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[13px] text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  type="button"
                  onClick={applyPostal}
                  disabled={!postal.trim()}
                  className="rounded-lg bg-brand-600 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </label>
            {value ? (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setQuery("");
                  setCityQuery("");
                  setPostal("");
                }}
                className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-semibold text-ink-soft transition-colors hover:bg-slate-50"
              >
                Clear destination
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
