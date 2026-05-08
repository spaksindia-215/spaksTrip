import { NextRequest, NextResponse } from "next/server";
import { tboGetAllHotelCodes } from "@/lib/adapters/tbo/hotel/hotelCodes";
import { TboNoResultsError, TboError } from "@/lib/adapters/tbo/errors";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// GET /api/hotels/all-codes
//   default       → { count, sample (first 100), fetchedAt } — cheap preview
//   ?full=true    → { count, codes, fetchedAt } — full multi-MB dump
//   ?force=true   → bypass server cache (still respects 15-day TTL otherwise)
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const wantFull = sp.get("full") === "true";
  const force = sp.get("force") === "true";

  try {
    const { codes, fetchedAt } = await tboGetAllHotelCodes({ force });
    const payload: Record<string, unknown> = {
      count: codes.length,
      fetchedAt,
    };
    if (wantFull) {
      payload.codes = codes;
    } else {
      payload.sample = codes.slice(0, 100);
    }
    return NextResponse.json({ success: true, data: payload });
  } catch (e) {
    const stack = e instanceof Error ? e.stack : String(e);
    console.error("[API /api/hotels/all-codes] FAILED");
    console.error("  stack:", stack);

    if (e instanceof TboNoResultsError) {
      return err("TBO returned no hotel codes.", 404);
    }
    if (e instanceof TboError) {
      return err(`TBO error (${e.code}): ${e.message}`, 502);
    }
    const message = e instanceof Error ? e.message : "HotelCodes fetch failed";
    return err(message, 500);
  }
}
