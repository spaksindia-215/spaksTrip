import crypto from "crypto";

// Signed price token (anti-tamper for the quoted → paid amount).
//
// Server-only (used inside Next route handlers on the nodejs runtime — the
// secret is NOT NEXT_PUBLIC and never reaches the browser). Minted at FareQuote
// where the canonical marked-up payable amount is computed, then required +
// verified at order creation so a client can't create an order for less than it
// was quoted.
//
// Format: `base64url(JSON{ref,amt,exp})` + "." + HMAC-SHA256(body, secret).
//
// GRACEFUL DEGRADATION: if PRICE_TOKEN_SECRET is unset the feature is OFF —
// signing returns "" and verification passes (skipped). Set the SAME
// PRICE_TOKEN_SECRET on this app and the Express server to enable enforcement.

const SECRET = process.env.PRICE_TOKEN_SECRET ?? "";
const DEFAULT_TTL_MS = 20 * 60 * 1000; // 20 min — within TBO's 15-min trace + slack
const AMOUNT_TOLERANCE_PAISE = 100; // ₹1 rounding slack

interface PricePayload {
  ref: string;
  amt: number; // paise
  exp: number; // epoch ms
}

export function priceTokenEnabled(): boolean {
  return SECRET.length > 0;
}

export function signPriceToken(ref: string, amountPaise: number, ttlMs: number = DEFAULT_TTL_MS): string {
  if (!SECRET) return ""; // feature off — caller emits no token
  const payload: PricePayload = { ref, amt: Math.round(amountPaise), exp: Date.now() + ttlMs };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("hex");
  return `${body}.${sig}`;
}

export type VerifyResult = { ok: true; skipped?: boolean } | { ok: false; reason: string };

/**
 * Verify a price token against the amount being charged. `expectedRef`, when
 * provided, is also checked (anti-swap across products). Returns ok:true with
 * skipped:true when the feature is disabled.
 */
export function verifyPriceToken(
  token: string | undefined,
  amountPaise: number,
  expectedRef?: string,
): VerifyResult {
  if (!SECRET) return { ok: true, skipped: true };
  if (!token) return { ok: false, reason: "missing" };
  const [body, sig] = token.split(".");
  if (!body || !sig) return { ok: false, reason: "malformed" };

  const expected = crypto.createHmac("sha256", SECRET).update(body).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false, reason: "bad_signature" };

  let payload: PricePayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString()) as PricePayload;
  } catch {
    return { ok: false, reason: "unparsable" };
  }
  if (typeof payload.exp !== "number" || payload.exp < Date.now()) return { ok: false, reason: "expired" };
  if (expectedRef !== undefined && payload.ref !== expectedRef) return { ok: false, reason: "ref_mismatch" };
  // FLOOR semantics: the signed amount is the minimum the customer must be
  // charged (the server-quoted supplier fare). The displayed price always sits
  // above it (markup + taxes/fees), so a legitimate order never trips this — but
  // an order created below the quoted fare is rejected. (Exact binding isn't
  // possible while the final payable is computed client-side; see signPriceToken
  // callers / the pricing notes.)
  if (Math.round(amountPaise) + AMOUNT_TOLERANCE_PAISE < payload.amt) {
    return { ok: false, reason: "below_quoted_floor" };
  }
  return { ok: true };
}
