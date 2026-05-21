import { NextRequest, NextResponse } from "next/server";
import { tboGetHotelBookingDetail } from "@/lib/adapters/tbo/hotel/booking";
import type { GetBookingDetailInput } from "@/lib/adapters/tbo/hotel/booking";
import { TboError } from "@/lib/adapters/tbo/errors";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// POST /api/hotels/booking
// Supports all three TBO lookup modes:
//   { bookingId }                                      — by BookingId (fastest)
//   { confirmationNo, firstName, lastName }            — by ConfirmationNo + guest name
//   { traceId }                                        — by TraceId
// Optional: clientReferenceNo, endUserIp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const hasBookingId = body?.bookingId != null;
    const hasConfirmationNo = !!body?.confirmationNo;
    const hasTraceId = !!body?.traceId;

    if (!hasBookingId && !hasConfirmationNo && !hasTraceId) {
      return err("Provide at least one of: bookingId, confirmationNo, or traceId.", 400);
    }
    if (hasConfirmationNo && (!body.firstName || !body.lastName)) {
      return err("firstName and lastName are required when looking up by confirmationNo.", 400);
    }

    const input: GetBookingDetailInput = {
      bookingId: hasBookingId ? body.bookingId : undefined,
      confirmationNo: body.confirmationNo,
      firstName: body.firstName,
      lastName: body.lastName,
      traceId: body.traceId,
      clientReferenceNo: body.clientReferenceNo,
      endUserIp: body.endUserIp,
    };

    const result = await tboGetHotelBookingDetail(input);
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    const stack = e instanceof Error ? e.stack : String(e);
    console.error("[API /api/hotels/booking] FAILED");
    console.error("  stack:", stack);

    if (e instanceof TboError) return err(`TBO error (${e.code}): ${e.message}`, 502);
    const message = e instanceof Error ? e.message : "GetBookingDetail failed";
    return err(message, 500);
  }
}
