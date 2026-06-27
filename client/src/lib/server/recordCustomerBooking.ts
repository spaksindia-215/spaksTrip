import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

// Records a confirmed booking so it appears on a customer dashboard. Used by the
// Next.js booking routes that run the TBO flow INLINE (hotels always; flights when
// TBO_PROXY_FLIGHTS is off). When the flight proxy is on, the equivalent recording
// happens in-process on the Express controller instead, so exactly one path records
// per request — never both.
//
// The server endpoint derives the owner from the forwarded cookie: a logged-in
// customer → owned booking; otherwise (guest) it's tagged with `claimEmail` and
// claimed when that email later registers/logs in. Pass the contact email as
// `claimEmail` so guest bookings can be reunited with the account.
//
// Best-effort by contract: the TBO booking is already confirmed by the time this
// runs; failures are swallowed and logged, never blocking the booking response.
export interface RecordCustomerBookingPayload {
  productType: "flight" | "hotel" | "taxi" | "tour" | "cruise" | "package";
  pnr?: string;
  amount: number;
  currency?: string;
  claimEmail?: string;
  details?: Record<string, unknown>;
}

export async function recordCustomerBooking(payload: RecordCustomerBookingPayload): Promise<void> {
  try {
    if (!Number.isFinite(payload.amount) || payload.amount <= 0) return;
    // Nothing to attribute when there's neither a session nor a contact email.
    const cookieHeader = (await cookies()).toString();
    if (!cookieHeader && !payload.claimEmail) return;

    const res = await fetch(new URL("/api/internal/record-customer-booking", API_BASE), {
      method: "POST",
      headers: { "content-type": "application/json", ...(cookieHeader ? { cookie: cookieHeader } : {}) },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[customer-booking] record failed: HTTP ${res.status}`);
    }
  } catch (e) {
    console.error("[customer-booking] record failed:", e instanceof Error ? e.message : String(e));
  }
}
