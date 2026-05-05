import { NextRequest, NextResponse } from "next/server";
import { tboGetCalendarFare } from "@/lib/adapters/tbo/flight/calendarFare";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  let body: { from?: string; to?: string; cabin?: string; month?: string } | null = null;

  try {
    body = await request.json();
    console.log("[API /api/flights/calendar-fare] payload:", JSON.stringify(body));

    if (!body?.from || !body?.to || !body?.month) {
      return err("from, to, and month are required.", 400);
    }
    if (!/^\d{4}-\d{2}$/.test(body.month)) {
      return err("month must be in YYYY-MM format.", 400);
    }
    if (body.from === body.to) {
      return err("Origin and destination must be different.", 400);
    }

    const data = await tboGetCalendarFare({
      from: body.from,
      to: body.to,
      cabin: body.cabin ?? "ECONOMY",
      month: body.month,
    });

    return NextResponse.json({ success: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // TBO calendar fare is domestic-only; international routes return HTTP 400 / error codes.
    // Treat these as empty rather than hard errors so the calendar still renders date labels.
    const isDomesticOnlyError =
      msg.includes("HTTP 400") ||
      msg.includes("non-JSON") ||
      msg.includes("ErrorCode") ||
      msg.includes("ResponseStatus");
    if (isDomesticOnlyError) {
      console.warn("[API /api/flights/calendar-fare] TBO rejected (likely international route):", msg);
      return NextResponse.json({ success: true, data: [] });
    }
    const stack = e instanceof Error ? e.stack : String(e);
    console.error("[API /api/flights/calendar-fare] FAILED");
    console.error("  payload:", JSON.stringify(body));
    console.error("  stack:", stack);
    return err(msg, 500);
  }
}
