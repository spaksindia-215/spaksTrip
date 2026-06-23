import {
  type FlightOffer,
  type FlightSearchInput,
  type CabinClass,
} from "@/lib/mock/flights";
import { searchAirports, ensureAirportData, type Airport } from "@/lib/mock/airports";
import type { TboFareBreakdown } from "@/lib/adapters/tbo/types";
import type { FlightBooking } from "@/state/bookingStore";

// TBO is the only data source for flights. Fallback inventory has been removed.
// All calls go through Next.js /api/flights/* routes which proxy to the TBO B2B API
// server-side (credentials never leave the server).

export type SortBy = "price" | "duration" | "departure" | "arrival";

export type TimeWindow = "early" | "morning" | "afternoon" | "evening" | "night";

export type FlightFilters = {
  stops?: (0 | 1 | 2)[];
  airlines?: string[];
  departureWindows?: TimeWindow[];
  arrivalWindows?: TimeWindow[];
  maxPrice?: number;
  /** Max total trip duration in minutes. */
  maxDurationMin?: number;
  refundableOnly?: boolean;
};

/** Number of distinct active filter groups — used for the "Filters (n)" badge. */
export function countActiveFilters(f: FlightFilters): number {
  let n = 0;
  if (f.stops?.length) n += 1;
  if (f.airlines?.length) n += 1;
  if (f.departureWindows?.length) n += 1;
  if (f.arrivalWindows?.length) n += 1;
  if (typeof f.maxPrice === "number") n += 1;
  if (typeof f.maxDurationMin === "number") n += 1;
  if (f.refundableOnly) n += 1;
  return n;
}

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
    if (typeof f.maxDurationMin === "number" && o.totalDurationMin > f.maxDurationMin) return false;
    if (f.refundableOnly && !o.refundable) return false;
    if (f.departureWindows?.length) {
      const ok = f.departureWindows.some((w) => inWindow(o.segments[0].depart, w));
      if (!ok) return false;
    }
    if (f.arrivalWindows?.length) {
      const arrive = o.segments[o.segments.length - 1].arrive;
      const ok = f.arrivalWindows.some((w) => inWindow(arrive, w));
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
  isTimeChanged: boolean;
  totalFare: number;
  /** Per-pax-type fare data — must be passed in the Book/Ticket fare nodes. */
  fareBreakdown: TboFareBreakdown[];
  // PAN & Passport / Special-fare flags + airline/route context.
  isPanRequiredAtBook: boolean;
  isPanRequiredAtTicket: boolean;
  isPassportRequiredAtBook: boolean;
  isPassportRequiredAtTicket: boolean;
  isPassportFullDetailRequiredAtBook: boolean;
  isMealMandatory: boolean;
  isSeatMandatory: boolean;
  flightDetailChangeInfo: string | null;
  airlineCode: string;
  origin: string;
  destination: string;
  updatedOffer?: FlightOffer;
  /** Signed token binding totalFare → order amount (anti-tamper). "" when feature off. */
  priceToken?: string;
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

export type { SSRResult, BaggageOption, MealDynamicOption, SeatOption, NonLCCMealOption, SeatPreferenceOption } from "@/lib/adapters/tbo/flight/ssr";

export async function fetchSSR(resultIndex: string, traceId?: string): Promise<import("@/lib/adapters/tbo/flight/ssr").SSRResult> {
  const params = new URLSearchParams();
  if (traceId) params.set("traceId", traceId);
  const qs = params.size > 0 ? `?${params.toString()}` : "";
  const url = `/api/flights/${encodeURIComponent(resultIndex)}/ssr${qs}`;
  const res = await fetch(url);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.error ?? `SSR fetch failed (HTTP ${res.status})`);
  }
  return json.data;
}

export type BookingResult = {
  pnr: string;
  bookingId: number;
  returnPnr?: string;
  returnBookingId?: number;
  ticketNumbers?: string[];
};

// Builds the passengers payload for Book/Ticket from the persisted booking state.
// Does not import from server-only book.ts — shapes the same JSON the route expects.
function buildPassengers(booking: FlightBooking): unknown[] {
  return booking.travelers.map((t, idx) => {
    const ssr = booking.ssrSelections.find((s) => s.travelerId === t.id);
    const isLead = idx === 0;
    const pax: Record<string, unknown> = {
      type: t.type,
      title: t.title,
      firstName: t.firstName,
      lastName: t.lastName,
      gender: t.gender,
      dob: t.dob ?? "2000-01-01",
      // LCC lead pax needs a real address; others fall back to a placeholder.
      addressLine1: isLead ? (booking.contact.addressLine1 || "N/A") : "N/A",
      city: isLead ? (booking.contact.city || "N/A") : "N/A",
      countryCode: isLead ? (booking.contact.isoCountryCode || "IN") : "IN",
      countryName: isLead ? (booking.contact.countryName || "India") : "India",
      nationality: t.nationality ?? "IN",
    };
    if (isLead) {
      pax.email = booking.contact.email;
      pax.phone = booking.contact.phone;
    }
    if (t.passport) pax.passport = t.passport;
    if (t.passportExpiry) pax.passportExpiry = t.passportExpiry;
    if (t.passportIssueDate) pax.passportIssueDate = t.passportIssueDate;
    if (t.passportIssueCountry) pax.passportIssueCountryCode = t.passportIssueCountry;
    // PAN: Adult passes own PAN; Child/Infant pass guardian PAN + name.
    if (t.type === "ADT") {
      if (t.pan) pax.pan = t.pan;
    } else if (t.guardian && (t.guardian.firstName || t.guardian.pan)) {
      pax.guardian = t.guardian;
    }
    if (booking.isGSTMandatory && booking.gst) pax.gst = booking.gst;

    if (booking.isLCC && t.type !== "INF") {
      // KNOWN GAP (intl multi-leg): the traveller form only collects a *paid* baggage
      // pick for the first segment, so only one segment's selection is sent here.
      // Free (Price 0) baggage for every segment is still added server-side in
      // ticket.ts → applyMandatorySSR (covers the compliance requirement). Revisit
      // to let users buy extra baggage per segment when we can test a real
      // international multi-leg booking. See validation.ts applyMandatorySSR.
      pax.baggageSSR = ssr?.baggage
        ? [{ code: ssr.baggage.code, weight: ssr.baggage.weight, price: ssr.baggage.price,
             origin: ssr.baggage.origin, destination: ssr.baggage.destination,
             airlineCode: ssr.baggage.airlineCode, flightNumber: ssr.baggage.flightNumber,
             wayType: ssr.baggage.wayType }]
        : [];
      pax.mealSSR = ssr?.meal?.origin
        ? [{ code: ssr.meal.code, description: ssr.meal.description, price: ssr.meal.price,
             origin: ssr.meal.origin, destination: ssr.meal.destination,
             airlineCode: ssr.meal.airlineCode, flightNumber: ssr.meal.flightNumber }]
        : [];
    } else if (!booking.isLCC && ssr?.meal) {
      pax.mealCode = ssr.meal.code;
      pax.mealDescription = ssr.meal.description;
    }

    return pax;
  });
}

function buildValidationContext(booking: FlightBooking) {
  const lastSeg = booking.offer.segments[booking.offer.segments.length - 1];
  return {
    isLCC: booking.isLCC,
    airlineCode: booking.airlineCode ?? booking.offer.segments[0]?.airlineCode ?? "",
    origin: booking.originCode ?? booking.offer.segments[0]?.from ?? "",
    destination: booking.destinationCode ?? lastSeg?.to ?? "",
    isPanRequiredAtBook: booking.panRequiredAtBook ?? false,
    isPanRequiredAtTicket: booking.panRequiredAtTicket ?? false,
    isPassportRequiredAtBook: booking.passportRequiredAtBook ?? false,
    isPassportRequiredAtTicket: booking.passportRequiredAtTicket ?? false,
    isPassportFullDetailRequiredAtBook: booking.passportFullDetailRequiredAtBook ?? false,
  };
}

/**
 * Assembles the full booking payload that the server needs to issue the ticket
 * AFTER a verified Razorpay payment. Booking happens server-side inside
 * /api/flights/razorpay/verify-payment (issue.ts) so a verified payment is always
 * atomically paired with a Book/Ticket attempt + auto-refund on failure.
 *
 * The price the customer pays is the FareQuote price they accepted at the review
 * step; any later TBO fare change is rejected server-side and refunded.
 */
export function buildBookingPayload(booking: FlightBooking) {
  return {
    isLCC: booking.isLCC,
    resultIndex: booking.offer.id,
    traceId: booking.fareQuoteTraceId,
    fareBreakdown: booking.fareBreakdown,
    passengers: buildPassengers(booking),
    contactEmail: booking.contact.email,
    contactPhone: booking.contact.phone,
    validation: buildValidationContext(booking),
    isMealMandatory: booking.mealMandatory ?? false,
    isSeatMandatory: booking.seatMandatory ?? false,
    // Domestic return dual-PNR — present only when the offer carries an inbound leg.
    ...(booking.offer.returnResultIndex
      ? {
          returnResultIndex: booking.offer.returnResultIndex,
          returnTraceId: booking.fareQuoteTraceId,
          returnFareBreakdown: booking.fareBreakdown,
        }
      : {}),
  };
}

export async function searchAirportOptions(q: string): Promise<Airport[]> {
  // Airport autocomplete searches a local in-memory list. ensureAirportData() expands
  // that list ONCE from /api/flights/airports-data (monthly-refreshed server-side from
  // TBO's GetAirlineSectorList); every later keystroke is a local lookup, no API call.
  await ensureAirportData();
  return searchAirports(q, 12);
}

export type { FlightOffer, FlightSearchInput, CabinClass };
