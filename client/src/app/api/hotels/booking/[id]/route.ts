import { NextRequest, NextResponse } from "next/server";
import { tboGetHotelBookingDetail } from "@/lib/adapters/tbo/hotel/booking";
import { TboError } from "@/lib/adapters/tbo/errors";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// GET /api/hotels/booking/:id
// Lookup a booking by BookingId (fastest path, from Book response).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) return err("bookingId is required.", 400);

    const bookingId = Number(decodeURIComponent(id));
    if (!Number.isFinite(bookingId)) return err("bookingId must be a number.", 400);

    const result = await tboGetHotelBookingDetail({ bookingId });
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    const stack = e instanceof Error ? e.stack : String(e);
    console.error("[API /api/hotels/booking/:id] FAILED");
    console.error("  stack:", stack);

    if (e instanceof TboError) return err(`TBO error (${e.code}): ${e.message}`, 502);
    const message = e instanceof Error ? e.message : "GetBookingDetail failed";
    return err(message, 500);
  }
}
