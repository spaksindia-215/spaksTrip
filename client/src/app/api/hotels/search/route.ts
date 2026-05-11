import { NextRequest, NextResponse } from "next/server";
import { tboSearchHotelsHolidays } from "@/lib/adapters/tbo/hotel/searchHolidays";
import { TboNoResultsError, TboError } from "@/lib/adapters/tbo/errors";
import type { HotelSearchInput } from "@/lib/mock/hotels";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  let body: HotelSearchInput | null = null;

  try {
    body = await request.json();
    console.log("[API /api/hotels/search] payload:", JSON.stringify(body));

    if (!body?.cityCode) return err("cityCode is required.", 400);
    if (!body?.checkIn || !body?.checkOut) return err("checkIn and checkOut are required.", 400);
    if (body.checkIn >= body.checkOut) return err("checkOut must be after checkIn.", 400);

    const result = await tboSearchHotelsHolidays(body);
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    const stack = e instanceof Error ? e.stack : String(e);
    console.error("[API /api/hotels/search] FAILED");
    console.error("  payload:", JSON.stringify(body));
    console.error("  stack:", stack);

    if (e instanceof TboNoResultsError) {
      return err("No hotels found for the selected criteria.", 404);
    }
    if (e instanceof TboError) {
      return err(`TBO error (${e.code}): ${e.message}`, 502);
    }
    const message = e instanceof Error ? e.message : "Hotel search failed";
    return err(message, 500);
  }
}
