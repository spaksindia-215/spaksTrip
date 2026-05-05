import { NextRequest, NextResponse } from "next/server";
import { tboUpdateCalendarFareOfDay } from "@/lib/adapters/tbo/flight/calendarFare";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  let body: { from?: string; to?: string; cabin?: string; date?: string } | null = null;

  try {
    body = await request.json();
    console.log("[API /api/flights/calendar-fare/update] payload:", JSON.stringify(body));

    if (!body?.from || !body?.to || !body?.date) {
      return err("from, to, and date are required.", 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return err("date must be in YYYY-MM-DD format.", 400);
    }
    if (body.from === body.to) {
      return err("Origin and destination must be different.", 400);
    }

    const data = await tboUpdateCalendarFareOfDay({
      from: body.from,
      to: body.to,
      cabin: body.cabin ?? "ECONOMY",
      date: body.date,
    });

    return NextResponse.json({ success: true, data });
  } catch (e) {
    const stack = e instanceof Error ? e.stack : String(e);
    console.error("[API /api/flights/calendar-fare/update] FAILED");
    console.error("  payload:", JSON.stringify(body));
    console.error("  stack:", stack);
    const message = e instanceof Error ? e.message : "Update calendar fare failed";
    return err(message, 500);
  }
}
