import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
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

    // Fetch failure reason from database for compliance check
    let tboFailureReason: string | undefined;
    try {
      const db = await getDb();
      const col = db.collection<any>("hotel_payment_records");
      if (clientReferenceId) {
        const record = await col.findOne({ clientReferenceId });
        tboFailureReason = record?.tboFailureReason;
      }
    } catch {
      // If DB lookup fails, continue without failure reason (non-blocking)
    }

    const result = await verifyBookingStatusAfterTimeout({
      bookingId,
      confirmationNo,
      firstName,
      lastName,
      traceId,
      clientReferenceId,
      endUserIp,
      tboFailureReason,
    });

    if (!result.found) {
      return err(result.error || "Booking not found", 404);
    }

    return NextResponse.json({ success: true, booking: result.booking });
  } catch (error) {
    const stack = error instanceof Error ? error.stack : String(error);
    const message = error instanceof Error ? error.message : "Verification failed";
    console.error("[API /api/hotels/book/verify] FAILED");
    console.error("  stack:", stack);
    return err(message, 500);
  }
}
