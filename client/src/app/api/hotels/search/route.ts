import { NextRequest, NextResponse } from "next/server";
import { tboSearchHotelsHolidays } from "@/lib/adapters/tbo/hotel/searchHolidays";
import { TboNoResultsError, TboError } from "@/lib/adapters/tbo/errors";
import { validateOccupancy } from "@/lib/validators/occupancyValidation";
import type { HotelSearchInput, SearchFilters } from "@/lib/mock/hotels";
import { buildFarePricer } from "@/lib/server/agentMarkup";

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

    // Either cityCode OR hotelCodes must be provided, not both
    const hasCityCode  = !!body?.cityCode;
    const hasHotelCodes = Array.isArray(body?.hotelCodes) && body.hotelCodes.length > 0;

    if (!hasCityCode && !hasHotelCodes) {
      return err("Either cityCode or hotelCodes (non-empty array) is required.", 400);
    }
    if (hasCityCode && hasHotelCodes) {
      return err("Provide either cityCode or hotelCodes, not both.", 400);
    }

    if (!body?.checkIn || !body?.checkOut) return err("checkIn and checkOut are required.", 400);
    if (body.checkIn >= body.checkOut) return err("checkOut must be after checkIn.", 400);

    const rooms    = body.rooms    ?? 1;
    const adults   = body.adults   ?? 1;
    const children = body.children ?? 0;

    // TBO Occupancy Validation: max 8 rooms, max 10 adults per room, max 6 children per room
    const occupancyValidation = validateOccupancy(rooms, adults, children);
    if (!occupancyValidation.valid) {
      return err(occupancyValidation.error || "Invalid occupancy configuration.", 400);
    }

    const input: HotelSearchInput = {
      cityCode:           body.cityCode,
      hotelCodes:         body.hotelCodes,
      checkIn:            body.checkIn,
      checkOut:           body.checkOut,
      rooms,
      adults,
      children,
      childrenAges:       body.childrenAges,
      guestNationality:   body.guestNationality,
      isDetailedResponse: body.isDetailedResponse,
      filters:            body.filters as SearchFilters | undefined,
      distributionType:   body.distributionType ?? "b2c",
    };

    const result = await tboSearchHotelsHolidays(input);
    if (result.hotels.length === 0) {
      return emptySearchOk("No hotels found for the selected dates.");
    }

    // Fetch markup config once, then apply synchronously per room.
    const priceHotel = await buildFarePricer("hotels", request);
    for (const hotel of result.hotels) {
      for (const room of hotel.rooms) {
        room.basePrice = priceHotel(room.basePrice);
      }
      hotel.lowestPrice =
        hotel.rooms.length > 0
          ? Math.min(...hotel.rooms.map((r) => r.basePrice))
          : hotel.lowestPrice;
    }
    const prices = result.hotels.map((h) => h.lowestPrice).filter((p) => p > 0);
    result.minPrice = prices.length ? Math.min(...prices) : 0;
    result.maxPrice = prices.length ? Math.max(...prices) : 0;

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
