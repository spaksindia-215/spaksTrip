import { type NextRequest, NextResponse } from "next/server";

// Best-effort, in-memory rate limiter for the Next.js /api/* routes.
//
// IMPORTANT: this runs inside Next middleware. On serverless each instance has
// its own memory, so this is a per-instance burst guard — NOT a globally exact
// limit. The authoritative limiter for proxied traffic lives on Express
// (server/src/middleware/rateLimit.ts). This layer protects the routes that run
// *inline* in Next (e.g. hotel payments, bus search) where Express never sees
// the request.
//
// Tiers mirror the Express profile (strict):
//   auth     — 20 / 15 min
//   booking  — 10 / min  (razorpay/create-order, verify-payment, book, ticket, cancel)
//   search   — 60 / min  (search, fare-quote, fare-rule, ssr, prebook, cities, …)
//   api      — 300 / min (catch-all)

type Tier = "auth" | "booking" | "search" | "api";

interface TierConfig {
  windowMs: number;
  max: number;
}

const TIERS: Record<Tier, TierConfig> = {
  auth: { windowMs: 15 * 60 * 1000, max: 20 },
  booking: { windowMs: 60 * 1000, max: 10 },
  search: { windowMs: 60 * 1000, max: 60 },
  api: { windowMs: 60 * 1000, max: 300 },
};

// key → { count, resetAt }. A single Map keeps memory bounded by active clients;
// expired buckets are reclaimed lazily on access.
const buckets = new Map<string, { count: number; resetAt: number }>();

function classify(pathname: string): Tier {
  if (pathname.startsWith("/api/auth")) return "auth";
  if (
    pathname.includes("/razorpay/") ||
    pathname.endsWith("/book") ||
    pathname.includes("/book/") ||
    pathname.endsWith("/ticket") ||
    pathname.includes("/cancel")
  ) {
    return "booking";
  }
  if (
    pathname.includes("/search") ||
    pathname.includes("/fare-quote") ||
    pathname.includes("/fare-rule") ||
    pathname.includes("/calendar-fare") ||
    pathname.includes("/ssr") ||
    pathname.includes("/prebook") ||
    pathname.includes("/seat-layout") ||
    pathname.includes("/cities") ||
    pathname.includes("/static-details")
  ) {
    return "search";
  }
  return "api";
}

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Returns a 429 NextResponse if the caller has exceeded the tier limit for this
 * path, otherwise null (caller should continue). Internal server-to-server
 * routes (/api/internal) are never limited.
 */
export function rateLimit(req: NextRequest, pathname: string): NextResponse | null {
  if (pathname.startsWith("/api/internal")) return null;

  const tier = classify(pathname);
  const { windowMs, max } = TIERS[tier];
  const key = `${tier}:${clientIp(req)}`;
  const now = Date.now();

  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count += 1;
  if (entry.count > max) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }
  return null;
}
