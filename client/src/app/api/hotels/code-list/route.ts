import { NextRequest, NextResponse } from "next/server";
import { tboGetHotelCodeListByCity } from "@/lib/adapters/tbo/hotel/tboHotelCodeList";
import { TboNoResultsError, TboError } from "@/lib/adapters/tbo/errors";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: NextRequest) {
  const cityCode = request.nextUrl.searchParams.get("cityCode");
  const detailed = request.nextUrl.searchParams.get("detailed") === "true";
  if (!cityCode) return err("cityCode query param is required.", 400);

  try {
    const hotels = await tboGetHotelCodeListByCity(cityCode, {
      isDetailedResponse: detailed,
    });
    return NextResponse.json({ success: true, data: { hotels } });
  } catch (e) {
    const stack = e instanceof Error ? e.stack : String(e);
    console.error("[API /api/hotels/code-list] FAILED");
    console.error("  cityCode:", cityCode);
    console.error("  stack:", stack);

    if (e instanceof TboNoResultsError) {
      return err(`No hotels returned for city "${cityCode}".`, 404);
    }
    if (e instanceof TboError) {
      return err(`TBO error (${e.code}): ${e.message}`, 502);
    }
    const message = e instanceof Error ? e.message : "Hotel code list fetch failed";
    return err(message, 500);
  }
}
