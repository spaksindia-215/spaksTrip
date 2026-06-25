import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

// Records a confirmed booking against the logged-in customer so it appears on their
// dashboard. Used by the Next.js booking routes that run the TBO flow INLINE
// (hotels always; flights when TBO_PROXY_FLIGHTS is off). When the flight proxy is
// on, the equivalent recording happens in-process on the Express controller instead,
// so exactly one path records per request — never both.
//
// Best-effort by contract: the TBO booking is already confirmed by the time this runs.
// A missing/expired customer cookie (e.g. an agent-subdomain or guest checkout) is a
// silent no-op; failures are swallowed and logged, never blocking the booking response.
export interface RecordCustomerBookingPayload {
  productType: "flight" | "hotel" | "taxi" | "tour" | "cruise" | "package";
  pnr?: string;
  amount: number;
  currency?: string;
  details?: Record<string, unknown>;
}

export async function recordCustomerBooking(payload: RecordCustomerBookingPayload): Promise<void> {
  try {
    if (!Number.isFinite(payload.amount) || payload.amount <= 0) return;
    const cookieHeader = (await cookies()).toString();
    if (!cookieHeader) return; // no session → nothing to attribute

    const res = await fetch(new URL("/api/customer/bookings", API_BASE), {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieHeader },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    // 401 (not a logged-in customer) is expected for guest/agent flows — don't log it.
    if (!res.ok && res.status !== 401 && res.status !== 403) {
      console.error(`[customer-booking] record failed: HTTP ${res.status}`);
    }
  } catch (e) {
    console.error("[customer-booking] record failed:", e instanceof Error ? e.message : String(e));
  }
}
