import { type NextRequest, type NextResponse } from "next/server";
import { proxyToRailway } from "./railwayProxy";

// Per-domain kill-switch for the TBO → Railway migration.
//
// When the flag is "true", the matching Next.js /api/<domain>/* route forwards the
// request to the Railway backend (which holds the TBO integration + static egress IP)
// instead of running the inline adapter. Flip the env var off on Vercel for an
// instant rollback to the original inline behavior — no redeploy of code required.
//
// These are server-side env vars (NOT NEXT_PUBLIC) read inside route handlers.

export function flightProxyEnabled(): boolean {
  return process.env.TBO_PROXY_FLIGHTS === "true";
}

export function hotelProxyEnabled(): boolean {
  return process.env.TBO_PROXY_HOTELS === "true";
}

// Forwards the current request to Railway preserving path + query 1:1. The Next and
// Railway route paths are identical, so req.nextUrl.pathname maps straight through.
export function forwardToRailway(req: NextRequest): Promise<NextResponse> {
  return proxyToRailway(req, req.nextUrl.pathname + req.nextUrl.search);
}
