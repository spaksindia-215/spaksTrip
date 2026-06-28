import { type NextRequest, NextResponse } from "next/server";
import { proxyToRailway } from "@/lib/railwayProxy";

type Context = { params: Promise<{ slug?: string[] }> };

async function handler(req: NextRequest, { params }: Context): Promise<NextResponse> {
  const { slug } = await params;
  const sub = slug && slug.length > 0 ? `/${slug.join("/")}` : "";
  return proxyToRailway(req, `/api/visa${sub}${req.nextUrl.search}`);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
