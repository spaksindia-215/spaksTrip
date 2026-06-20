import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/razorpay";
import { flightProxyEnabled, forwardToRailway } from "@/lib/tboProxy";
import { verifyPriceToken } from "@/lib/priceToken";

export const runtime = "nodejs";

function ts() {
  return new Date().toISOString();
}

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// POST /api/flights/razorpay/create-order
// Creates a Razorpay order for the flight booking total (test or live, per keys).
// NEVER returns or logs RAZORPAY_KEY_SECRET.
export async function POST(request: NextRequest) {
  if (flightProxyEnabled()) return forwardToRailway(request);

  try {
    const body = await request.json();
    const { amountPaise, clientReferenceId, route, priceToken } = body;

    if (typeof amountPaise !== "number" || amountPaise < 100) {
      return err("amountPaise must be a number >= 100 (smallest INR unit: paise).", 400);
    }
    if (!clientReferenceId || typeof clientReferenceId !== "string") {
      return err("clientReferenceId is required.", 400);
    }

    // Anti-tamper: order amount must clear the signed price floor from FareQuote.
    // No-op (skipped) when PRICE_TOKEN_SECRET is unset.
    const priceCheck = verifyPriceToken(
      typeof priceToken === "string" ? priceToken : undefined,
      amountPaise,
    );
    if (!priceCheck.ok) {
      console.error(`\n[RZP ${ts()}] ✗ PRICE TOKEN INVALID (flight)\n  reason: ${priceCheck.reason}\n  amount_paise: ${amountPaise}`);
      return err("Price verification failed. Please search again for the latest fare.", 409);
    }

    console.log(
      `\n[RZP ${ts()}] → CREATE_ORDER (flight)` +
        `\n  receipt: ${clientReferenceId}` +
        `\n  amount_paise: ${amountPaise}` +
        `\n  currency: INR` +
        `\n  route: ${route ?? "unknown"}`,
    );

    const order = await createOrder({
      amountPaise,
      receipt: clientReferenceId,
      notes: {
        clientReferenceId,
        product: "flight",
        route: String(route ?? ""),
      },
    });

    console.log(
      `\n[RZP ${ts()}] ← CREATE_ORDER (flight) [OK]` +
        `\n  orderId: ${order.id}` +
        `\n  amount_paise: ${order.amount}` +
        `\n  currency: ${order.currency}`,
    );

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`\n[RZP ${ts()}] ✗ CREATE_ORDER (flight) FAILED\n  ERROR: ${msg}`);
    return err("Failed to create payment order. Please try again.", 500);
  }
}
