#!/usr/bin/env node
/**
 * TBO Flight Sample Verification Runner
 *
 * Executes the full LCC Domestic Return flow (2A + 1C + 1I) end-to-end
 * and writes every request + response into ../sampleVerificationLogs/*.txt,
 * then assembles consolidated.txt for emailing to TBO.
 *
 * Primary destination: BLR
 * Fallback destinations (in order): CCU, MAA
 *
 * The runner walks the destination list and stops at the first one that
 * returns at least one LCC outbound result AND one LCC inbound result.
 *
 * Usage:
 *   node scripts/run-sample-verification.js
 *
 * Credentials are read from client/.env.local (TBO_USER_NAME, TBO_PASSWORD,
 * TBO_END_USER_IP) or fall back to environment variables / defaults.
 *
 * Requirements: Node 20+ (uses global fetch).
 */

"use strict";

const fs = require("fs");
const path = require("path");

// ─── Config ─────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, "..");
const LOG_DIR = path.join(ROOT, "sampleVerificationLogs");

const AUTH_URL = "https://sharedapi.tektravels.com/SharedData.svc/rest/Authenticate";
const AIR_BASE = "https://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest";
const URLS = {
  search: `${AIR_BASE}/Search`,
  fareRule: `${AIR_BASE}/FareRule`,
  fareQuote: `${AIR_BASE}/FareQuote`,
  ssr: `${AIR_BASE}/SSR`,
  ticket: `${AIR_BASE}/Ticket`,
  getBookingDetails: `${AIR_BASE}/GetBookingDetails`,
};

const ORIGIN = "DEL";
const DESTINATIONS = ["BLR", "CCU", "MAA"];   // primary + fallbacks
const OUTBOUND_DATE = "2026-06-20";
const INBOUND_DATE  = "2026-06-27";

const PASSENGER_DEFS = [
  { Title: "Mr",   FirstName: "RAHUL", LastName: "SHARMA", PaxType: 1,
    DateOfBirth: "1985-03-15T00:00:00", Gender: 1, IsLeadPax: true,
    Email: "rahul.sharma@example.com", ContactNo: "9810001234" },
  { Title: "Mrs",  FirstName: "PRIYA", LastName: "SHARMA", PaxType: 1,
    DateOfBirth: "1988-07-22T00:00:00", Gender: 2, IsLeadPax: false },
  { Title: "Mstr", FirstName: "ROHAN", LastName: "SHARMA", PaxType: 2,
    DateOfBirth: "2017-05-10T00:00:00", Gender: 1, IsLeadPax: false },
  { Title: "Mstr", FirstName: "KABIR", LastName: "SHARMA", PaxType: 3,
    DateOfBirth: "2025-01-20T00:00:00", Gender: 1, IsLeadPax: false },
];

const COMMON_ADDR = {
  AddressLine1: "45 Prithviraj Road",
  City: "New Delhi",
  CountryCode: "IN",
  CountryName: "India",
  Nationality: "IN",
};

// ─── Env loading ────────────────────────────────────────────────────────────
function loadEnvLocal() {
  const candidate = path.join(ROOT, "client", ".env.local");
  if (!fs.existsSync(candidate)) return;
  const lines = fs.readFileSync(candidate, "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*(#.*)?$/);
    if (!m) continue;
    const k = m[1], v = m[2].replace(/^["']|["']$/g, "").trim();
    if (process.env[k] === undefined) process.env[k] = v;
  }
}
loadEnvLocal();

const CLIENT_ID = process.env.TBO_CLIENT_ID || "ApiIntegrationNew";
const USER_NAME = process.env.TBO_USER_NAME || process.env.TBO_USERNAME || "Spaks";
const PASSWORD  = process.env.TBO_PASSWORD || "Spaks@123";
const END_USER_IP = process.env.TBO_END_USER_IP || "1.1.1.1";

// ─── HTTP ───────────────────────────────────────────────────────────────────
async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error(`Non-JSON response from ${url} (HTTP ${res.status}): ${text.slice(0, 400)}`); }
  return { status: res.status, ok: res.ok, json };
}

// ─── Log writers ────────────────────────────────────────────────────────────
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const STEP_ORDER = [
  ["auth",                    "STEP 1 — AUTHENTICATE",          AUTH_URL,        true],
  ["search",                  "STEP 2 — SEARCH",                URLS.search,      true],
  ["fareRule",                "STEP 3 — FARERULE (OB,IB)",      URLS.fareRule,    true],
  ["fareQuoteOb",             "STEP 4 — FAREQUOTE (OB)",        URLS.fareQuote,   true],
  ["fareQuoteIb",             "STEP 5 — FAREQUOTE (IB)",        URLS.fareQuote,   true],
  ["ssrOb",                   "STEP 6 — SSR (OB)",              URLS.ssr,         false],
  ["ssrIb",                   "STEP 7 — SSR (IB)",              URLS.ssr,         false],
  ["ticketOb",                "STEP 8 — TICKET (OB)",           URLS.ticket,      true],
  ["ticketIb",                "STEP 9 — TICKET (IB)",           URLS.ticket,      true],
  ["getBookingDetailsOb",     "STEP 10 — GETBOOKINGDETAILS (OB)", URLS.getBookingDetails, true],
  ["getBookingDetailsIb",     "STEP 11 — GETBOOKINGDETAILS (IB)", URLS.getBookingDetails, true],
];

function maskAuthBody(body) {
  if (body && body.Password) return { ...body, Password: "***" };
  return body;
}
function maskAuthResp(json) {
  if (json && json.TokenId) return { ...json, TokenId: json.TokenId.slice(0, 6) + "..." + json.TokenId.slice(-4) };
  return json;
}

function writeReq(slug, label, url, body, { maskPassword = false } = {}) {
  const file = path.join(LOG_DIR, `${slug}Request.txt`);
  const masked = maskPassword ? maskAuthBody(body) : body;
  const out = [
    "==================================================================",
    `${label} — REQUEST`,
    "==================================================================",
    `POST ${url}`,
    "Content-Type: application/json",
    "",
    JSON.stringify(masked, null, 2),
    "",
  ].join("\n");
  fs.writeFileSync(file, out);
  return file;
}

function writeRes(slug, label, status, body, { maskToken = false } = {}) {
  const file = path.join(LOG_DIR, `${slug}Response.txt`);
  const masked = maskToken ? maskAuthResp(body) : body;
  const out = [
    "==================================================================",
    `${label} — RESPONSE (HTTP ${status})`,
    "==================================================================",
    "",
    JSON.stringify(masked, null, 2),
    "",
  ].join("\n");
  fs.writeFileSync(file, out);
  return file;
}

// ─── Body builders ──────────────────────────────────────────────────────────
function authBody() {
  return { ClientId: CLIENT_ID, UserName: USER_NAME, Password: PASSWORD, EndUserIp: END_USER_IP };
}

function searchBody(token, destination) {
  return {
    TokenId: token,
    EndUserIp: END_USER_IP,
    AdultCount: "2",
    ChildCount: "1",
    InfantCount: "1",
    DirectFlight: "false",
    OneStopFlight: "false",
    JourneyType: "2",
    PreferredAirlines: null,
    Segments: [
      {
        Origin: ORIGIN,
        Destination: destination,
        FlightCabinClass: "2",
        PreferredDepartureTime: `${OUTBOUND_DATE}T00:00:00`,
        PreferredArrivalTime: `${OUTBOUND_DATE}T00:00:00`,
      },
      {
        Origin: destination,
        Destination: ORIGIN,
        FlightCabinClass: "2",
        PreferredDepartureTime: `${INBOUND_DATE}T00:00:00`,
        PreferredArrivalTime: `${INBOUND_DATE}T00:00:00`,
      },
    ],
    Sources: null,
  };
}

function fareRuleBody(token, traceId, obIdx, ibIdx) {
  return { TokenId: token, EndUserIp: END_USER_IP, ResultIndex: `${obIdx},${ibIdx}`, TraceId: traceId };
}

function fareQuoteBody(token, traceId, resultIndex) {
  return { TokenId: token, EndUserIp: END_USER_IP, ResultIndex: resultIndex, TraceId: traceId };
}

function ssrBody(token, traceId, resultIndex) {
  return { TokenId: token, EndUserIp: END_USER_IP, ResultIndex: resultIndex, TraceId: traceId };
}

function extractFareByPax(fareBreakdown) {
  const map = {
    1: { BaseFare: 0, Tax: 0, YQTax: 0 },
    2: { BaseFare: 0, Tax: 0, YQTax: 0 },
    3: { BaseFare: 0, Tax: 0, YQTax: 0 },
  };
  if (!Array.isArray(fareBreakdown)) return map;
  for (const b of fareBreakdown) {
    const c = b.PassengerCount || 1;
    const pt = b.PassengerType;
    if (map[pt]) {
      map[pt] = {
        BaseFare: (b.BaseFare || 0) / c,
        Tax:      (b.Tax || 0)      / c,
        YQTax:    (b.YQTax || 0)    / c,
      };
    }
  }
  return map;
}

function buildPassengers(perPaxFare) {
  return PASSENGER_DEFS.map((p) => {
    const fare = perPaxFare[p.PaxType] || { BaseFare: 0, Tax: 0, YQTax: 0 };
    const pax = {
      Title: p.Title,
      FirstName: p.FirstName,
      LastName: p.LastName,
      PaxType: p.PaxType,
      DateOfBirth: p.DateOfBirth,
      Gender: p.Gender,
      AddressLine1: COMMON_ADDR.AddressLine1,
      City: COMMON_ADDR.City,
      CountryCode: COMMON_ADDR.CountryCode,
      CountryName: COMMON_ADDR.CountryName,
      Nationality: COMMON_ADDR.Nationality,
      IsLeadPax: p.IsLeadPax,
      Fare: {
        Currency: "INR",
        BaseFare: String(fare.BaseFare),
        Tax: String(fare.Tax),
        TaxBreakup: [],
        YQTax: String(fare.YQTax),
        AdditionalTxnFeeOfrd: 0,
        AdditionalTxnFeePub: 0,
        PGCharge: 0,
        OtherCharges: 0,
        ChargeBU: [],
        Discount: 0,
        PublishedFare: 0,
        CommissionEarned: 0,
        PLBEarned: 0,
        IncentiveEarned: 0,
        OfferedFare: 0,
        TdsOnCommission: 0,
        TdsOnPLB: 0,
        TdsOnIncentive: 0,
        ServiceFee: 0,
      },
    };
    if (p.Email)     pax.Email     = p.Email;
    if (p.ContactNo) pax.ContactNo = p.ContactNo;
    return pax;
  });
}

function ticketBody(token, fqTraceId, fqResultIndex, perPaxFare) {
  return {
    PreferredCurrency: "INR",
    AgentReferenceNo: "",
    IsBaseCurrencyRequired: true,
    TokenId: token,
    EndUserIp: END_USER_IP,
    TraceId: fqTraceId,
    ResultIndex: fqResultIndex,
    Passengers: buildPassengers(perPaxFare),
  };
}

function getBookingDetailsBody(token, bookingId, pnr) {
  const body = { TokenId: token, EndUserIp: END_USER_IP, BookingId: bookingId };
  if (pnr) body.PNR = pnr;
  return body;
}

// ─── Helpers for picking results ────────────────────────────────────────────
function flatten(x) { return Array.isArray(x) ? x[0] : x; }
function pickLcc(arr) {
  if (!Array.isArray(arr) || !arr.length) return null;
  const lcc = arr.find((f) => { const fl = flatten(f); return fl && fl.IsLCC === true; });
  return lcc ? flatten(lcc) : flatten(arr[0]);
}

// ─── Consolidated builder ───────────────────────────────────────────────────
function buildConsolidated(summary) {
  const order = STEP_ORDER.map(([slug]) => slug);
  const sections = [];

  sections.push("==================================================================");
  sections.push("SpaksTrip — Flight Sample Verification (LCC Domestic Return)");
  sections.push("==================================================================");
  sections.push(`Scenario   : LCC Domestic Return, JT=2, DEL <-> ${summary.destination}`);
  sections.push(`Pax        : 2 Adult + 1 Child + 1 Infant`);
  sections.push(`Outbound   : ${OUTBOUND_DATE}`);
  sections.push(`Inbound    : ${INBOUND_DATE}`);
  sections.push(`OB Booking : ${summary.obBookingId || "(none)"}   PNR ${summary.obPnr || "(none)"}`);
  sections.push(`IB Booking : ${summary.ibBookingId || "(none)"}   PNR ${summary.ibPnr || "(none)"}`);
  if (summary.fallbacksTried.length) {
    sections.push(`Fallbacks  : tried ${summary.fallbacksTried.join(" -> ")}`);
  }
  sections.push(`Generated  : ${new Date().toISOString()}`);
  sections.push("");
  sections.push("");

  for (const slug of order) {
    const reqFile = path.join(LOG_DIR, `${slug}Request.txt`);
    const resFile = path.join(LOG_DIR, `${slug}Response.txt`);
    if (fs.existsSync(reqFile)) sections.push(fs.readFileSync(reqFile, "utf8").trimEnd());
    if (fs.existsSync(resFile)) sections.push(fs.readFileSync(resFile, "utf8").trimEnd());
    sections.push("");
  }
  fs.writeFileSync(path.join(LOG_DIR, "consolidated.txt"), sections.join("\n") + "\n");
}

// ─── Main flow ──────────────────────────────────────────────────────────────
function logStep(label, extra) {
  const time = new Date().toLocaleTimeString();
  const line = `[${time}] ${label}${extra ? " — " + extra : ""}`;
  console.log(line);
}

async function main() {
  console.log("=".repeat(70));
  console.log("TBO Flight Sample Verification — runner");
  console.log("=".repeat(70));
  console.log(`User:        ${USER_NAME}`);
  console.log(`EndUserIp:   ${END_USER_IP}`);
  console.log(`Route:       ${ORIGIN} <-> ${DESTINATIONS[0]} (fallback: ${DESTINATIONS.slice(1).join(", ")})`);
  console.log(`Pax:         2 Adult + 1 Child + 1 Infant`);
  console.log(`Dates:       ${OUTBOUND_DATE} (OB) | ${INBOUND_DATE} (IB)`);
  console.log("");

  // --- Step 1 Authenticate ----------------------------------------------------
  logStep("Step 1: Authenticate");
  const aBody = authBody();
  writeReq("auth", "STEP 1 — AUTHENTICATE", AUTH_URL, aBody, { maskPassword: true });
  const aRes = await postJson(AUTH_URL, aBody);
  writeRes("auth", "STEP 1 — AUTHENTICATE", aRes.status, aRes.json, { maskToken: false });
  if (aRes.json?.Status !== 1 || !aRes.json?.TokenId) {
    throw new Error(`Authenticate failed: Status=${aRes.json?.Status} Error=${JSON.stringify(aRes.json?.Error)}`);
  }
  const TOKEN = aRes.json.TokenId;
  logStep("Step 1: OK", `TokenId=${TOKEN.slice(0,8)}...`);

  // --- Step 2 Search (with fallback) ------------------------------------------
  let searchResult = null;
  const fallbacksTried = [];
  for (const dest of DESTINATIONS) {
    logStep("Step 2: Search", `DEL <-> ${dest}`);
    const sBody = searchBody(TOKEN, dest);
    const sRes = await postJson(URLS.search, sBody);
    fallbacksTried.push(dest);

    const resp = sRes.json?.Response;
    const results = resp?.Results;
    if (!Array.isArray(results) || results.length < 2 ||
        !Array.isArray(results[0]) || !Array.isArray(results[1]) ||
        results[0].length === 0 || results[1].length === 0) {
      logStep(`Step 2: ${dest} — no OB+IB pair, trying next destination`);
      continue;
    }
    const ob = pickLcc(results[0]);
    const ib = pickLcc(results[1]);
    if (!ob?.ResultIndex || !ib?.ResultIndex) {
      logStep(`Step 2: ${dest} — no LCC ResultIndex, trying next destination`);
      continue;
    }
    // Success — record the search call
    writeReq("search", `STEP 2 — SEARCH (DEL <-> ${dest})`, URLS.search, sBody);
    writeRes("search", `STEP 2 — SEARCH (DEL <-> ${dest})`, sRes.status, sRes.json);
    searchResult = { destination: dest, response: sRes.json, traceId: resp.TraceId, ob, ib };
    logStep(`Step 2: OK`, `dest=${dest} OB=${ob.ResultIndex.slice(0,16)}... IB=${ib.ResultIndex.slice(0,16)}... IsLCC(OB)=${ob.IsLCC} IsLCC(IB)=${ib.IsLCC}`);
    break;
  }
  if (!searchResult) {
    throw new Error(`Search returned no usable LCC OB+IB pair for any of: ${DESTINATIONS.join(", ")}`);
  }
  const { destination, traceId: TRACE_ID, ob: OB, ib: IB } = searchResult;

  // --- Step 3 FareRule (OB,IB) ------------------------------------------------
  logStep("Step 3: FareRule (OB,IB)");
  const frBody = fareRuleBody(TOKEN, TRACE_ID, OB.ResultIndex, IB.ResultIndex);
  writeReq("fareRule", "STEP 3 — FARERULE (OB,IB)", URLS.fareRule, frBody);
  const frRes = await postJson(URLS.fareRule, frBody);
  writeRes("fareRule", "STEP 3 — FARERULE (OB,IB)", frRes.status, frRes.json);

  // --- Step 4 FareQuote OB ----------------------------------------------------
  logStep("Step 4: FareQuote OB");
  const fqObReq = fareQuoteBody(TOKEN, TRACE_ID, OB.ResultIndex);
  writeReq("fareQuoteOb", "STEP 4 — FAREQUOTE (OB)", URLS.fareQuote, fqObReq);
  const fqObRes = await postJson(URLS.fareQuote, fqObReq);
  writeRes("fareQuoteOb", "STEP 4 — FAREQUOTE (OB)", fqObRes.status, fqObRes.json);
  const obFqTrace  = fqObRes.json?.Response?.TraceId || TRACE_ID;
  const obFqIdx    = fqObRes.json?.Response?.Results?.ResultIndex || OB.ResultIndex;
  const obPerPax   = extractFareByPax(fqObRes.json?.Response?.Results?.FareBreakdown);
  logStep("Step 4: OK", `OB per-pax adult BaseFare=${obPerPax[1].BaseFare} Tax=${obPerPax[1].Tax}`);

  // --- Step 5 FareQuote IB ----------------------------------------------------
  logStep("Step 5: FareQuote IB");
  const fqIbReq = fareQuoteBody(TOKEN, TRACE_ID, IB.ResultIndex);
  writeReq("fareQuoteIb", "STEP 5 — FAREQUOTE (IB)", URLS.fareQuote, fqIbReq);
  const fqIbRes = await postJson(URLS.fareQuote, fqIbReq);
  writeRes("fareQuoteIb", "STEP 5 — FAREQUOTE (IB)", fqIbRes.status, fqIbRes.json);
  const ibFqTrace  = fqIbRes.json?.Response?.TraceId || TRACE_ID;
  const ibFqIdx    = fqIbRes.json?.Response?.Results?.ResultIndex || IB.ResultIndex;
  const ibPerPax   = extractFareByPax(fqIbRes.json?.Response?.Results?.FareBreakdown);
  logStep("Step 5: OK", `IB per-pax adult BaseFare=${ibPerPax[1].BaseFare} Tax=${ibPerPax[1].Tax}`);

  // --- Step 6 SSR OB (optional, no selection used) ----------------------------
  logStep("Step 6: SSR OB");
  const ssrObReq = ssrBody(TOKEN, obFqTrace, obFqIdx);
  writeReq("ssrOb", "STEP 6 — SSR (OB)", URLS.ssr, ssrObReq);
  const ssrObRes = await postJson(URLS.ssr, ssrObReq);
  writeRes("ssrOb", "STEP 6 — SSR (OB)", ssrObRes.status, ssrObRes.json);

  // --- Step 7 SSR IB ----------------------------------------------------------
  logStep("Step 7: SSR IB");
  const ssrIbReq = ssrBody(TOKEN, ibFqTrace, ibFqIdx);
  writeReq("ssrIb", "STEP 7 — SSR (IB)", URLS.ssr, ssrIbReq);
  const ssrIbRes = await postJson(URLS.ssr, ssrIbReq);
  writeRes("ssrIb", "STEP 7 — SSR (IB)", ssrIbRes.status, ssrIbRes.json);

  // --- Step 8 Ticket OB -------------------------------------------------------
  logStep("Step 8: Ticket OB");
  const tObReq = ticketBody(TOKEN, obFqTrace, obFqIdx, obPerPax);
  writeReq("ticketOb", "STEP 8 — TICKET (OB)", URLS.ticket, tObReq);
  const tObRes = await postJson(URLS.ticket, tObReq);
  writeRes("ticketOb", "STEP 8 — TICKET (OB)", tObRes.status, tObRes.json);
  const obInner = tObRes.json?.Response?.Response || tObRes.json?.Response || {};
  const obFi    = obInner.FlightItinerary || {};
  const OB_BOOKING_ID = obFi.BookingId ? String(obFi.BookingId) : "";
  const OB_PNR        = obFi.PNR || "";
  logStep("Step 8: OK", `OB BookingId=${OB_BOOKING_ID} PNR=${OB_PNR} Status=${obFi.BookingStatus}`);

  // --- Step 9 Ticket IB -------------------------------------------------------
  logStep("Step 9: Ticket IB");
  const tIbReq = ticketBody(TOKEN, ibFqTrace, ibFqIdx, ibPerPax);
  writeReq("ticketIb", "STEP 9 — TICKET (IB)", URLS.ticket, tIbReq);
  const tIbRes = await postJson(URLS.ticket, tIbReq);
  writeRes("ticketIb", "STEP 9 — TICKET (IB)", tIbRes.status, tIbRes.json);
  const ibInner = tIbRes.json?.Response?.Response || tIbRes.json?.Response || {};
  const ibFi    = ibInner.FlightItinerary || {};
  const IB_BOOKING_ID = ibFi.BookingId ? String(ibFi.BookingId) : "";
  const IB_PNR        = ibFi.PNR || "";
  logStep("Step 9: OK", `IB BookingId=${IB_BOOKING_ID} PNR=${IB_PNR} Status=${ibFi.BookingStatus}`);

  // --- Step 10 GetBookingDetails OB ------------------------------------------
  logStep("Step 10: GetBookingDetails OB");
  const gbObReq = getBookingDetailsBody(TOKEN, OB_BOOKING_ID, OB_PNR);
  writeReq("getBookingDetailsOb", "STEP 10 — GETBOOKINGDETAILS (OB)", URLS.getBookingDetails, gbObReq);
  const gbObRes = await postJson(URLS.getBookingDetails, gbObReq);
  writeRes("getBookingDetailsOb", "STEP 10 — GETBOOKINGDETAILS (OB)", gbObRes.status, gbObRes.json);

  // --- Step 11 GetBookingDetails IB ------------------------------------------
  logStep("Step 11: GetBookingDetails IB");
  const gbIbReq = getBookingDetailsBody(TOKEN, IB_BOOKING_ID, IB_PNR);
  writeReq("getBookingDetailsIb", "STEP 11 — GETBOOKINGDETAILS (IB)", URLS.getBookingDetails, gbIbReq);
  const gbIbRes = await postJson(URLS.getBookingDetails, gbIbReq);
  writeRes("getBookingDetailsIb", "STEP 11 — GETBOOKINGDETAILS (IB)", gbIbRes.status, gbIbRes.json);

  // --- Build consolidated.txt -------------------------------------------------
  buildConsolidated({
    destination,
    obBookingId: OB_BOOKING_ID,
    obPnr: OB_PNR,
    ibBookingId: IB_BOOKING_ID,
    ibPnr: IB_PNR,
    fallbacksTried,
  });

  console.log("");
  console.log("=".repeat(70));
  console.log("DONE.");
  console.log(`  Destination used : DEL <-> ${destination}`);
  console.log(`  OB BookingId/PNR : ${OB_BOOKING_ID} / ${OB_PNR}`);
  console.log(`  IB BookingId/PNR : ${IB_BOOKING_ID} / ${IB_PNR}`);
  console.log(`  Logs written to  : ${LOG_DIR}`);
  console.log(`  Send to TBO      : ${path.join(LOG_DIR, "consolidated.txt")}`);
  console.log("=".repeat(70));
}

main().catch((err) => {
  console.error("");
  console.error("FAILED:", err.message);
  if (err.stack) console.error(err.stack.split("\n").slice(1, 6).join("\n"));
  process.exit(1);
});
