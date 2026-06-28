import { type NextRequest, NextResponse } from "next/server";
import { proxyToRailway } from "@/lib/railwayProxy";

// Same-origin proxy for the public partner-accommodation API (navbar
// "Accommodation" surface), forwarding to the Express backend. Optional catch-all
// so both /api/accommodation (browse, needs the query string) and
// /api/accommodation/<slug> (detail) are covered.
type Context = { params: Promise<{ slug?: string[] }> };

async function handler(req: NextRequest, { params }: Context): Promise<NextResponse> {
  const { slug } = await params;
  const sub = slug && slug.length > 0 ? `/${slug.join("/")}` : "";
  return proxyToRailway(req, `/api/accommodation${sub}${req.nextUrl.search}`);
}

export const GET = handler;
