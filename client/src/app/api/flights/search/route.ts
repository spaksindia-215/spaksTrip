import { NextRequest, NextResponse } from "next/server";
import { tboSearchFlights } from "@/lib/adapters/tbo/flight/search";
import { TboNoResultsError, TboError } from "@/lib/adapters/tbo/errors";
import type { TboFlightSearchInput } from "@/lib/adapters/tbo/flight/search";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  let body: TboFlightSearchInput | null = null;

  try {
    body = await request.json();
    console.log("[API /api/flights/search] payload:", JSON.stringify(body));

    if (!body?.from || !body?.to || !body?.date) {
      return err("from, to, and date are required.", 400);
    }
    if (body.from === body.to) {
      return err("Origin and destination must be different.", 400);
    }
    if (typeof body.adults !== "number" || body.adults < 1) {
      return err("adults must be a number >= 1.", 400);
    }

    // ── Search Method Validation (CLAUDE.md) ──────────────────────────────────
    // Date must be yyyy-MM-dd and not before today.
    if (!/^\d{4}-\d{2}-\d{2}/.test(body.date)) {
      return err("Invalid date format. Use yyyy-MM-dd.", 400);
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dep = new Date(`${body.date}T00:00:00`);
    if (Number.isNaN(dep.getTime())) return err("Invalid departure date.", 400);
    if (dep < today) return err("Departure date cannot be before today.", 400);

    // Return date (if present) cannot be before departure.
    const returnDate = (body as { returnDate?: string }).returnDate;
    if (returnDate) {
      const ret = new Date(`${returnDate}T00:00:00`);
      if (Number.isNaN(ret.getTime())) return err("Invalid return date.", 400);
      if (ret < dep) return err("Return date cannot be before departure date.", 400);
    }

    // Total passengers cannot exceed 9.
    const totalPax = (body.adults ?? 0) + (body.children ?? 0) + (body.infants ?? 0);
    if (totalPax > 9) return err("Total passenger count cannot be more than 9.", 400);
    // Infants cannot exceed adults.
    if ((body.infants ?? 0) > (body.adults ?? 0)) {
      return err("Number of infants cannot exceed number of adults.", 400);
    }

    const result = await tboSearchFlights(body);
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    const stack = e instanceof Error ? e.stack : String(e);
    console.error("[API /api/flights/search] FAILED");
    console.error("  payload:", JSON.stringify(body));
    console.error("  stack:", stack);

    if (e instanceof TboNoResultsError) {
      return err("No flights found for the selected criteria.", 404);
    }
    if (e instanceof TboError) {
      return err(`TBO error (${e.code}): ${e.message}`, 502);
    }
    const message = e instanceof Error ? e.message : "Flight search failed";
    return err(message, 500);
  }
}
