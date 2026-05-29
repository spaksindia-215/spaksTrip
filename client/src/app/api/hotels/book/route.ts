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

    if (body?.isCorporate && !body?.corporatePan) {
      return err("corporatePan is required when isCorporate=true.", 400);
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
        // Validate title (Mr/Mrs/Ms only, per TBO requirement)
        if (!p.title || !["Mr", "Mrs", "Ms"].includes(p.title)) {
          return err(`passenger title must be one of: Mr, Mrs, Ms`, 400);
        }
        if (!p.firstName || p.firstName.length < 2 || p.firstName.length > 25) {
          return err(`passenger firstName must be 2-25 characters.`, 400);
        }
        // TBO requirement: firstName must contain only letters and spaces (no special chars, hyphens, apostrophes)
        if (!/^[a-zA-Z\s]+$/.test(p.firstName)) {
          return err(`passenger firstName can only contain letters and spaces.`, 400);
        }
        if (!p.lastName || p.lastName.length < 2 || p.lastName.length > 25) {
          return err(`passenger lastName must be 2-25 characters.`, 400);
        }
        // TBO requirement: lastName must contain only letters and spaces (no special chars, hyphens, apostrophes)
        if (!/^[a-zA-Z\s]+$/.test(p.lastName)) {
          return err(`passenger lastName can only contain letters and spaces.`, 400);
        }
        // Age validation: required for children, optional for adults
        if (p.paxType === 2 && (!p.age || p.age < 0 || p.age > 17)) {
          return err(`child passenger must have age between 0-17.`, 400);
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
      distributionType: body.distributionType ?? "b2c",
      isCorporate: body.isCorporate,
      corporatePan: body.corporatePan,
    };

    const result = await tboBookHotel(input);
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    const stack = e instanceof Error ? e.stack : String(e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    const isTimeout = errorMessage.includes("timed out") || errorMessage.includes("timeout") || errorMessage.includes("120");

    console.error("[API /api/hotels/book] FAILED");
    console.error("  bookingCode:", bookingCode);
    console.error("  isTimeout:", isTimeout);
    console.error("  stack:", stack);

    if (e instanceof TboBookingFailedError) {
      // For timeout errors, return 408 (Request Timeout) instead of 422
      const statusCode = isTimeout ? 408 : 422;
      return err(e.message, statusCode);
    }
    if (e instanceof TboError) {
      return err(`TBO error (${e.code}): ${e.message}`, 502);
    }

    // Timeout errors should use 408 status code
    if (isTimeout) {
      return err(
        errorMessage || "Booking request timed out. Please verify your booking status using the reference ID provided.",
        408,
      );
    }

    const message = e instanceof Error ? e.message : "Hotel booking failed";
    return err(message, 500);
  }
}
