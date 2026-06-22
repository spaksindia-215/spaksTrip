import { NextRequest, NextResponse } from "next/server";
import { tboFareQuote } from "@/lib/adapters/tbo/flight/fareQuote";
import { TboFareExpiredError } from "@/lib/adapters/tbo/errors";
import { buildFarePricer } from "@/lib/server/agentMarkup";
import { flightProxyEnabled, forwardToRailway } from "@/lib/tboProxy";
import { signPriceToken } from "@/lib/priceToken";

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

    // Accept explicit traceId from client — required for serverless deployments
    // where the server-side traceCache may not survive across function instances.
    const traceId = req.nextUrl.searchParams.get("traceId") ?? undefined;

    // Guideline §6 (LCC special return): when the outbound and inbound ResultIndexes
    // are passed together, FareQuote must receive them as a single comma-separated
    // value ("OB4,IB4") so TBO prices both legs in one call.
    const returnId = req.nextUrl.searchParams.get("returnId") ?? undefined;
    const resultIndex = returnId
      ? `${decodeURIComponent(id)},${decodeURIComponent(returnId)}`
      : decodeURIComponent(id);

    const result = await tboFareQuote(resultIndex, traceId);

    const priceFlight = await buildFarePricer("flights", req);
    result.totalFare = priceFlight(result.totalFare);
    if (result.updatedOffer) {
      result.updatedOffer.basePrice = priceFlight(result.updatedOffer.basePrice);
    }

    // Mint a signed price token binding the server-quoted supplier fare (the
    // FLOOR the order amount must clear). The client echoes it at create-order;
    // the server rejects any order created below this floor (see
    // /api/flights/razorpay/create-order). Empty when PRICE_TOKEN_SECRET is unset.
    const rawFarePaise = Math.round(
      result.fareBreakdown.reduce((acc, b) => acc + b.BaseFare + b.Tax + b.YQTax, 0) * 100,
    );
    const priceToken = signPriceToken(resultIndex, rawFarePaise);

    return NextResponse.json({ success: true, data: { ...result, priceToken } });
  } catch (e) {
    if (e instanceof TboFareExpiredError) {
      return err("Fare has expired. Please search again.", 410);
    }
    const message = e instanceof Error ? e.message : "FareQuote failed";
    return err(message, 500);
  }
}
