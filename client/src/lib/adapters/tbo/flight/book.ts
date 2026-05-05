import "server-only";
import { withRetry, tboBase, tboApiUrl } from "../auth";
import { assertTboSuccess, TboFareExpiredError, TboBookingFailedError } from "../errors";
import { getTrace } from "../traceCache";
import { logRequest, logResponse, logError } from "../log";
import type { TboFlightBookResponse, TboPassengerRequest, TboFare, TboFareBreakdown } from "../types";

// ─── Input types ──────────────────────────────────────────────────────────────

export interface GSTDetails {
  companyName: string;
  gstNumber: string;
  companyAddress: string;
  companyContactNumber: string;
  companyEmail: string;
}

export interface BookingPassenger {
  type: "ADT" | "CHD" | "INF";
  title: string;               // "Mr" | "Mrs" | "Ms" | "Mstr" | "Miss"
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  dob: string;                 // "YYYY-MM-DD"
  addressLine1: string;        // required — sampleverification.html rule 5
  city: string;                // required — sampleverification.html rule 5
  countryCode?: string;        // ISO-2, defaults "IN"
  countryName?: string;        // defaults "India"
  passport?: string;
  passportExpiry?: string;     // "YYYY-MM-DD"
  nationality?: string;        // ISO-2, defaults "IN"
  email?: string;
  phone?: string;
  /** Guideline §14: required on lead pax when FareQuote returns IsGSTMandatory=true. */
  gst?: GSTDetails;
  /** LCC: per-segment baggage selections (Guideline §7). */
  baggageSSR?: Array<{
    code: string; weight: number; price: number; currency?: string;
    origin: string; destination: string; airlineCode: string;
    flightNumber: string; wayType: number;
  }>;
  /** LCC: per-segment meal selections. */
  mealSSR?: Array<{
    code: string; description?: string; price: number; currency?: string;
    origin: string; destination: string; airlineCode: string; flightNumber: string;
  }>;
  /** Non-LCC: meal preference code. */
  mealCode?: string;
  mealDescription?: string;
  /** Non-LCC: seat preference code. */
  seatCode?: string;
  seatDescription?: string;
}

export interface TboBookFlightInput {
  resultIndex: string;
  /** Explicit TraceId from FareQuote — required in serverless deployments where
   *  the in-process traceCache may not survive across request boundaries. */
  traceId?: string;
  /** FareBreakdown array from the FareQuote response.
   *  Each passenger's Fare node is derived by dividing the aggregate per pax type
   *  by PassengerCount — per TBO certification requirement (general.html §10). */
  fareBreakdown: TboFareBreakdown[];
  passengers: BookingPassenger[];
  contactEmail: string;
  contactPhone: string;
  contactCountryCode?: string;
  mealCodes?: string[];
  seatCodes?: string[];
}

export interface TboBookFlightOutput {
  bookingId: number;
  pnr: string;
  isPriceChanged: boolean;
  /** Present for domestic return dual-PNR: inbound leg booking result. */
  returnLeg?: { bookingId: number; pnr: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAX_TYPE: Record<"ADT" | "CHD" | "INF", number> = { ADT: 1, CHD: 2, INF: 3 };
const GENDER: Record<"M" | "F", number> = { M: 1, F: 2 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dobToTbo(dob: string): string {
  return dob.includes("T") ? dob : `${dob}T00:00:00`;
}

/**
 * Builds a per-passenger TboFare by dividing the FareBreakdown aggregate by
 * PassengerCount for the given PaxType.
 *
 * Formula (general.html §10):
 *   per-pax BaseFare = FareBreakdown[paxType].BaseFare / PassengerCount
 *   per-pax Tax      = FareBreakdown[paxType].Tax      / PassengerCount
 *   per-pax YQTax    = FareBreakdown[paxType].YQTax    / PassengerCount
 *
 * Exported so tboLccTicket can reuse it without duplicating logic.
 */
export function buildPassengerFare(
  fareBreakdown: TboFareBreakdown[],
  paxType: number,
): TboFare {
  const bd = fareBreakdown.find((b) => b.PassengerType === paxType);
  if (!bd) {
    return {
      Currency: "INR", BaseFare: 0, Tax: 0, TaxBreakup: [], YQTax: 0,
      AdditionalTxnFeeOfrd: 0, AdditionalTxnFeePub: 0, PGCharge: 0,
      OtherCharges: 0, ChargeBU: [], Discount: 0, PublishedFare: 0,
      CommissionEarned: 0, PLBEarned: 0, IncentiveEarned: 0, OfferedFare: 0,
      TdsOnCommission: 0, TdsOnPLB: 0, TdsOnIncentive: 0, ServiceFee: 0,
      // PGCharge is not in FareBreakdown; TboFare zero-fills it
    };
  }
  const n = Math.max(1, bd.PassengerCount);
  return {
    Currency: bd.Currency ?? "INR",
    BaseFare: bd.BaseFare / n,
    Tax: bd.Tax / n,
    TaxBreakup: [],
    YQTax: bd.YQTax / n,
    AdditionalTxnFeeOfrd: (bd.AdditionalTxnFeeOfrd ?? 0) / n,
    AdditionalTxnFeePub: (bd.AdditionalTxnFeePub ?? 0) / n,
    PGCharge: 0,
    OtherCharges: 0,
    ChargeBU: [],
    Discount: 0,
    PublishedFare: 0,
    CommissionEarned: 0,
    PLBEarned: 0,
    IncentiveEarned: 0,
    OfferedFare: 0,
    TdsOnCommission: 0,
    TdsOnPLB: 0,
    TdsOnIncentive: 0,
    ServiceFee: 0,
  };
}

/**
 * Maps a BookingPassenger to the TBO wire format.
 * Exported so tboLccTicket can reuse the same passenger-building logic.
 * Caller is responsible for setting Email and ContactNo on the lead passenger.
 *
 * Guideline §6/§7: LCC ADT/CHD must always carry Baggage/MealDynamic/SeatDynamic
 * as arrays (never null). INF passengers must not have these fields at all.
 * Non-LCC passengers never use these array fields.
 */
export function mapPassenger(
  p: BookingPassenger,
  isLead: boolean,
  fareBreakdown: TboFareBreakdown[],
  isLCC = false,
): TboPassengerRequest {
  const passenger: TboPassengerRequest = {
    Title: p.title,
    FirstName: p.firstName,
    LastName: p.lastName,
    PaxType: PAX_TYPE[p.type],
    DateOfBirth: dobToTbo(p.dob),
    Gender: GENDER[p.gender],
    PassportNo: p.passport ?? "",
    PassportExpiry: p.passportExpiry ? dobToTbo(p.passportExpiry) : "2030-01-01T00:00:00",
    AddressLine1: p.addressLine1,
    City: p.city,
    CountryCode: p.countryCode ?? "IN",
    CountryName: p.countryName ?? "India",
    Nationality: p.nationality ?? "IN",
    ContactNo: "",   // populated by caller for lead pax
    Email: "",       // populated by caller for lead pax
    IsLeadPax: isLead,
    // Guideline §14: GST fields populated only on lead pax when gst details provided;
    // all other passengers must have these as empty strings, not null.
    GSTCompanyAddress: (isLead && p.gst?.companyAddress) ? p.gst.companyAddress : "",
    GSTCompanyContactNumber: (isLead && p.gst?.companyContactNumber) ? p.gst.companyContactNumber : "",
    GSTCompanyName: (isLead && p.gst?.companyName) ? p.gst.companyName : "",
    GSTNumber: (isLead && p.gst?.gstNumber) ? p.gst.gstNumber : "",
    GSTCompanyEmail: (isLead && p.gst?.companyEmail) ? p.gst.companyEmail : "",
    Fare: buildPassengerFare(fareBreakdown, PAX_TYPE[p.type]),
  };

  // Guideline §6/§7: LCC ADT/CHD carry SSR arrays; INF must have none at all.
  if (isLCC && p.type !== "INF") {
    passenger.Baggage = (p.baggageSSR ?? []).map((b) => ({
      Code: b.code, Weight: b.weight, Price: b.price,
      Currency: b.currency ?? "INR",
      Origin: b.origin, Destination: b.destination,
      AirlineCode: b.airlineCode, FlightNumber: b.flightNumber,
      WayType: b.wayType, Description: 0,
    }));
    passenger.MealDynamic = (p.mealSSR ?? []).map((m) => ({
      Code: m.code, AirlineDescription: m.description ?? "",
      Price: m.price, Currency: m.currency ?? "INR",
      Origin: m.origin, Destination: m.destination,
      AirlineCode: m.airlineCode, FlightNumber: m.flightNumber,
      WayType: 1, Quantity: 1, Description: 0,
    }));
    passenger.SeatDynamic = [];
  }

  // Non-LCC: meal and seat preference codes (Guideline §8).
  if (!isLCC && p.mealCode) {
    passenger.Meal = { Code: p.mealCode, Description: p.mealDescription ?? "" };
  }
  if (!isLCC && p.seatCode) {
    passenger.Seat = { Code: p.seatCode, Description: p.seatDescription ?? "" };
  }

  return passenger;
}

// ─── Public ───────────────────────────────────────────────────────────────────

export async function tboBookFlight(input: TboBookFlightInput): Promise<TboBookFlightOutput> {
  const traceId = input.traceId ?? getTrace(input.resultIndex);
  if (!traceId) throw new TboFareExpiredError();

  const doBook = async (token: string): Promise<TboBookFlightOutput> => {
    const passengers: TboPassengerRequest[] = input.passengers.map((p, i) => {
      const mapped = mapPassenger(p, i === 0, input.fareBreakdown, false);
      if (i === 0) {
        mapped.Email = input.contactEmail;
        mapped.ContactNo = input.contactPhone;
      }
      return mapped;
    });

    const url = tboApiUrl("BookingEngineService_Air/AirService.svc/rest/Book");
    const reqBody = {
      ...tboBase(token),
      ResultIndex: input.resultIndex,
      TraceId: traceId,
      Passengers: passengers,
    };
    logRequest("Flight Book", url, { ...reqBody, TokenId: "***" });

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });
    } catch (err) {
      logError("Flight Book", err);
      throw err;
    }

    const text = await res.text();
    let data: TboFlightBookResponse;
    try { data = JSON.parse(text); }
    catch { throw new Error(`TBO Book non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`); }

    logResponse("Flight Book", res.status, data);
    if (!res.ok) throw new Error(`TBO Book HTTP ${res.status}`);
    assertTboSuccess(data.Response?.Error);

    const itinerary = data.Response?.FlightItinerary;
    if (!itinerary?.BookingId) throw new TboBookingFailedError("No BookingId returned");

    return {
      bookingId: itinerary.BookingId,
      pnr: itinerary.PNR ?? "",
      isPriceChanged: itinerary.IsPriceChanged ?? false,
    };
  };

  try {
    return await withRetry(doBook);
  } catch (err) {
    if (err instanceof TboBookingFailedError) {
      return withRetry(doBook);
    }
    throw err;
  }
}
