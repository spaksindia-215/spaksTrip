import { NextRequest, NextResponse } from "next/server";
import { tboSendChangeRequest, ChangeRequestType } from "@/lib/adapters/tbo/hotel/sendChangeRequest";
import type { SendChangeRequestInput } from "@/lib/adapters/tbo/hotel/sendChangeRequest";
import { TboError } from "@/lib/adapters/tbo/errors";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// POST /api/hotels/change-request
// Required: bookingId (integer), requestType (integer — 4 for HotelCancel)
// Optional: remarks, endUserIp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body?.bookingId == null) {
      return err("bookingId is required.", 400);
    }
    const bookingId = Number(body.bookingId);
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return err("bookingId must be a positive integer.", 400);
    }

    if (body?.requestType == null) {
      return err("requestType is required (4 = HotelCancel).", 400);
    }
    const requestType = Number(body.requestType);
    const validTypes = Object.values(ChangeRequestType) as number[];
    if (!validTypes.includes(requestType)) {
      return err(`requestType must be one of: ${validTypes.join(", ")}.`, 400);
    }

    const input: SendChangeRequestInput = {
      bookingId,
      requestType: requestType as ChangeRequestType,
      remarks: body.remarks,
      endUserIp: body.endUserIp,
    };

    const result = await tboSendChangeRequest(input);
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    const stack = e instanceof Error ? e.stack : String(e);
    console.error("[API /api/hotels/change-request] FAILED");
    console.error("  stack:", stack);

    if (e instanceof TboError) return err(`TBO error (${e.code}): ${e.message}`, 502);
    const message = e instanceof Error ? e.message : "SendChangeRequest failed";
    return err(message, 500);
  }
}
