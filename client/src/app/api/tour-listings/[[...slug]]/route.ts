import { type NextRequest, NextResponse } from "next/server";
import { proxyToRailway } from "@/lib/railwayProxy";

// Same-origin proxy for the public tour-listings browse API, forwarding to the
// Express backend (Railway). Optional catch-all covers:
//   /api/tour-listings               → listing browse
//   /api/tour-listings/destinations  → destination grid
//   /api/tour-listings/:slug         → single listing detail
type Context = { params: Promise<{ slug?: string[] }> };

async function handler(req: NextRequest, { params }: Context): Promise<NextResponse> {
  const { slug } = await params;
  const sub = slug && slug.length > 0 ? `/${slug.join("/")}` : "";
  return proxyToRailway(req, `/api/tour-listings${sub}${req.nextUrl.search}`);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
