import { NextRequest, NextResponse } from "next/server";
import { tboGetSSR } from "@/lib/adapters/tbo/flight/ssr";
import { TboFareExpiredError } from "@/lib/adapters/tbo/errors";
import { flightProxyEnabled, forwardToRailway } from "@/lib/tboProxy";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (flightProxyEnabled()) return forwardToRailway(req);

  try {
    const { id } = await params;
    if (!id) return err("id (ResultIndex) is required.", 400);

    // Accept explicit traceId from client for serverless compatibility.
    const traceId = req.nextUrl.searchParams.get("traceId") ?? undefined;

    const result = await tboGetSSR(decodeURIComponent(id), traceId);
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    if (e instanceof TboFareExpiredError) {
      return err("Fare has expired. Please search again.", 410);
    }
    const message = e instanceof Error ? e.message : "SSR fetch failed";
    return err(message, 500);
  }
}
