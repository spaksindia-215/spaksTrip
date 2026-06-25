import { NextRequest, NextResponse } from "next/server";
import { verifySignature, initiateRefund, fetchPayment } from "@/lib/razorpay";
import { getDb } from "@/lib/mongodb";
import { tboBookHotel } from "@/lib/adapters/tbo/hotel/book";
import type {
  HotelBookInput,
  HotelBookRoomDetails,
} from "@/lib/adapters/tbo/hotel/book";
import { TboBookingFailedError, TboError } from "@/lib/adapters/tbo/errors";
import { logRequest, logResponse, logError } from "@/lib/adapters/tbo/log";
import { buildTwoTierPricing, type TwoTierPricing } from "@/lib/server/agentMarkup";
import { recordCustomerBooking } from "@/lib/server/recordCustomerBooking";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

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
  razorpayOrderId:    string;
  razorpayPaymentId:  string;
  amountPaise:        number;
  currency:           string;
  clientReferenceId:  string;
  bookingCode:        string;
  netAmount:          number;
  status:             PaymentStatus;
  tboBookingId?:      number | null;
  tboBookingRefNo?:   string | null;
  tboConfirmationNo?: string | null;
  tboInvoiceNumber?:  string | null;
  tboError?:          string;
  tboFailureReason?:  "explicit_failure" | "timeout" | "network_error" | "unknown";
  refundId?:          string;
  refundInitiated:    boolean;
  // Agent attribution — present on subdomain customer bookings only
  agentId?:           string;
  pricing?:           TwoTierPricing;
  createdAt:          Date;
  updatedAt:          Date;
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
  let capturedPaise: number | undefined; // authoritative amount from Razorpay
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
    const customerId: string | undefined = body?.customerId;

    console.log(`[VERIFY_PAYMENT] customerId received: ${customerId}`);
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
    const isCorporate: boolean | undefined = body?.isCorporate;
    const corporatePan: string | undefined = body?.corporatePan;
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

    // ── Passenger-count validation (server-side) ─────────────────────────────
    // Enforce the invariants the room-distribution logic below assumes, so a
    // tampered request can't desync passenger counts from the priced rooms.
    if (totalRooms < 1 || totalRooms > 9)
      return err("Number of rooms must be between 1 and 9.", 400);
    if (totalAdults < 1)
      return err("At least one adult guest is required.", 400);
    if (totalAdults < totalRooms)
      return err("Each room must have at least one adult guest.", 400);
    if (guests.length !== totalRooms)
      return err("Please provide exactly one lead guest per room.", 400);
    if (totalAdults + totalChildren > 9 * totalRooms)
      return err("Too many guests for the selected number of rooms.", 400);

    // ── Agent attribution (subdomain bookings only) ─────────────────────────
    // netAmount is what TBO charges (= tboFare). Compute the full pricing
    // breakdown so all 5 fields can be stamped on the booking record.

    const agentId   = request.headers.get("x-agent-id") ?? undefined;
    const twoTierPricing: TwoTierPricing | null = agentId
      ? await buildTwoTierPricing(Number(netAmount), "hotels", request)
      : null;

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

    // ── Authoritative captured amount ───────────────────────────────────────
    // Read what Razorpay ACTUALLY captured (and which order it belongs to) —
    // never trust the client-sent amountPaise for money. Falls back to the body
    // amount only if the fetch fails, so a transient Razorpay error never blocks
    // a legitimate booking.
    capturedPaise = amountPaise;
    try {
      const payment = await fetchPayment(razorpayPaymentId);
      capturedPaise = payment.amountPaise;
      if (payment.orderId && payment.orderId !== razorpayOrderId) {
        console.error(
          `\n[RZP ${ts()}] ✗ ORDER MISMATCH (hotel)` +
            `\n  payment.order_id: ${payment.orderId}\n  body.orderId: ${razorpayOrderId}`,
        );
        return err("Payment does not match this order.", 400, { razorpayPaymentId });
      }
      if (capturedPaise !== amountPaise) {
        console.warn(`\n[RZP ${ts()}] ⚠ client amountPaise (${amountPaise}) ≠ captured (${capturedPaise}); using captured.`);
      }
    } catch (e) {
      console.error(`\n[RZP ${ts()}] ⚠ fetchPayment failed; falling back to body amount\n  ERROR: ${e instanceof Error ? e.message : String(e)}`);
    }

    // ── Persist payment record BEFORE calling TBO ───────────────────────────
    // This is the durability guarantee: even if the process crashes between
    // here and the TBO response, there is a DB record with proof of payment.

    const now = new Date();
    const record: HotelPaymentRecord = {
      razorpayOrderId,
      razorpayPaymentId,
      amountPaise:      capturedPaise, // authoritative — from Razorpay, not the client
      currency:         "INR",
      clientReferenceId,
      bookingCode,
      netAmount:        Number(netAmount),
      status:           "payment_verified",
      refundInitiated:  false,
      // Attribution fields — only populated on subdomain customer bookings
      ...(agentId       ? { agentId }          : {}),
      ...(twoTierPricing ? { pricing: twoTierPricing } : {}),
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
    // adult). TBO requires the passenger count per room to match the adult
    // count that was sent during SearchHolidays — using the same formula:
    //   adultsPerRoom = Math.max(1, Math.ceil(totalAdults / totalRooms))
    //
    // Additional adult slots beyond the lead are filled with the lead's own
    // name so the count satisfies TBO's validation. Only the lead passenger
    // matters for check-in; the duplicates are a TBO API formality.
    // ── Build TBO roomsDetails ───────────────────────────────────────────────
    //
    // PAN and passport must be propagated to ALL adult passengers: TBO validates
    // PAN count against all adults (PanCountRequired), not just the lead.
    // Children are separate passengers (PaxType 2) with their ages.
    let adultsRemaining = totalAdults;
    let childrenRemaining = totalChildren;
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
        // Additional adult slots — PAN and passport propagated to every adult.
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
      isCorporate: isCorporate ?? false,
      corporatePan: corporatePan,
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

    // ── Anti-tamper: captured amount must cover at least the TBO net price ──
    // `amountPaise` is chosen by the client at order creation; `netAmount` is
    // what TBO charges and is itself re-validated by TBO at book time. The
    // customer always pays markup on top of net, so the net is the hard floor.
    // A capture below it means the order amount was tampered — refund and abort
    // BEFORE booking with TBO.
    {
      const expectedFloorPaise = Math.round(Number(netAmount) * 100);
      const PRICE_TOLERANCE_PAISE = 100; // ₹1 slack for rounding
      if (capturedPaise + PRICE_TOLERANCE_PAISE < expectedFloorPaise) {
        console.error(
          `\n[RZP ${ts()}] ✗ AMOUNT TAMPER (hotel)` +
            `\n  capturedPaise: ${capturedPaise}\n  expectedFloorPaise: ${expectedFloorPaise}\n  paymentId: ${razorpayPaymentId}`,
        );
        await col.updateOne(
          { razorpayOrderId, razorpayPaymentId },
          { $set: { status: "tbo_failed", tboError: "amount_below_fare", updatedAt: new Date() } },
        );
        const refundId = await tryInitiateRefund(razorpayPaymentId, capturedPaise, clientReferenceId ?? "", db);
        return err(
          "Payment amount did not match the price for this booking. A refund has been initiated and will reflect in 5-7 business days.",
          422,
          { tboFailed: true, reason: "amount_mismatch", razorpayPaymentId, razorpayRefundInitiated: refundId !== null, refundId },
        );
      }
    }

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
          status:            "tbo_confirmed",
          tboBookingId:      tboResult.bookingId,
          tboBookingRefNo:   tboResult.bookingRefNo,
          tboConfirmationNo: tboResult.confirmationNo,
          tboInvoiceNumber:  tboResult.invoiceNumber,
          updatedAt:         new Date(),
        },
      },
    );

    // Create a BookingModel entry for settlement reporting and customer dashboard (non-fatal: fire-and-forget).
    // For agent bookings (twoTierPricing), include full pricing; for customers, use simplified pricing.
    // Hotel bookings are marked as "completed" since they are immediately confirmed by TBO.
    fetch(new URL("/api/internal/record-booking", API_BASE), {
      method:  "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentId,
        customerId,
        productType:  "hotel",
        status:       "completed",
        pnr:          tboResult.bookingRefNo ?? undefined,
        ...(twoTierPricing ? twoTierPricing : { tboFare: Number(netAmount), platformMarkup: 0, netFare: Number(netAmount), agentMarkup: 0, customerPaid: capturedPaise / 100 }),
      }),
      cache: "no-store",
    }).catch((e: unknown) => {
      console.error("[record-booking] fire-and-forget failed:", e instanceof Error ? e.message : String(e));
    });

    // Customer dashboard recording (main-site logged-in customers). Best-effort.
    void recordCustomerBooking({
      productType: "hotel",
      pnr: tboResult.bookingRefNo ?? undefined,
      amount: Math.round(capturedPaise / 100),
      details: {
        guests: totalAdults + totalChildren,
        hotelCode: bookingCode,
      },
    });

    return NextResponse.json({ success: true, data: tboResult });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isExplicitFailure = msg.includes("explicitly failed") || msg.includes("status_code=0");
    const isTimeout =
      !isExplicitFailure &&
      (msg.includes("timed out") ||
        msg.includes("timeout") ||
        msg.includes("120"));
    const isPriceChanged =
      e instanceof TboBookingFailedError &&
      (msg.toLowerCase().includes("price") ||
        msg.toLowerCase().includes("verify"));
    const tboFailureReason: "explicit_failure" | "timeout" | "unknown" =
      isExplicitFailure ? "explicit_failure" : isTimeout ? "timeout" : "unknown";

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
              tboFailureReason: "timeout",
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
            tboFailureReason,
            updatedAt: new Date(),
          },
        },
      );

      const refundId = await tryInitiateRefund(
        razorpayPaymentId,
        capturedPaise ?? amountPaise, // refund the amount actually captured
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
