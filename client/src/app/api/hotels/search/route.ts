import { NextRequest, NextResponse } from "next/server";
import { tboSearchHotelsHolidays } from "@/lib/adapters/tbo/hotel/searchHolidays";
import { TboNoResultsError, TboError } from "@/lib/adapters/tbo/errors";
import type { HotelSearchInput, SearchFilters } from "@/lib/mock/hotels";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function emptySearchOk(message: string) {
  return NextResponse.json({
    success: true,
    data: {
      hotels: [],
      minPrice: 0,
      maxPrice: 0,
    },
    hotels: [],
    count: 0,
    message,
  });
}

export async function POST(request: NextRequest) {
  let body: HotelSearchInput | null = null;

  try {
    body = await request.json();
    console.log("[API /api/hotels/search] payload:", JSON.stringify(body));

    if (!body?.cityCode) return err("cityCode is required.", 400);
    if (!body?.checkIn || !body?.checkOut) return err("checkIn and checkOut are required.", 400);
    if (body.checkIn >= body.checkOut) return err("checkOut must be after checkIn.", 400);

    const input: HotelSearchInput = {
      cityCode: body.cityCode,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      rooms: body.rooms ?? 1,
      adults: body.adults ?? 1,
      children: body.children ?? 0,
      guestNationality: body.guestNationality,
      isDetailedResponse: body.isDetailedResponse,
      filters: body.filters as SearchFilters | undefined,
    };

    const result = await tboSearchHotelsHolidays(input);
    if (result.hotels.length === 0) {
      return emptySearchOk("No hotels found for the selected dates.");
    }
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    const stack = e instanceof Error ? e.stack : String(e);
    console.error("[API /api/hotels/search] FAILED");
    console.error("  payload:", JSON.stringify(body));
    console.error("  stack:", stack);

    if (e instanceof TboNoResultsError) {
      return emptySearchOk("No hotels found for the selected dates.");
    }
    if (e instanceof TboError) {
      return err(`TBO error (${e.code}): ${e.message}`, 502);
    }
    const message = e instanceof Error ? e.message : "Hotel search failed";
    return err(message, 500);
  }
}
