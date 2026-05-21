import { NextRequest, NextResponse } from "next/server";
import { tboPreBookHotel } from "@/lib/adapters/tbo/hotel/preBook";
import { TboError } from "@/lib/adapters/tbo/errors";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// POST /api/hotels/prebook
// Body: { bookingCode: string, paymentMode?: string }
// Called after Search to lock in the selected room rate and retrieve
// full validation rules (passport/PAN requirements, name rules, cancel policies)
// before proceeding to Book.
export async function POST(request: NextRequest) {
  let bookingCode: string | undefined;

  try {
    const body = await request.json();
    bookingCode = body?.bookingCode;

    if (!bookingCode) return err("bookingCode is required.", 400);

    const result = await tboPreBookHotel({
      bookingCode,
      paymentMode: body?.paymentMode,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    const stack = e instanceof Error ? e.stack : String(e);
    console.error("[API /api/hotels/prebook] FAILED");
    console.error("  bookingCode:", bookingCode);
    console.error("  stack:", stack);

    if (e instanceof TboError) {
      return err(`TBO error (${e.code}): ${e.message}`, 502);
    }
    const message = e instanceof Error ? e.message : "Hotel prebook failed";
    return err(message, 500);
  }
}
