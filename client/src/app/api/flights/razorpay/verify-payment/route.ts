import { NextRequest, NextResponse } from "next/server";
import { verifySignature, initiateRefund, fetchPayment } from "@/lib/razorpay";
import { getDb } from "@/lib/mongodb";
import { issueFlightBooking, type IssueFlightInput } from "@/lib/adapters/tbo/flight/issue";
import { TboPriceChangedError, TboPartialBookingError, TboError } from "@/lib/adapters/tbo/errors";
import { logError } from "@/lib/adapters/tbo/log";
import { buildTwoTierPricing, type TwoTierPricing } from "@/lib/server/agentMarkup";
import type { TboFareBreakdown } from "@/lib/adapters/tbo/types";
import { sendFlightConfirmation } from "@/lib/mailer";
import { flightProxyEnabled, forwardToRailway } from "@/lib/tboProxy";
import { recordCustomerBooking } from "@/lib/server/recordCustomerBooking";

export const runtime = "nodejs";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

// ─── Payment record (Mongo) ─────────────────────────────────────────────────

type PaymentStatus =
  | "payment_verified"
  | "tbo_confirmed"
  | "tbo_failed"
  | "tbo_timeout"
  | "tbo_partial" // domestic-return: outbound ticketed, inbound failed — needs reconciliation
  | "refund_initiated"
  | "refunded";

interface FlightPaymentRecord {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amountPaise: number; // authoritative captured amount from Razorpay — used for refunds
  currency: string;
  clientReferenceId: string;
  status: PaymentStatus;
  pnr?: string | null;
  bookingId?: number | null;
  returnPnr?: string | null;
  returnBookingId?: number | null;
  ticketNumbers?: string[];
  /** Outbound PNR that WAS issued when the inbound leg failed (tbo_partial). */
  partialPnr?: string | null;
  tboError?: string;
  refundId?: string;
  refundInitiated: boolean;
  agentId?: string;
  pricing?: TwoTierPricing;
  createdAt: Date;
  updatedAt: Date;
}

const COLLECTION = "flight_payment_records";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ts() {
  return new Date().toISOString();
}

// Razorpay SDK rejects with a plain object ({ statusCode, error: { code, description }}),
// so String(e) is "[object Object]". Extract the real reason for logs/diagnostics.
function rzpErrMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    const o = e as { error?: { description?: string; reason?: string; code?: string }; message?: string };
    return o.error?.description || o.error?.reason || o.error?.code || o.message || JSON.stringify(o);
  }
  return String(e);
}

function err(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error: message, ...extra }, { status });
}

function tboFareFrom(fareBreakdown: TboFareBreakdown[], extra?: TboFareBreakdown[]): number {
  const sum = (fbd: TboFareBreakdown[]) =>
    fbd.reduce((acc, bd) => acc + bd.BaseFare + bd.Tax + bd.YQTax, 0);
  return sum(fareBreakdown) + (extra ? sum(extra) : 0);
}

function isTimeoutError(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes("timed out") || m.includes("timeout") || m.includes("aborted") || m.includes("abort");
}

// Idempotent refund: atomically flips refundInitiated false→true so only one
// concurrent caller (or retry) ever reaches Razorpay. Mirrors the hotel flow.
// The refund amount is read from the PERSISTED record (the Razorpay-captured amount),
// never from the client request body — the client cannot influence the refund total.
async function tryInitiateRefund(
  paymentId: string,
  clientReferenceId: string,
  db: Awaited<ReturnType<typeof getDb>>,
): Promise<string | null> {
  const col = db.collection<FlightPaymentRecord>(COLLECTION);
  const matched = await col.findOneAndUpdate(
    { razorpayPaymentId: paymentId, refundInitiated: { $ne: true } },
    { $set: { refundInitiated: true, status: "refund_initiated", updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!matched) {
    console.log(`\n[RZP ${ts()}] REFUND idempotent skip — already initiated\n  paymentId: ${paymentId}`);
    return null;
  }
  try {
    const refund = await initiateRefund({ paymentId, amountPaise: matched.amountPaise, notes: { clientReferenceId, product: "flight" } });
    await col.updateOne(
      { razorpayPaymentId: paymentId },
      { $set: { refundId: refund.id as string, status: "refunded", updatedAt: new Date() } },
    );
    console.log(`\n[RZP ${ts()}] ← INITIATE_REFUND (flight) [OK]\n  refundId: ${refund.id}\n  paymentId: ${paymentId}`);
    return refund.id as string;
  } catch (e) {
    console.error(`\n[RZP ${ts()}] ✗ INITIATE_REFUND (flight) FAILED\n  paymentId: ${paymentId}\n  ERROR: ${rzpErrMsg(e)}`);
    return null;
  }
}

// ─── Route ───────────────────────────────────────────────────────────────────
//
// POST /api/flights/razorpay/verify-payment
//   1. Verify Razorpay signature.
//   2. Idempotency: return cached result for a repeated orderId+paymentId.
//   3. Persist payment record BEFORE calling TBO (durability anchor).
//   4. issueFlightBooking() — Book → Ticket server-side.
//   5. success → tbo_confirmed; timeout → tbo_timeout (202, no refund);
//      price-change/hard failure → tbo_failed + idempotent refund (422).
export async function POST(request: NextRequest) {
  if (flightProxyEnabled()) return forwardToRailway(request);

  let razorpayOrderId: string | undefined;
  let razorpayPaymentId: string | undefined;
  let amountPaise: number | undefined;
  let clientReferenceId: string | undefined;

  try {
    const body = await request.json();
    razorpayOrderId = body?.razorpayOrderId;
    razorpayPaymentId = body?.razorpayPaymentId;
    const razorpaySignature: string | undefined = body?.razorpaySignature;
    amountPaise = body?.amountPaise;
    clientReferenceId = body?.clientReferenceId;
    const booking = body?.booking as IssueFlightInput | undefined;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!razorpayOrderId) return err("razorpayOrderId is required.", 400);
    if (!razorpayPaymentId) return err("razorpayPaymentId is required.", 400);
    if (!razorpaySignature) return err("razorpaySignature is required.", 400);
    if (typeof amountPaise !== "number" || amountPaise < 100) return err("amountPaise must be a number >= 100.", 400);
    if (!clientReferenceId) return err("clientReferenceId is required.", 400);
    if (!booking?.resultIndex || !booking?.passengers?.length || !booking?.fareBreakdown?.length) {
      return err("booking payload (resultIndex, passengers, fareBreakdown) is required.", 400);
    }
    if (!booking.contactEmail || !booking.contactPhone) {
      return err("booking contactEmail and contactPhone are required.", 400);
    }

    // ── Signature verification ──────────────────────────────────────────────
    const signatureValid = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    console.log(
      `\n[RZP ${ts()}] → VERIFY_SIGNATURE (flight)` +
        `\n  orderId: ${razorpayOrderId}\n  paymentId: ${razorpayPaymentId}` +
        `\n  signatureMatch: ${signatureValid}\n  clientRef: ${clientReferenceId}`,
    );
    if (!signatureValid) {
      console.error(`\n[RZP ${ts()}] ✗ SIGNATURE MISMATCH (flight)\n  paymentId: ${razorpayPaymentId}`);
      return err(
        "Payment signature verification failed. If any amount was deducted, contact support with your payment ID.",
        400,
        { signatureMismatch: true, razorpayPaymentId },
      );
    }

    const db = await getDb();
    const col = db.collection<FlightPaymentRecord>(COLLECTION);

    // ── Idempotency: replay a previously-processed payment ──────────────────
    const existing = await col.findOne({ razorpayOrderId, razorpayPaymentId });
    if (existing) {
      console.log(`\n[RZP ${ts()}] VERIFY_PAYMENT (flight) idempotent hit\n  paymentId: ${razorpayPaymentId}\n  status: ${existing.status}`);
      if (existing.status === "tbo_confirmed") {
        return NextResponse.json({
          success: true,
          data: {
            pnr: existing.pnr,
            bookingId: existing.bookingId,
            ticketNumbers: existing.ticketNumbers ?? [],
            ...(existing.returnPnr ? { returnLeg: { pnr: existing.returnPnr, bookingId: existing.returnBookingId } } : {}),
          },
        });
      }
      if (existing.status === "tbo_timeout") {
        return NextResponse.json(
          { success: false, tboTimedOut: true, razorpayPaymentId, clientReferenceId,
            error: "Booking request timed out. Your payment was received — we will confirm by email or you can contact support with your reference ID." },
          { status: 202 },
        );
      }
      if (existing.status === "tbo_partial") {
        return NextResponse.json(
          { success: false, tboPartial: true, razorpayPaymentId, clientReferenceId,
            partialPnr: existing.partialPnr,
            error: "Your outbound flight is ticketed but the return leg could not be confirmed. Our team will contact you to complete or adjust the return — no extra charge without your consent." },
          { status: 202 },
        );
      }
      return err(
        "Booking failed. " +
          (existing.refundInitiated
            ? "A full refund has been initiated and will reflect in 5-7 business days."
            : "Please contact support with your payment ID: " + razorpayPaymentId),
        422,
        { tboFailed: true, razorpayPaymentId, refundInitiated: existing.refundInitiated, refundId: existing.refundId },
      );
    }

    // ── Authoritative captured amount ───────────────────────────────────────
    // Read the amount Razorpay actually captured (and the order it belongs to)
    // straight from Razorpay — never trust the client-sent amountPaise for money.
    // This is the value persisted and later used for any refund.
    let capturedPaise = amountPaise; // fallback only if the fetch fails
    try {
      const payment = await fetchPayment(razorpayPaymentId);
      capturedPaise = payment.amountPaise;
      if (payment.orderId && payment.orderId !== razorpayOrderId) {
        console.error(`\n[RZP ${ts()}] ✗ ORDER MISMATCH (flight)\n  payment.order_id: ${payment.orderId}\n  body.orderId: ${razorpayOrderId}`);
        return err("Payment does not match this order.", 400, { razorpayPaymentId });
      }
      if (capturedPaise !== amountPaise) {
        console.warn(`\n[RZP ${ts()}] ⚠ client amountPaise (${amountPaise}) ≠ captured (${capturedPaise}); using captured.`);
      }
    } catch (e) {
      console.error(`\n[RZP ${ts()}] ⚠ fetchPayment failed; falling back to body amount\n  ERROR: ${e instanceof Error ? e.message : String(e)}`);
    }

    // ── Agent attribution (subdomain bookings only) ─────────────────────────
    const agentId = request.headers.get("x-agent-id") ?? undefined;
    const rawFare = tboFareFrom(booking.fareBreakdown, booking.returnFareBreakdown);
    const pricing = agentId ? await buildTwoTierPricing(rawFare, "flights", request) : null;

    // ── Persist record BEFORE calling TBO (durability guarantee) ────────────
    const now = new Date();
    await col.insertOne({
      razorpayOrderId,
      razorpayPaymentId,
      amountPaise: capturedPaise, // authoritative — from Razorpay, not the client
      currency: "INR",
      clientReferenceId,
      status: "payment_verified",
      refundInitiated: false,
      ...(agentId ? { agentId } : {}),
      ...(pricing ? { pricing } : {}),
      createdAt: now,
      updatedAt: now,
    });
    console.log(`\n[RZP ${ts()}] ← VERIFY_SIGNATURE (flight) [OK] — payment record persisted\n  paymentId: ${razorpayPaymentId}`);

    // ── Anti-tamper: captured amount must cover at least the raw supplier fare ──
    // `amountPaise` is chosen by the client at order creation, so a tampered
    // order could charge far less than the real fare. `capturedPaise` is what
    // Razorpay ACTUALLY captured; the raw TBO fare is the hard floor (the
    // customer always pays markup on top). A capture below the fare means the
    // order amount was tampered — refund and abort BEFORE booking with TBO.
    const expectedFloorPaise = Math.round(rawFare * 100);
    const PRICE_TOLERANCE_PAISE = 100; // ₹1 slack for rounding
    if (capturedPaise + PRICE_TOLERANCE_PAISE < expectedFloorPaise) {
      console.error(
        `\n[RZP ${ts()}] ✗ AMOUNT TAMPER (flight)` +
          `\n  capturedPaise: ${capturedPaise}\n  expectedFloorPaise: ${expectedFloorPaise}\n  paymentId: ${razorpayPaymentId}`,
      );
      await col.updateOne(
        { razorpayOrderId, razorpayPaymentId },
        { $set: { status: "tbo_failed", tboError: "amount_below_fare", updatedAt: new Date() } },
      );
      const refundId = await tryInitiateRefund(razorpayPaymentId, clientReferenceId, db);
      return err(
        "Payment amount did not match the fare for this booking. A refund has been initiated and will reflect in 5-7 business days.",
        422,
        { tboFailed: true, reason: "amount_mismatch", razorpayPaymentId, razorpayRefundInitiated: refundId !== null, refundId },
      );
    }

    // ── Book + Ticket server-side ────────────────────────────────────────────
    const result = await issueFlightBooking(booking);

    await col.updateOne(
      { razorpayOrderId, razorpayPaymentId },
      {
        $set: {
          status: "tbo_confirmed",
          pnr: result.pnr,
          bookingId: result.bookingId,
          ticketNumbers: result.ticketNumbers,
          returnPnr: result.returnPnr ?? null,
          returnBookingId: result.returnBookingId ?? null,
          updatedAt: new Date(),
        },
      },
    );

    // Confirmation email (fire-and-forget — never blocks the booking response).
    {
      const passengers = booking.passengers as Array<{ firstName: string; lastName: string; title?: string }>;
      const passengerNames = passengers.map((p) => `${p.title ?? ""} ${p.firstName} ${p.lastName}`.trim());
      const origin = (booking as { validation?: { origin?: string } }).validation?.origin ?? "";
      const destination = (booking as { validation?: { destination?: string } }).validation?.destination ?? "";
      const totalAmount = Math.round(capturedPaise / 100);
      sendFlightConfirmation({
        to: booking.contactEmail,
        pnr: result.pnr,
        bookingReference: clientReferenceId,
        origin,
        destination,
        passengerNames,
        totalAmount,
      }).catch((e: unknown) =>
        console.error("[mailer] flight confirmation email failed:", e instanceof Error ? e.message : String(e)),
      );
    }

    // Settlement attribution (fire-and-forget — never blocks the user).
    if (agentId && pricing) {
      fetch(new URL("/api/internal/record-booking", API_BASE), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentId, productType: "flight", pnr: result.pnr, ...pricing }),
        cache: "no-store",
      }).catch((e: unknown) => console.error("[record-booking] fire-and-forget failed:", e instanceof Error ? e.message : String(e)));
    }

    // Customer dashboard recording (main-site logged-in customers). Best-effort.
    {
      const v = (booking as { validation?: { origin?: string; destination?: string; airlineCode?: string } }).validation;
      void recordCustomerBooking({
        productType: "flight",
        pnr: result.pnr,
        amount: Math.round(capturedPaise / 100),
        details: {
          origin: v?.origin,
          destination: v?.destination,
          passengers: booking.passengers.length,
          airline: v?.airlineCode,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        pnr: result.pnr,
        bookingId: result.bookingId,
        ticketNumbers: result.ticketNumbers,
        bookingStatus: result.bookingStatus,
        ...(result.returnPnr ? { returnLeg: { pnr: result.returnPnr, bookingId: result.returnBookingId } } : {}),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const timeout = isTimeoutError(msg);
    const priceChanged = e instanceof TboPriceChangedError;
    logError("FLIGHT_VERIFY_PAYMENT", e, { razorpayPaymentId, razorpayOrderId, timeout, priceChanged });

    // Failed before persistence (bad signature / missing fields) — nothing to reconcile.
    if (!razorpayPaymentId || !razorpayOrderId || !amountPaise) {
      return err("Payment verification failed.", 400);
    }

    try {
      const db = await getDb();
      const col = db.collection<FlightPaymentRecord>(COLLECTION);

      // ── Partial (domestic return): outbound ticketed, inbound failed ──────────
      // The outbound ticket is real — do NOT blanket-refund. Flag for manual
      // reconciliation, record the issued outbound PNR, and return 202.
      if (e instanceof TboPartialBookingError) {
        await col.updateOne(
          { razorpayOrderId, razorpayPaymentId },
          {
            $set: {
              status: "tbo_partial",
              partialPnr: e.issued.pnr,
              bookingId: e.issued.bookingId,
              ticketNumbers: e.issued.ticketNumbers,
              tboError: e.reason,
              updatedAt: new Date(),
            },
          },
        );
        console.error(`\n[RZP ${ts()}] ⚠ FLIGHT PARTIAL BOOKING (outbound ticketed, inbound failed)\n  paymentId: ${razorpayPaymentId}\n  outboundPNR: ${e.issued.pnr}\n  reason: ${e.reason}\n  action: manual_reconciliation (NO auto-refund)`);
        return NextResponse.json(
          {
            success: false,
            tboPartial: true,
            razorpayPaymentId,
            clientReferenceId,
            partialPnr: e.issued.pnr,
            error: "Your outbound flight is ticketed but the return leg could not be confirmed. Our team will contact you to complete or adjust the return — no extra charge without your consent.",
          },
          { status: 202 },
        );
      }

      // ── Timeout: booking state unknown — DO NOT refund, flag for reconciliation ──
      if (timeout) {
        await col.updateOne(
          { razorpayOrderId, razorpayPaymentId },
          { $set: { status: "tbo_timeout", tboError: msg, updatedAt: new Date() } },
        );
        console.error(`\n[RZP ${ts()}] ✗ FLIGHT BOOKING TIMEOUT\n  paymentId: ${razorpayPaymentId}\n  clientRef: ${clientReferenceId}\n  action: reconcile_via_GetBookingDetails`);
        return NextResponse.json(
          { success: false, tboTimedOut: true, razorpayPaymentId, clientReferenceId,
            error: "Booking request timed out. Your payment was received — we will confirm by email or you can contact support with reference ID: " + clientReferenceId },
          { status: 202 },
        );
      }

      // ── Hard failure / price change → refund (idempotent) ───────────────────
      await col.updateOne(
        { razorpayOrderId, razorpayPaymentId },
        { $set: { status: "tbo_failed", tboError: msg, updatedAt: new Date() } },
      );
      const refundId = await tryInitiateRefund(razorpayPaymentId, clientReferenceId ?? "", db);
      const reason = priceChanged ? "price_changed" : "booking_failed";
      const userMessage = priceChanged
        ? "The fare changed before your ticket could be issued. A full refund has been initiated and will reflect in 5-7 business days — please search again for the latest price."
        : "Flight booking failed. A full refund has been initiated and will reflect in 5-7 business days.";
      console.error(`\n[RZP ${ts()}] ✗ FLIGHT BOOKING FAILURE\n  reason: ${reason}\n  paymentId: ${razorpayPaymentId}\n  refundInitiated: ${refundId !== null}`);
      return NextResponse.json(
        { success: false, tboFailed: true, reason, razorpayPaymentId, razorpayRefundInitiated: refundId !== null, refundId, error: userMessage },
        { status: 422 },
      );
    } catch (dbErr) {
      console.error(`\n[RZP ${ts()}] ✗ DB ERROR during failure handling\n  ERROR: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`);
      if (e instanceof TboError) {
        return err(`Booking failed. Please contact support with payment ID: ${razorpayPaymentId}`, 422, { tboFailed: true, razorpayPaymentId, razorpayRefundInitiated: false });
      }
      return err("An unexpected error occurred. Please contact support.", 500, { razorpayPaymentId });
    }
  }
}
