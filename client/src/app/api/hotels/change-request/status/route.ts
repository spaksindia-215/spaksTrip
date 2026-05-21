import { NextRequest, NextResponse } from "next/server";
import { tboGetChangeRequestStatus } from "@/lib/adapters/tbo/hotel/sendChangeRequest";
import type { GetChangeRequestStatusInput } from "@/lib/adapters/tbo/hotel/sendChangeRequest";
import { TboError } from "@/lib/adapters/tbo/errors";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// POST /api/hotels/change-request/status
// Required: changeRequestId (integer — from SendChangeRequest response)
// Optional: endUserIp
// Returns: changeRequestStatus, responseStatus, refundAmount, cancellationCharge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body?.changeRequestId == null) {
      return err("changeRequestId is required.", 400);
    }
    const changeRequestId = Number(body.changeRequestId);
    if (!Number.isFinite(changeRequestId) || changeRequestId <= 0) {
      return err("changeRequestId must be a positive integer.", 400);
    }

    const input: GetChangeRequestStatusInput = {
      changeRequestId,
      endUserIp: body.endUserIp,
    };

    const result = await tboGetChangeRequestStatus(input);
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    const stack = e instanceof Error ? e.stack : String(e);
    console.error("[API /api/hotels/change-request/status] FAILED");
    console.error("  stack:", stack);

    if (e instanceof TboError) return err(`TBO error (${e.code}): ${e.message}`, 502);
    const message = e instanceof Error ? e.message : "GetChangeRequestStatus failed";
    return err(message, 500);
  }
}
