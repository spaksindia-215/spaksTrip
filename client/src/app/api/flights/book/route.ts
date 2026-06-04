import { NextRequest, NextResponse } from "next/server";
import { tboBookFlight } from "@/lib/adapters/tbo/flight/book";
import { TboFareExpiredError, TboBookingFailedError, TboValidationError } from "@/lib/adapters/tbo/errors";
import type { TboBookFlightInput } from "@/lib/adapters/tbo/flight/book";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const body: TboBookFlightInput & { returnResultIndex?: string; returnTraceId?: string; returnFareBreakdown?: TboBookFlightInput["fareBreakdown"] } = await request.json();

    if (!body?.resultIndex) return err("resultIndex is required.", 400);
    if (!body?.passengers?.length) return err("At least one passenger is required.", 400);
    if (!body?.contactEmail) return err("contactEmail is required.", 400);
    if (!body?.fareBreakdown?.length) {
      return err("fareBreakdown is required (from FareQuote response).", 400);
    }

    // Book outbound leg.
    const obResult = await tboBookFlight(body);

    // Domestic return dual-PNR (Guideline §5): book inbound leg independently.
    if (body.returnResultIndex) {
      const ibResult = await tboBookFlight({
        ...body,
        resultIndex: body.returnResultIndex,
        traceId: body.returnTraceId ?? body.traceId,
        fareBreakdown: body.returnFareBreakdown ?? body.fareBreakdown,
      });
      return NextResponse.json({
        success: true,
        data: {
          ...obResult,
          returnLeg: { bookingId: ibResult.bookingId, pnr: ibResult.pnr },
        },
      });
    }

    return NextResponse.json({ success: true, data: obResult });
  } catch (e) {
    if (e instanceof TboValidationError) {
      return err(e.message, 422);
    }
    if (e instanceof TboFareExpiredError) {
      return err("Fare has expired. Please search again.", 410);
    }
    if (e instanceof TboBookingFailedError) {
      return err(e.message, 422);
    }
    const message = e instanceof Error ? e.message : "Booking failed";
    return err(message, 500);
  }
}
