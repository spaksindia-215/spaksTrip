import { NextRequest, NextResponse } from "next/server";
import { tboGetStaticHotelDetails } from "@/lib/adapters/tbo/hotel/staticHotelDetails";
import { TboError } from "@/lib/adapters/tbo/errors";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// GET /api/hotels/static-details?hotelCode=1000000&language=EN&isRoomDetailRequired=true
// Mirrors TBO Hoteldetails (static catalog) — POST {TBOHolidays}/Hoteldetails.
// Request fields per doc: Hotelcodes, Language, IsRoomDetailRequired.
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const hotelCode = sp.get("hotelCode");
  if (!hotelCode) return err("hotelCode query param is required.", 400);

  const language = sp.get("language") ?? "EN";
  const isRoomDetailRequiredRaw = sp.get("isRoomDetailRequired");
  const isRoomDetailRequired =
    isRoomDetailRequiredRaw == null ? true : isRoomDetailRequiredRaw !== "false";

  try {
    const detail = await tboGetStaticHotelDetails(hotelCode, {
      language,
      isRoomDetailRequired,
    });
    if (!detail) return err(`No hotel details for "${hotelCode}".`, 404);
    return NextResponse.json({ success: true, data: detail });
  } catch (e) {
    const stack = e instanceof Error ? e.stack : String(e);
    console.error("[API /api/hotels/static-details] FAILED");
    console.error("  hotelCode:", hotelCode);
    console.error("  stack:", stack);

    if (e instanceof TboError) {
      return err(`TBO error (${e.code}): ${e.message}`, 502);
    }
    const message = e instanceof Error ? e.message : "Hotel details fetch failed";
    return err(message, 500);
  }
}
