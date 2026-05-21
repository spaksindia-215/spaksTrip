import { NextRequest, NextResponse } from "next/server";
import { tboBookHotel } from "@/lib/adapters/tbo/hotel/book";
import type { HotelBookInput, HotelBookRoomDetails, HotelBookPassenger } from "@/lib/adapters/tbo/hotel/book";
import { TboBookingFailedError, TboError } from "@/lib/adapters/tbo/errors";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// POST /api/hotels/book
// Body matches HotelBookInput — bookingCode from PreBook, netAmount from PreBook,
// roomsDetails with at least one passenger per room (leadPassenger=true for one adult).
export async function POST(request: NextRequest) {
  let bookingCode: string | undefined;

  try {
    const body = await request.json();
    bookingCode = body?.bookingCode;

    if (!bookingCode) return err("bookingCode is required.", 400);
    if (body?.netAmount == null) return err("netAmount is required.", 400);
    if (body?.isVoucherBooking == null) return err("isVoucherBooking is required.", 400);
    if (!Array.isArray(body?.roomsDetails) || body.roomsDetails.length === 0) {
      return err("roomsDetails must be a non-empty array.", 400);
    }

    for (let i = 0; i < body.roomsDetails.length; i++) {
      const room = body.roomsDetails[i];
      if (!Array.isArray(room?.passengers) || room.passengers.length === 0) {
        return err(`roomsDetails[${i}].passengers must be a non-empty array.`, 400);
      }
      const hasLead = room.passengers.some((p: HotelBookPassenger) => p.leadPassenger);
      if (!hasLead) {
        return err(`roomsDetails[${i}] must have exactly one passenger with leadPassenger=true.`, 400);
      }
      for (const p of room.passengers as HotelBookPassenger[]) {
        if (!p.firstName || p.firstName.length < 2) {
          return err(`passenger firstName must be at least 2 characters.`, 400);
        }
        if (!p.lastName || p.lastName.length < 2) {
          return err(`passenger lastName must be at least 2 characters.`, 400);
        }
      }
    }

    const input: HotelBookInput = {
      bookingCode,
      netAmount: Number(body.netAmount),
      isVoucherBooking: Boolean(body.isVoucherBooking),
      guestNationality: body.guestNationality,
      endUserIp: body.endUserIp,
      clientReferenceId: body.clientReferenceId,
      roomsDetails: (body.roomsDetails as HotelBookRoomDetails[]),
      isPackageFare: body.isPackageFare,
      isPackageDetailsMandatory: body.isPackageDetailsMandatory,
      arrivalTransportType: body.arrivalTransportType,
      arrivalTransportInfoId: body.arrivalTransportInfoId,
      arrivalTransportTime: body.arrivalTransportTime,
    };

    const result = await tboBookHotel(input);
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    const stack = e instanceof Error ? e.stack : String(e);
    console.error("[API /api/hotels/book] FAILED");
    console.error("  bookingCode:", bookingCode);
    console.error("  stack:", stack);

    if (e instanceof TboBookingFailedError) {
      return err(e.message, 422);
    }
    if (e instanceof TboError) {
      return err(`TBO error (${e.code}): ${e.message}`, 502);
    }
    const message = e instanceof Error ? e.message : "Hotel booking failed";
    return err(message, 500);
  }
}
