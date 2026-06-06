import { NextRequest, NextResponse } from "next/server";
import { tboIssueTicket, type LccTicketInput, type NonLccTicketInput } from "@/lib/adapters/tbo/flight/ticket";
import { pollFlightBookingDetail } from "@/lib/adapters/tbo/flight/booking";
import { TboFareExpiredError, TboValidationError, isDuplicateBookingError } from "@/lib/adapters/tbo/errors";

const DUPLICATE_MSG =
  "This flight was already booked with these details recently. Please wait 24 hours or change the journey/passenger details.";

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
