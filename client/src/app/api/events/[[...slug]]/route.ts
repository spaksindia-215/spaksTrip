import { type NextRequest, NextResponse } from "next/server";
import { proxyToRailway } from "@/lib/railwayProxy";

// Same-origin proxy for the public events API + customer booking endpoints,
// forwarding to the Express backend (Railway). Optional catch-all so both
// /api/events (listing, needs the query string) and /api/events/<slug>/book are
// covered. The query string is appended explicitly — proxyToRailway only carries
// the path.
type Context = { params: Promise<{ slug?: string[] }> };

async function handler(req: NextRequest, { params }: Context): Promise<NextResponse> {
  const { slug } = await params;
  const sub = slug && slug.length > 0 ? `/${slug.join("/")}` : "";
  return proxyToRailway(req, `/api/events${sub}${req.nextUrl.search}`);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
