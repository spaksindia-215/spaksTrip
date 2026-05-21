import { NextRequest, NextResponse } from "next/server";
import { tboGenerateVoucher } from "@/lib/adapters/tbo/hotel/generateVoucher";
import type { GenerateVoucherInput } from "@/lib/adapters/tbo/hotel/generateVoucher";
import { TboError, TboBookingFailedError } from "@/lib/adapters/tbo/errors";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// POST /api/hotels/voucher
// Required: bookingId (integer)
// Optional: isCorporate, endUserIp
// Optional: roomsDetails[].passengers[].{ paxId, pan }  — only when PAN was deferred at Book time
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

    if (body.roomsDetails !== undefined) {
      if (!Array.isArray(body.roomsDetails)) {
        return err("roomsDetails must be an array.", 400);
      }
      for (let i = 0; i < body.roomsDetails.length; i++) {
        const room = body.roomsDetails[i];
        if (!Array.isArray(room?.passengers)) {
          return err(`roomsDetails[${i}].passengers must be an array.`, 400);
        }
        for (let j = 0; j < room.passengers.length; j++) {
          const pax = room.passengers[j];
          if (pax?.paxId == null || !pax?.pan) {
            return err(`roomsDetails[${i}].passengers[${j}] must have paxId and pan.`, 400);
          }
        }
      }
    }

    const input: GenerateVoucherInput = {
      bookingId,
      endUserIp: body.endUserIp,
      isCorporate: body.isCorporate,
      roomsDetails: body.roomsDetails,
    };

    const result = await tboGenerateVoucher(input);
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    const stack = e instanceof Error ? e.stack : String(e);
    console.error("[API /api/hotels/voucher] FAILED");
    console.error("  stack:", stack);

    if (e instanceof TboBookingFailedError) {
      return err(`Voucher failed: ${e.message}`, 422);
    }
    if (e instanceof TboError) return err(`TBO error (${e.code}): ${e.message}`, 502);
    const message = e instanceof Error ? e.message : "GenerateVoucher failed";
    return err(message, 500);
  }
}
