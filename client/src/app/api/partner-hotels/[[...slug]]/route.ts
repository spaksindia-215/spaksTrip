import { type NextRequest, NextResponse } from "next/server";
import { proxyToRailway } from "@/lib/railwayProxy";

// Same-origin proxy for the public partner-hotel API (search shown alongside TBO
// results) + the guest/customer enquiry endpoint, forwarding to the Express
// backend. Optional catch-all so both /api/partner-hotels (search, needs the
// query string) and /api/partner-hotels/<id>/enquire are covered.
type Context = { params: Promise<{ slug?: string[] }> };

async function handler(req: NextRequest, { params }: Context): Promise<NextResponse> {
  const { slug } = await params;
  const sub = slug && slug.length > 0 ? `/${slug.join("/")}` : "";
  return proxyToRailway(req, `/api/partner-hotels${sub}${req.nextUrl.search}`);
}

export const GET = handler;
export const POST = handler;
