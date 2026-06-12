import { NextRequest, NextResponse } from "next/server";
import { verifySignature, initiateRefund } from "@/lib/razorpay";
import { getDb } from "@/lib/mongodb";
import { tboBookHotel } from "@/lib/adapters/tbo/hotel/book";
import type {
  HotelBookInput,
  HotelBookRoomDetails,
} from "@/lib/adapters/tbo/hotel/book";
import { TboBookingFailedError, TboError } from "@/lib/adapters/tbo/errors";
import { logRequest, logResponse, logError } from "@/lib/adapters/tbo/log";

export const runtime = "nodejs";

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentStatus =
  | "payment_verified" // Signature OK; TBO not yet called (or in-flight)
  | "tbo_confirmed" // TBO booking succeeded
  | "tbo_failed" // TBO hard failure; refund initiated
  | "tbo_timeout" // TBO timed out; state unknown
  | "refund_initiated" // Razorpay refund call succeeded
  | "refunded"; // Legacy alias — kept for forward compat

interface HotelPaymentRecord {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amountPaise: number;
  currency: string;
  clientReferenceId: string;
  bookingCode: string;
  netAmount: number;
  status: PaymentStatus;
  tboBookingId?: number | null;
  tboBookingRefNo?: string | null;
  tboConfirmationNo?: string | null;
  tboInvoiceNumber?: string | null;
  tboError?: string;
  refundId?: string;
  refundInitiated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ts() {
  return new Date().toISOString();
}

function err(
  message: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ success: false, error: message, ...extra }, { status });
}

// Idempotent refund: uses findOneAndUpdate with a $ne guard so only one
// concurrent caller ever reaches Razorpay. Subsequent calls return null (skip).
async function tryInitiateRefund(
  paymentId: string,
  amountPaise: number,
  clientReferenceId: string,
  db: Awaited<ReturnType<typeof getDb>>,
): Promise<string | null> {
  const col = db.collection<HotelPaymentRecord>("hotel_payment_records");

  // Atomically flip refundInitiated false → true; only one caller wins the race.
  const matched = await col.findOneAndUpdate(
    { razorpayPaymentId: paymentId, refundInitiated: { $ne: true } },
    {
      $set: {
        refundInitiated: true,
        status: "refund_initiated",
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );

  if (!matched) {
    // Another request already set refundInitiated=true — skip Razorpay call.
    console.log(
      `\n[RZP ${ts()}] REFUND idempotent skip — already initiated` +
        `\n  paymentId: ${paymentId}`,
    );
    return null;
  }

  try {
    console.log(
      `\n[RZP ${ts()}] → INITIATE_REFUND` +
        `\n  paymentId: ${paymentId}` +
        `\n  amount_paise: ${amountPaise}` +
        `\n  clientRef: ${clientReferenceId}`,
    );

    const refund = await initiateRefund({
      paymentId,
      amountPaise,
      notes: { clientReferenceId },
    });

    await col.updateOne(
      { razorpayPaymentId: paymentId },
      {
        $set: {
          refundId: refund.id,
          status: "refunded",
          updatedAt: new Date(),
        },
      },
    );

    console.log(
      `\n[RZP ${ts()}] ← INITIATE_REFUND [OK]` +
        `\n  refundId: ${refund.id}` +
        `\n  paymentId: ${paymentId}`,
    );

    return refund.id as string;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(
      `\n[RZP ${ts()}] ✗ INITIATE_REFUND FAILED` +
        `\n  paymentId: ${paymentId}` +
        `\n  ERROR: ${msg}`,
    );
    return null;
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

// POST /api/hotels/razorpay/verify-payment
//
// Flow:
//   1. Verify Razorpay HMAC-SHA256 signature.
//   2. Persist payment record to MongoDB (before TBO call).
//   3. Call tboBookHotel() directly (no HTTP hop to /api/hotels/book).
//   4. On success  → update record, return booking data.
//   5. On timeout  → update record, return 202 with recovery info.
//   6. On failure  → update record, initiate idempotent refund, return 422.
//   7. Entire operation is idempotent: duplicate calls for same orderId+paymentId
//      return the cached result from MongoDB.
export async function POST(request: NextRequest) {
  let razorpayPaymentId: string | undefined;
  let razorpayOrderId: string | undefined;
  let amountPaise: number | undefined;
  let clientReferenceId: string | undefined;

  try {
    const body = await request.json();

    razorpayOrderId = body?.razorpayOrderId;
    razorpayPaymentId = body?.razorpayPaymentId;
    const razorpaySignature: string | undefined = body?.razorpaySignature;
    amountPaise = body?.amountPaise;
    clientReferenceId = body?.clientReferenceId;

    const bookingCode: string | undefined = body?.bookingCode;
    const netAmount: number | undefined = body?.netAmount;
    const isVoucherBooking: boolean | undefined = body?.isVoucherBooking;
    const guests: Array<{
      title: string;
      firstName: string;
      lastName: string;
      age?: number;
      pan?: string;
      passport?: string;
      passportIssueDate?: string;
      passportExpDate?: string;
    }> | undefined = body?.guests;
    const guestNationality: string = body?.guestNationality ?? "IN";
    // Agent attribution (subdomain customer bookings only)
    const agentId: string | undefined = body?.agentId;
    // Total adults and rooms from the booking — needed to reconstruct per-room
    // passenger count. Must match the remainder-distribution in searchHolidays.ts exactly.
    const totalAdults: number = Math.max(1, Number(body?.adults ?? 1));
    const totalRooms: number = Math.max(1, Number(body?.rooms ?? 1));
    const totalChildren: number = Math.max(0, Number(body?.children ?? 0));
    const childrenAges: number[] = Array.isArray(body?.childrenAges)
      ? (body.childrenAges as unknown[]).map(Number).filter((n) => !isNaN(n as number))
      : [];

    // ── Validation ──────────────────────────────────────────────────────────

    if (!razorpayOrderId) return err("razorpayOrderId is required.", 400);
    if (!razorpayPaymentId) return err("razorpayPaymentId is required.", 400);
    if (!razorpaySignature) return err("razorpaySignature is required.", 400);
    if (typeof amountPaise !== "number" || amountPaise < 100)
      return err("amountPaise must be a number >= 100.", 400);
    if (!bookingCode) return err("bookingCode is required.", 400);
    if (netAmount == null) return err("netAmount is required.", 400);
    if (isVoucherBooking == null) return err("isVoucherBooking is required.", 400);
    if (!Array.isArray(guests) || guests.length === 0)
      return err("guests must be a non-empty array.", 400);
    if (!clientReferenceId) return err("clientReferenceId is required.", 400);

    console.log(`[BOOK DEBUG] guests[0] identity:`, {
      hasPan: !!guests[0]?.pan,
      pan: guests[0]?.pan ? guests[0].pan.slice(0, 5) + "XXXXX" : null,
      panRaw: guests[0]?.pan === undefined ? "undefined" : guests[0]?.pan === null ? "null" : `string(${guests[0].pan.length})`,
      hasPassport: !!guests[0]?.passport,
    });

    // ── Signature verification ──────────────────────────────────────────────

    const signatureValid = verifySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );

    console.log(
      `\n[RZP ${ts()}] → VERIFY_SIGNATURE` +
        `\n  orderId: ${razorpayOrderId}` +
        `\n  paymentId: ${razorpayPaymentId}` +
        `\n  signatureMatch: ${signatureValid}` +
        `\n  clientReferenceId: ${clientReferenceId}` +
        `\n  amount_paise: ${amountPaise}`,
    );

    if (!signatureValid) {
      console.error(
        `\n[RZP ${ts()}] ✗ SIGNATURE MISMATCH` +
          `\n  orderId: ${razorpayOrderId}` +
          `\n  paymentId: ${razorpayPaymentId}`,
      );
      return err(
        "Payment signature verification failed. If any amount was deducted, contact support with your payment ID.",
        400,
        { signatureMismatch: true, razorpayPaymentId },
      );
    }

    // ── MongoDB ─────────────────────────────────────────────────────────────

    const db = await getDb();
    const col = db.collection<HotelPaymentRecord>("hotel_payment_records");

    // Idempotency: return cached result if this orderId+paymentId pair was
    // already processed (handles client retries on network interruption).
    const existing = await col.findOne({ razorpayOrderId, razorpayPaymentId });

    if (existing) {
      console.log(
        `\n[RZP ${ts()}] VERIFY_PAYMENT idempotent hit` +
          `\n  paymentId: ${razorpayPaymentId}` +
          `\n  status: ${existing.status}`,
      );

      if (existing.status === "tbo_confirmed") {
        return NextResponse.json({
          success: true,
          data: {
            bookingId: existing.tboBookingId,
            bookingRefNo: existing.tboBookingRefNo,
            confirmationNo: existing.tboConfirmationNo,
            invoiceNumber: existing.tboInvoiceNumber,
            bookingStatus: "Confirmed",
          },
        });
      }

      if (existing.status === "tbo_timeout") {
        return NextResponse.json(
          {
            success: false,
            tboTimedOut: true,
            razorpayPaymentId,
            clientReferenceId,
            error:
              "Booking request timed out. Your payment was received. " +
              "Please check your email or contact support with your reference ID.",
          },
          { status: 202 },
        );
      }

      // tbo_failed / refund_initiated / refunded
      return err(
        "Booking failed. " +
          (existing.refundInitiated
            ? "A full refund has been initiated and will reflect in 5-7 business days."
            : "Please contact support with your payment ID: " + razorpayPaymentId),
        422,
        {
          tboFailed: true,
          razorpayPaymentId,
          refundInitiated: existing.refundInitiated,
          refundId: existing.refundId,
        },
      );
    }

    // ── Persist payment record BEFORE calling TBO ───────────────────────────
    // This is the durability guarantee: even if the process crashes between
    // here and the TBO response, there is a DB record with proof of payment.

    const now = new Date();
    const record: HotelPaymentRecord = {
      razorpayOrderId,
      razorpayPaymentId,
      amountPaise,
      currency: "INR",
      clientReferenceId,
      bookingCode,
      netAmount: Number(netAmount),
      status: "payment_verified",
      refundInitiated: false,
      createdAt: now,
      updatedAt: now,
    };

    await col.insertOne(record);

    console.log(
      `\n[RZP ${ts()}] ← VERIFY_SIGNATURE [OK] — payment record persisted` +
        `\n  orderId: ${razorpayOrderId}` +
        `\n  paymentId: ${razorpayPaymentId}` +
        `\n  clientRef: ${clientReferenceId}`,
    );

    // ── Build TBO roomsDetails ───────────────────────────────────────────────
    //
    // The guest form collects exactly ONE lead passenger per room (not per
    // adult). TBO requires the passenger count per room to match the PaxRooms
    // sent during SearchHolidays — using the same remainder-distribution:
    //   room[i].adults   = Math.ceil(adultsRemaining / roomsLeft)
    //   room[i].children = Math.ceil(childrenRemaining / roomsLeft)
    //
    // Additional adult slots beyond the lead are filled with the lead's name
    // so the count satisfies TBO's validation. Only the lead passenger matters
    // for check-in; the extras are a TBO API formality.
    //
    // PAN / passport are placed on the lead passenger only — that is what TBO
    // requires when panMandatory / passportMandatory is set in PreBook.
    let adultsRemaining = totalAdults;
    let childrenRemaining = totalChildren;
    // Track which child ages have been assigned across rooms.
    let childAgeOffset = 0;
    const roomsDetails: HotelBookRoomDetails[] = guests.map((lead, roomIdx) => {
      const roomsLeft = totalRooms - roomIdx;
      const roomAdults = Math.ceil(adultsRemaining / roomsLeft);
      adultsRemaining -= roomAdults;
      const roomChildren = Math.ceil(childrenRemaining / roomsLeft);
      childrenRemaining -= roomChildren;

      const roomPassengers = [
        // Lead passenger — real form data including identity documents
        {
          title: lead.title as "Mr" | "Mrs" | "Ms",
          firstName: lead.firstName,
          lastName: lead.lastName,
          paxType: 1 as const,
          leadPassenger: true,
          age: lead.age,
          pan: lead.pan || undefined,
          passportNo: lead.passport || undefined,
          passportIssueDate: lead.passportIssueDate || undefined,
          passportExpDate: lead.passportExpDate || undefined,
        },
        // Additional adult slots required by TBO — filled with lead's details.
        // PAN and passport must be propagated to every adult: TBO validates
        // PAN count against all adult passengers (PanCountRequired), not just
        // the lead, and returns ErrorCode 3 "PAN is mandatory" if any adult
        // is missing PAN when panMandatory=true.
        ...Array.from({ length: roomAdults - 1 }, () => ({
          title: lead.title as "Mr" | "Mrs" | "Ms",
          firstName: lead.firstName,
          lastName: lead.lastName,
          paxType: 1 as const,
          leadPassenger: false,
          age: undefined as number | undefined,
          pan: lead.pan || undefined,
          passportNo: lead.passport || undefined,
          passportIssueDate: lead.passportIssueDate || undefined,
          passportExpDate: lead.passportExpDate || undefined,
        })),
        // Child passengers — PaxType 2, Age required by TBO.
        // Ages come from the search URL in the same order as PaxRooms.ChildrenAges.
        ...Array.from({ length: roomChildren }, () => {
          const age = childrenAges[childAgeOffset++] ?? 0;
          return {
            title: "Mr" as const,
            firstName: lead.firstName,
            lastName: lead.lastName,
            paxType: 2 as const,
            leadPassenger: false,
            age,
          };
        }),
      ];
      return { passengers: roomPassengers };
    });

    const totalPassengers = roomsDetails.reduce(
      (n, r) => n + r.passengers.length,
      0,
    );

    const bookInput: HotelBookInput = {
      bookingCode,
      netAmount: Number(netAmount),
      isVoucherBooking: Boolean(isVoucherBooking),
      guestNationality,
      clientReferenceId,
      roomsDetails,
    };

    // Log request — mask PAN/passport; show per-room passenger breakdown
    logRequest(
      "BOOK_HOTEL",
      process.env.TBO_HOLIDAYS_BOOK_URL ??
        "https://HotelBE.tektravels.com/hotelservice.svc/rest/book",
      {
        BookingCode: bookingCode,
        NetAmount: bookInput.netAmount,
        IsVoucherBooking: bookInput.isVoucherBooking,
        GuestNationality: guestNationality,
        ClientReferenceId: clientReferenceId,
        rooms: roomsDetails.length,
        totalAdults,
        totalChildren,
        totalPassengers,
      },
    );

    // ── Call TBO ─────────────────────────────────────────────────────────────

    const tboResult = await tboBookHotel(bookInput);

    logResponse("BOOK_HOTEL", 200, {
      status: tboResult.bookingStatus,
      bookingId: tboResult.bookingId,
      bookingRefNo: tboResult.bookingRefNo,
      isPriceChanged: tboResult.isPriceChanged,
    });

    // ── Update record on TBO success ─────────────────────────────────────────

    await col.updateOne(
      { razorpayOrderId, razorpayPaymentId },
      {
        $set: {
          status: "tbo_confirmed",
          tboBookingId: tboResult.bookingId,
          tboBookingRefNo: tboResult.bookingRefNo,
          tboConfirmationNo: tboResult.confirmationNo,
          tboInvoiceNumber: tboResult.invoiceNumber,
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({ success: true, data: tboResult });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isTimeout =
      msg.includes("timed out") ||
      msg.includes("timeout") ||
      msg.includes("120");
    const isPriceChanged =
      e instanceof TboBookingFailedError &&
      (msg.toLowerCase().includes("price") ||
        msg.toLowerCase().includes("verify"));

    logError("BOOK_HOTEL", e, {
      razorpayPaymentId,
      razorpayOrderId,
      isTimeout,
      isPriceChanged,
    });

    // If we failed before reaching the DB/TBO stage (bad signature, missing
    // fields), there is no payment record to update — bail early.
    if (!razorpayPaymentId || !razorpayOrderId || !amountPaise) {
      return err("Payment verification failed.", 400);
    }

    // Wrap remaining DB operations in a try/catch so a secondary DB failure
    // does not swallow the primary error response.
    try {
      const db = await getDb();
      const col = db.collection<HotelPaymentRecord>("hotel_payment_records");

      // ── TBO timeout ───────────────────────────────────────────────────────

      if (isTimeout) {
        await col.updateOne(
          { razorpayOrderId, razorpayPaymentId },
          {
            $set: {
              status: "tbo_timeout",
              tboError: msg,
              updatedAt: new Date(),
            },
          },
        );

        console.error(
          `\n[RZP ${ts()}] ✗ BOOK_HOTEL TIMEOUT` +
            `\n  reason: 120s timeout exceeded` +
            `\n  razorpayPaymentId: ${razorpayPaymentId}` +
            `\n  clientReferenceId: ${clientReferenceId}` +
            `\n  action: recovery_via_GetBookingDetail`,
        );

        return NextResponse.json(
          {
            success: false,
            tboTimedOut: true,
            razorpayPaymentId,
            clientReferenceId,
            error:
              "Booking request timed out. Your payment was received. " +
              "Please check your email or contact support with reference ID: " +
              clientReferenceId,
          },
          { status: 202 },
        );
      }

      // ── TBO hard failure (includes price change) ──────────────────────────

      await col.updateOne(
        { razorpayOrderId, razorpayPaymentId },
        {
          $set: {
            status: "tbo_failed",
            tboError: msg,
            updatedAt: new Date(),
          },
        },
      );

      const refundId = await tryInitiateRefund(
        razorpayPaymentId,
        amountPaise,
        clientReferenceId ?? "",
        db,
      );

      const reason = isPriceChanged ? "price_changed" : "booking_failed";
      const userMessage = isPriceChanged
        ? "Hotel price changed before booking could be confirmed. A full refund has been initiated and will reflect in 5-7 business days."
        : "Hotel booking failed. A full refund has been initiated and will reflect in 5-7 business days.";

      console.error(
        `\n[RZP ${ts()}] ✗ BOOK_HOTEL HARD FAILURE` +
          `\n  reason: ${reason}` +
          `\n  razorpayPaymentId: ${razorpayPaymentId}` +
          `\n  refundInitiated: ${refundId !== null}` +
          `\n  refundId: ${refundId ?? "none"}`,
      );

      return NextResponse.json(
        {
          success: false,
          tboFailed: true,
          reason,
          razorpayPaymentId,
          razorpayRefundInitiated: refundId !== null,
          refundId,
          error: userMessage,
        },
        { status: 422 },
      );
    } catch (dbErr) {
      // Secondary DB failure during error handling — still return a useful
      // response so the user knows their payment ID for support follow-up.
      console.error(
        `\n[RZP ${ts()}] ✗ DB ERROR during failure handling` +
          `\n  ERROR: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`,
      );

      if (e instanceof TboError) {
        return err(
          `Booking failed. Please contact support with payment ID: ${razorpayPaymentId}`,
          422,
          { tboFailed: true, razorpayPaymentId, razorpayRefundInitiated: false },
        );
      }

      return err("An unexpected error occurred. Please contact support.", 500, {
        razorpayPaymentId,
      });
    }
  }
}
