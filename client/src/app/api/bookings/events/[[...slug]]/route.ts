import { type NextRequest, NextResponse } from "next/server";
import { proxyToRailway } from "@/lib/railwayProxy";

// Same-origin proxy for a customer's own event bookings (auth-scoped on the
// Express side). Forwards /api/bookings/events[/...] to Railway.
type Context = { params: Promise<{ slug?: string[] }> };

async function handler(req: NextRequest, { params }: Context): Promise<NextResponse> {
  const { slug } = await params;
  const sub = slug && slug.length > 0 ? `/${slug.join("/")}` : "";
  return proxyToRailway(req, `/api/bookings/events${sub}${req.nextUrl.search}`);
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
