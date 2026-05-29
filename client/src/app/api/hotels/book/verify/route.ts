import { NextRequest, NextResponse } from "next/server";
import { verifyBookingStatusAfterTimeout } from "@/lib/adapters/tbo/hotel/bookingRecovery";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// POST /api/hotels/book/verify
// Used after booking request timeout to verify if booking was created at TBO
// Can query by: bookingId, confirmationNo, or clientReferenceId
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { bookingId, confirmationNo, firstName, lastName, traceId, clientReferenceId, endUserIp } = body;

    if (!bookingId && !confirmationNo && !traceId) {
      return err("Provide at least one of: bookingId, confirmationNo, or traceId", 400);
    }

    if (confirmationNo && (!firstName || !lastName)) {
      return err("firstName and lastName are required when querying by confirmationNo", 400);
    }

    const result = await verifyBookingStatusAfterTimeout({
      bookingId,
      confirmationNo,
      firstName,
      lastName,
      traceId,
      clientReferenceId,
      endUserIp,
    });

    if (!result.found) {
      return err(result.error || "Booking not found", 404);
    }

    return NextResponse.json({ success: true, booking: result.booking });
  } catch (err) {
    const stack = err instanceof Error ? err.stack : String(err);
    const message = err instanceof Error ? err.message : "Verification failed";
    console.error("[API /api/hotels/book/verify] FAILED");
    console.error("  stack:", stack);
    return err(message, 500);
  }
}
