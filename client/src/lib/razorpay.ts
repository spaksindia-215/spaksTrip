import "server-only";
import Razorpay from "razorpay";
import crypto from "crypto";

function getInstance(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function createOrder(params: {
  amountPaise: number;
  receipt: string; // max 40 chars
  notes?: Record<string, string>;
}) {
  const rzp = getInstance();
  return rzp.orders.create({
    amount: params.amountPaise,
    currency: "INR",
    receipt: params.receipt.slice(0, 40),
    notes: params.notes,
  });
}

// Constant-time HMAC-SHA256 comparison — prevents timing attacks.
export function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("RAZORPAY_KEY_SECRET is not set");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex"),
    );
  } catch {
    // timingSafeEqual throws when buffers have different lengths (i.e. invalid signature)
    return false;
  }
}

export async function initiateRefund(params: {
  paymentId: string;
  amountPaise: number;
  notes?: Record<string, string>;
}) {
  const rzp = getInstance();
  return rzp.payments.refund(params.paymentId, {
    amount: params.amountPaise,
    notes: params.notes,
  });
}
