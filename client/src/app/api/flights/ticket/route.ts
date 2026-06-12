import { NextRequest, NextResponse } from "next/server";
import { tboIssueTicket, type LccTicketInput, type NonLccTicketInput } from "@/lib/adapters/tbo/flight/ticket";
import { pollFlightBookingDetail } from "@/lib/adapters/tbo/flight/booking";
import { TboFareExpiredError, TboValidationError, isDuplicateBookingError } from "@/lib/adapters/tbo/errors";
import { buildTwoTierPricing, type TwoTierPricing } from "@/lib/server/agentMarkup";
import type { TboFareBreakdown } from "@/lib/adapters/tbo/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

function tboFareFrom(fareBreakdown: TboFareBreakdown[], extra?: TboFareBreakdown[]): number {
  const sum = (fbd: TboFareBreakdown[]) =>
    fbd.reduce((acc, bd) => acc + bd.BaseFare + bd.Tax + bd.YQTax, 0);
  return sum(fareBreakdown) + (extra ? sum(extra) : 0);
}

async function recordFlightBooking(agentId: string, pnr: string, pricing: TwoTierPricing): Promise<void> {
  try {
    await fetch(new URL("/api/internal/record-booking", API_BASE), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agentId, productType: "flight", pnr, ...pricing }),
    });
  } catch {
    // fire-and-forget — attribution loss is tolerable vs blocking the user
  }
}

const DUPLICATE_MSG =
  "This flight was already booked with these details recently. Please wait 5 days or change the journey/passenger details.";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── LCC path ─────────────────────────────────────────────────────────────
    // isLCC=true: no prior Book step — Ticket issues directly from ResultIndex.
    if (body?.isLCC === true) {
      if (!body.resultIndex) return err("resultIndex is required for LCC ticket.", 400);
      if (!body.passengers?.length) return err("passengers array is required.", 400);
      if (!body.fareBreakdown?.length) return err("fareBreakdown is required.", 400);
      if (!body.contactEmail) return err("contactEmail is required.", 400);
      if (!body.contactPhone) return err("contactPhone is required.", 400);

      const obInput: LccTicketInput = {
        isLCC: true,
        resultIndex: body.resultIndex,
        traceId: body.traceId ?? undefined,
        fareBreakdown: body.fareBreakdown,
        passengers: body.passengers,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        preferredCurrency: body.preferredCurrency ?? "INR",
        isMealMandatory: body.isMealMandatory ?? false,
        isSeatMandatory: body.isSeatMandatory ?? false,
        isPriceChangedAccepted: body.isPriceChangedAccepted ?? false,
        validation: body.validation,
      };

      const ticketResult = await tboIssueTicket(obInput);
      // Guard: never poll GetBookingDetails with a missing booking reference.
      if (!ticketResult.bookingId) {
        return err("Ticket did not return a booking reference. Check your booking queue before retrying to avoid a duplicate.", 502);
      }
      const detail = await pollFlightBookingDetail(ticketResult.bookingId, ticketResult.pnr || undefined);

      // Domestic return dual-PNR: ticket the inbound leg independently.
      let returnLeg: { bookingId: number; pnr: string; isPriceChanged: boolean } | undefined;
      if (body.returnResultIndex) {
        const ibInput: LccTicketInput = {
          ...obInput,
          resultIndex: body.returnResultIndex,
          traceId: body.returnTraceId ?? body.traceId ?? undefined,
          fareBreakdown: body.returnFareBreakdown ?? body.fareBreakdown,
        };
        const ibResult = await tboIssueTicket(ibInput);
        returnLeg = { bookingId: ibResult.bookingId, pnr: ibResult.pnr, isPriceChanged: ibResult.isPriceChanged };
      }

      // Subdomain attribution: record booking against the agent.
      const agentId = request.headers.get("x-agent-id");
      if (agentId) {
        const rawFare = tboFareFrom(body.fareBreakdown, body.returnFareBreakdown);
        void buildTwoTierPricing(rawFare, "flights", request).then((pricing) => {
          if (pricing) {
            return recordFlightBooking(agentId, ticketResult.pnr || detail.pnr, pricing);
          }
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          bookingId: ticketResult.bookingId,
          pnr: ticketResult.pnr || detail.pnr,
          ticketNumbers: ticketResult.ticketNumbers,
          bookingStatus: detail.bookingStatus,
          isPriceChanged: ticketResult.isPriceChanged,
          isTimeChanged: ticketResult.isTimeChanged,
          ...(returnLeg ? { returnLeg } : {}),
        },
      });
    }

    // ── Non-LCC path ──────────────────────────────────────────────────────────
    // isLCC=false (or unset): Book was called first and returned a BookingId.
    const bookingId = Number(body?.bookingId);
    if (!bookingId || isNaN(bookingId)) {
      return err("bookingId is required for non-LCC ticket.", 400);
    }

    const obInput: NonLccTicketInput = {
      isLCC: false,
      bookingId,
      pnr: body.pnr || undefined,
      isPriceChangedAccepted: body.isPriceChangedAccepted ?? false,
    };
    const ticketResult = await tboIssueTicket(obInput);
    const detail = await pollFlightBookingDetail(bookingId, ticketResult.pnr || body.pnr || undefined);

    // Domestic return dual-PNR: ticket the inbound booking.
    let returnLeg: { bookingId: number; pnr: string; isPriceChanged: boolean } | undefined;
    if (body.returnBookingId) {
      const ibInput: NonLccTicketInput = {
        isLCC: false,
        bookingId: Number(body.returnBookingId),
        pnr: body.returnPnr || undefined,
        isPriceChangedAccepted: body.isPriceChangedAccepted ?? false,
      };
      const ibResult = await tboIssueTicket(ibInput);
      returnLeg = { bookingId: ibResult.bookingId, pnr: ibResult.pnr, isPriceChanged: ibResult.isPriceChanged };
    }

    // Subdomain attribution: optional fareBreakdown from client enables full two-tier recording.
    const agentId = request.headers.get("x-agent-id");
    if (agentId && (body as Record<string, unknown>).fareBreakdown) {
      const fareBreakdown = (body as Record<string, unknown>).fareBreakdown as TboFareBreakdown[];
      const returnFareBreakdown = (body as Record<string, unknown>).returnFareBreakdown as TboFareBreakdown[] | undefined;
      const rawFare = tboFareFrom(fareBreakdown, returnFareBreakdown);
      void buildTwoTierPricing(rawFare, "flights", request).then((pricing) => {
        if (pricing) {
          return recordFlightBooking(agentId, ticketResult.pnr || body.pnr || detail.pnr, pricing);
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId,
        pnr: ticketResult.pnr || detail.pnr,
        ticketNumbers: ticketResult.ticketNumbers,
        bookingStatus: detail.bookingStatus,
        isPriceChanged: ticketResult.isPriceChanged,
        isTimeChanged: ticketResult.isTimeChanged,
        ...(returnLeg ? { returnLeg } : {}),
      },
    });
  } catch (e) {
    if (e instanceof TboValidationError) {
      return err(e.message, 422);
    }
    if (e instanceof TboFareExpiredError) {
      return err("Fare has expired. Please search again.", 410);
    }
    const message = e instanceof Error ? e.message : "Ticket issuance failed";
    if (isDuplicateBookingError(message)) {
      return err(DUPLICATE_MSG, 409);
    }
    return err(message, 500);
  }
}
