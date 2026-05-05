import "server-only";
import { withRetry, tboBase, tboApiUrl } from "../auth";
import { assertTboSuccess, TboFareExpiredError } from "../errors";
import { getTrace } from "../traceCache";
import { logRequest, logResponse, logError } from "../log";
import type { TboTicketResponse, TboFareBreakdown } from "../types";
import { type BookingPassenger, mapPassenger } from "./book";

// ─── Input types ──────────────────────────────────────────────────────────────

/**
 * LCC airlines (IsLCC: true from Search/FareQuote):
 *   No prior Book step — Ticket issues directly.
 *   Endpoint receives: ResultIndex + TraceId + Passengers[] with fare.
 *   Sample: OB Ticket.txt (6E / IndiGo).
 */
export interface LccTicketInput {
  isLCC: true;
  resultIndex: string;
  /** Explicit TraceId for serverless environments — falls back to traceCache. */
  traceId?: string;
  fareBreakdown: TboFareBreakdown[];
  passengers: BookingPassenger[];
  contactEmail: string;
  contactPhone: string;
  preferredCurrency?: string;  // defaults "INR"
}

/**
 * Non-LCC airlines (IsLCC: false from Search/FareQuote):
 *   Book must be called first to obtain BookingId.
 *   Ticket endpoint receives BookingId only.
 */
export interface NonLccTicketInput {
  isLCC: false;
  bookingId: number;
}

export type TicketInput = LccTicketInput | NonLccTicketInput;

export interface TicketResult {
  bookingId: number;
  pnr: string;
  ticketNumbers: string[];
  bookingStatus: number;
}

// ─── Shared response parser ───────────────────────────────────────────────────

function parseTicketResponse(data: TboTicketResponse, fallbackBookingId: number): TicketResult {
  const itinerary = data.Response?.FlightItinerary;
  const ticketNumbers = (itinerary?.Passenger ?? [])
    .map((p) => p.Ticket?.TicketNumber)
    .filter((t): t is string => Boolean(t));

  return {
    bookingId: itinerary?.BookingId ?? fallbackBookingId,
    pnr: itinerary?.PNR ?? "",
    ticketNumbers,
    bookingStatus: itinerary?.BookingStatus ?? 0,
  };
}

// ─── Non-LCC path ─────────────────────────────────────────────────────────────

async function tboNonLccTicket(bookingId: number): Promise<TicketResult> {
  return withRetry(async (token) => {
    const url = tboApiUrl("BookingEngineService_Air/AirService.svc/rest/Ticket");
    const reqBody = { ...tboBase(token), BookingId: bookingId };
    logRequest("Flight Ticket (Non-LCC)", url, { ...reqBody, TokenId: "***" });

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });
    } catch (err) {
      logError("Flight Ticket (Non-LCC)", err);
      throw err;
    }

    const text = await res.text();
    let data: TboTicketResponse;
    try { data = JSON.parse(text); }
    catch { throw new Error(`TBO Ticket non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`); }

    logResponse("Flight Ticket (Non-LCC)", res.status, data);
    if (!res.ok) throw new Error(`TBO Ticket (Non-LCC) HTTP ${res.status}`);
    assertTboSuccess(data.Response?.Error);

    return parseTicketResponse(data, bookingId);
  });
}

// ─── LCC path ─────────────────────────────────────────────────────────────────

async function tboLccTicket(input: LccTicketInput): Promise<TicketResult> {
  const traceId = input.traceId ?? getTrace(input.resultIndex);
  if (!traceId) throw new TboFareExpiredError();

  return withRetry(async (token) => {
    const passengers = input.passengers.map((p, i) => {
      const mapped = mapPassenger(p, i === 0, input.fareBreakdown, true);
      if (i === 0) {
        mapped.Email = input.contactEmail;
        mapped.ContactNo = input.contactPhone;
      }
      return mapped;
    });

    const url = tboApiUrl("BookingEngineService_Air/AirService.svc/rest/Ticket");
    // PreferredCurrency and IsBaseCurrencyRequired are required for LCC Ticket
    // per the certified sample (OB Ticket.txt / IB Ticket.txt).
    const reqBody = {
      PreferredCurrency: input.preferredCurrency ?? "INR",
      IsBaseCurrencyRequired: "true",
      ...tboBase(token),
      TraceId: traceId,
      ResultIndex: input.resultIndex,
      Passengers: passengers,
    };
    logRequest("Flight Ticket (LCC)", url, { ...reqBody, TokenId: "***" });

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });
    } catch (err) {
      logError("Flight Ticket (LCC)", err);
      throw err;
    }

    const text = await res.text();
    let data: TboTicketResponse;
    try { data = JSON.parse(text); }
    catch { throw new Error(`TBO Ticket (LCC) non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`); }

    logResponse("Flight Ticket (LCC)", res.status, data);
    if (!res.ok) throw new Error(`TBO Ticket (LCC) HTTP ${res.status}`);
    assertTboSuccess(data.Response?.Error);

    return parseTicketResponse(data, 0);
  });
}

// ─── Public dispatch ──────────────────────────────────────────────────────────

export async function tboIssueTicket(input: TicketInput): Promise<TicketResult> {
  if (!input.isLCC) return tboNonLccTicket(input.bookingId);
  return tboLccTicket(input);
}
