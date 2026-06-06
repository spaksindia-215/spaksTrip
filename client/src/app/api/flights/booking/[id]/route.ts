import { NextRequest, NextResponse } from "next/server";
import { tboGetFlightBookingDetail } from "@/lib/adapters/tbo/flight/booking";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const bookingId = Number(id);
    if (!bookingId || isNaN(bookingId)) return err("bookingId must be a number.", 400);

    // Optional ?pnr= ties the lookup to its PNR (matches the certified sample).
    const pnr = req.nextUrl.searchParams.get("pnr") || undefined;
    const result = await tboGetFlightBookingDetail(bookingId, pnr);
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "GetBookingDetail failed";
    return err(message, 500);
  }
}
