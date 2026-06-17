import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Temporary diagnostic route — DELETE BEFORE PRODUCTION.
// GET /api/tbo-insurance/test-search
//
// Returns the exact JSON sent to TBO and the exact raw JSON response received.
// Share the output of this route with TBO support when opening a ticket.
export async function GET() {
  const AUTH_URL =
    process.env.TBO_INSURANCE_AUTH_URL ??
    "http://sharedapi.tektravels.com/SharedData.svc/rest/Authenticate";
  const SEARCH_URL =
    "https://InsuranceBE.tektravels.com/InsuranceService.svc/rest/Search";

  // ── Step 1: Authenticate and capture raw auth exchange ──────────────────────
  const authPayload = {
    ClientId: "ApiIntegrationNew",
    UserName: process.env.TBO_INSURANCE_USERNAME ?? "",
    Password: "[REDACTED]",
    EndUserIp: process.env.TBO_INSURANCE_SERVER_IP ?? "1.1.1.1",
  };

  let tokenId: string;
  let authResponse: unknown;
  let authStatus: number;

  try {
    // Fetch token directly (not from cache) so we capture the raw response
    const authRes = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        ...authPayload,
        Password: process.env.TBO_INSURANCE_API_PASSWORD ?? "",
      }),
      cache: "no-store",
    });
    authStatus = authRes.status;
    authResponse = await authRes.json().catch(() => authRes.text());
    const ar = authResponse as { Status?: number; TokenId?: string };
    if (ar.Status !== 1 || !ar.TokenId) {
      return NextResponse.json({
        verdict: "AUTH_FAILED",
        authRequest: { url: AUTH_URL, payload: authPayload },
        authResponse: { httpStatus: authStatus, body: authResponse },
      }, { status: 500 });
    }
    tokenId = ar.TokenId;
  } catch (err) {
    return NextResponse.json(
      { verdict: "AUTH_NETWORK_ERROR", error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  // ── Step 2: Search and capture raw search exchange ───────────────────────────
  // TBO-provided test case (domestic India insurance)
  const searchPayload = {
    PlanCategory: 1,
    PlanType: 1,
    PlanCoverage: 4,
    TravelStartDate: "2026-07-25T00:00:00",
    NoOfPax: 1,
    PaxAge: [25],
    EndUserIp: process.env.TBO_INSURANCE_SERVER_IP ?? "1.1.1.1",
    TokenId: tokenId,
  };

  let searchResponse: unknown;
  let searchStatus: number;

  try {
    const searchRes = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip",
      },
      body: JSON.stringify(searchPayload),
      cache: "no-store",
    });
    searchStatus = searchRes.status;
    searchResponse = await searchRes.json().catch(() => searchRes.text());
  } catch (err) {
    return NextResponse.json(
      { verdict: "SEARCH_NETWORK_ERROR", error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  const r = (searchResponse as {
    Response?: {
      ResponseStatus?: number;
      Error?: { ErrorCode?: number; ErrorMessage?: string };
      Results?: unknown[];
      TraceId?: string;
    };
  })?.Response;

  const verdict =
    r?.ResponseStatus === 1 && Array.isArray(r?.Results) && r.Results.length > 0
      ? `PASS — ${r.Results.length} plan(s) returned`
      : r?.ResponseStatus === 2 && r?.Error?.ErrorCode === 2
      ? "NO_RESULTS — insurance inventory not enabled for this agency"
      : "UNEXPECTED_RESPONSE";

  return NextResponse.json({
    verdict,
    authExchange: {
      url: AUTH_URL,
      requestPayload: authPayload,
      httpStatus: authStatus,
      // Redact token from auth response for safe sharing
      response: (() => {
        const copy = JSON.parse(JSON.stringify(authResponse));
        if (copy?.TokenId) copy.TokenId = "[REDACTED]";
        return copy;
      })(),
    },
    searchExchange: {
      url: SEARCH_URL,
      requestPayload: { ...searchPayload, TokenId: "[REDACTED]" },
      httpStatus: searchStatus,
      response: searchResponse,
    },
  });
}
