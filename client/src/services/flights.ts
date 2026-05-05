import {
  type FlightOffer,
  type FlightSearchInput,
  type CabinClass,
} from "@/lib/mock/flights";
import { searchAirports, type Airport } from "@/lib/mock/airports";
import { jitter, sleep } from "./delay";

// TBO is the only data source for flights. Fallback inventory has been removed.
// All calls go through Next.js /api/flights/* routes which proxy to the TBO B2B API
// server-side (credentials never leave the server).

export type SortBy = "price" | "duration" | "departure" | "arrival";

export type FlightFilters = {
  stops?: (0 | 1 | 2)[];
  airlines?: string[];
  departureWindows?: Array<"early" | "morning" | "afternoon" | "evening" | "night">;
  maxPrice?: number;
  refundableOnly?: boolean;
};

function inWindow(iso: string, w: "early" | "morning" | "afternoon" | "evening" | "night") {
  const h = new Date(iso).getUTCHours();
  if (w === "early") return h >= 0 && h < 6;
  if (w === "morning") return h >= 6 && h < 12;
  if (w === "afternoon") return h >= 12 && h < 18;
  if (w === "evening") return h >= 18 && h < 21;
  return h >= 21 || h < 0;
}

export function applyFilters(offers: FlightOffer[], f: FlightFilters): FlightOffer[] {
  return offers.filter((o) => {
    if (f.stops?.length && !f.stops.includes(Math.min(o.stops, 2) as 0 | 1 | 2)) return false;
    if (f.airlines?.length && !f.airlines.includes(o.segments[0].airlineCode)) return false;
    if (f.maxPrice && o.basePrice > f.maxPrice) return false;
    if (f.refundableOnly && !o.refundable) return false;
    if (f.departureWindows?.length) {
      const ok = f.departureWindows.some((w) => inWindow(o.segments[0].depart, w));
      if (!ok) return false;
    }
    return true;
  });
}

export function sortOffers(offers: FlightOffer[], by: SortBy): FlightOffer[] {
  const cp = [...offers];
  switch (by) {
    case "price":
      return cp.sort((a, b) => a.basePrice - b.basePrice);
    case "duration":
      return cp.sort((a, b) => a.totalDurationMin - b.totalDurationMin);
    case "departure":
      return cp.sort(
        (a, b) => new Date(a.segments[0].depart).getTime() - new Date(b.segments[0].depart).getTime(),
      );
    case "arrival":
      return cp.sort(
        (a, b) =>
          new Date(a.segments.at(-1)!.arrive).getTime() -
          new Date(b.segments.at(-1)!.arrive).getTime(),
      );
  }
}

export async function searchFlights(
  input: FlightSearchInput,
): Promise<{ offers: FlightOffer[]; minPrice: number; maxPrice: number }> {
  const res = await fetch("/api/flights/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  let json: { success: boolean; data?: { offers: FlightOffer[]; minPrice: number; maxPrice: number }; error?: string };
  try {
    json = await res.json();
  } catch {
    throw new Error(`Flight search failed: HTTP ${res.status} (non-JSON response)`);
  }

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `Flight search failed (HTTP ${res.status})`);
  }
  return json.data!;
}

export async function getFlight(id: string): Promise<FlightOffer | null> {
  // In TBO, id === ResultIndex. FareQuote revalidates price and returns the latest offer.
  const res = await fetch(`/api/flights/${encodeURIComponent(id)}/fare-quote`);
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  if (!json?.success) return null;
  return json.data?.updatedOffer ?? null;
}

export type FareQuoteResult = {
  traceId: string;
  isLCC: boolean;
  /** Guideline §14: when true, GST details must be collected from the lead passenger. */
  isGSTMandatory: boolean;
  isPriceChanged: boolean;
  totalFare: number;
  updatedOffer?: FlightOffer;
};

export async function fetchFareQuote(
  resultIndex: string,
  traceId?: string,
  returnResultIndex?: string,
): Promise<FareQuoteResult> {
  const params = new URLSearchParams();
  if (traceId) params.set("traceId", traceId);
  // Guideline §6 (LCC special return): pass returnId so the route concatenates
  // "ob,ib" before calling TBO FareQuote with both legs in one request.
  if (returnResultIndex) params.set("returnId", returnResultIndex);
  const qs = params.size > 0 ? `?${params.toString()}` : "";
  const url = `/api/flights/${encodeURIComponent(resultIndex)}/fare-quote${qs}`;
  const res = await fetch(url);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.error ?? `FareQuote failed (HTTP ${res.status})`);
  }
  return json.data as FareQuoteResult;
}

export async function searchAirportOptions(q: string): Promise<Airport[]> {
  // Airport autocomplete uses local IATA data — TBO does not expose a faster lookup.
  await sleep(jitter(120, 60));
  return searchAirports(q, 12);
}

export type { FlightOffer, FlightSearchInput, CabinClass };
