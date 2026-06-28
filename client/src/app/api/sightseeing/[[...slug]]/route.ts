import { type NextRequest, NextResponse } from "next/server";
import { proxyToRailway } from "@/lib/railwayProxy";

// Same-origin proxy for the public SightSeeing API + the customer/guest enquiry
// endpoint, forwarding to the Express backend (Railway). Optional catch-all so both
// /api/sightseeing (browse, needs the query string) and
// /api/sightseeing/<slug>/enquire are covered. The query string is appended
// explicitly — proxyToRailway only carries the path.
type Context = { params: Promise<{ slug?: string[] }> };

async function handler(req: NextRequest, { params }: Context): Promise<NextResponse> {
  const { slug } = await params;
  const sub = slug && slug.length > 0 ? `/${slug.join("/")}` : "";
  return proxyToRailway(req, `/api/sightseeing${sub}${req.nextUrl.search}`);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
