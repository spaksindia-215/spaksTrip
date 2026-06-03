#!/usr/bin/env node
/**
 * TBO Certification — RESHARE runner (rejected cases 6, 7, 8, 11, 12)
 *
 * Fixes the two reasons TBOI rejected the original submission:
 *
 *   1. Cases 6/7/8 — "incorrect base fare and taxes for all paxes".
 *      Before each Book/Ticket POST the runner rewrites every passenger's
 *      Fare block to FareBreakdown ÷ PassengerCount (per head), distributing
 *      any rounding remainder so the per-pax sum reconciles EXACTLY to the
 *      FareQuote total. (The old run sent each passenger the whole per-type
 *      total, e.g. both adults got 16620 instead of 8310.)
 *
 *   2. Cases 11/12 — "not making an NDC fare booking" + "not passing full
 *      passport details". Search auto-selects an NDC result
 *      (FareClassification.Type === "PublishNDC"), and the collection already
 *      carries PassportNo / PassportExpiry / PassportIssueDate /
 *      PassportIssueCountryCode on every passenger.
 *
 * Usage:
 *   TBO_USERNAME=user TBO_PASSWORD=pass node scripts/run-tbo-reshare.js <caseNum>
 *     <caseNum> ∈ {6,7,8,11,12}
 *
 * Optional env:
 *   TBO_RESULT_INDEX=<idx>   force the Search ResultIndex (skip auto-select)
 *   TBO_RESULTS_DIR=<dir>    output dir (default ./tbo-results)
 *   TBO_COLLECTION=<path>    collection (default TBO_Certification_Reshare...)
 *   TBO_AUTO=1               don't pause between steps (non-interactive)
 *
 * Each step writes:
 *   <results>/case-NN/<method>Request.txt   (the exact body sent, pretty JSON)
 *   <results>/case-NN/<method>Response.txt  ({ status, response }, pretty JSON)
 * matching the naming convention already in tbo-results/.
 */
"use strict";

const fs   = require("fs");
const path = require("path");

// ─── tiny tty helpers ────────────────────────────────────────────────────────
let rl = require("readline").createInterface({ input: process.stdin, output: process.stdout });
let rlClosed = false;
rl.on("close", () => { rlClosed = true; });
const AUTO = process.env.TBO_AUTO === "1" || !process.stdin.isTTY;
const ask = (q) => new Promise((res) => {
  if (AUTO) return res("");
  if (rlClosed) {
    rl = require("readline").createInterface({ input: process.stdin, output: process.stdout });
    rlClosed = false;
    rl.on("close", () => { rlClosed = true; });
  }
  rl.question(q, res);
});

const colour = (c, t) => `\x1b[${c}m${t}\x1b[0m`;
const bold = (t) => colour("1", t), green = (t) => colour("32", t);
const cyan = (t) => colour("36", t), red = (t) => colour("31", t), dim = (t) => colour("2", t);
const safeJson = (t) => { try { return JSON.parse(t); } catch { return null; } };

// ─── collection + vars ───────────────────────────────────────────────────────

const COLLECTION_PATH = process.env.TBO_COLLECTION
  ? path.resolve(process.env.TBO_COLLECTION)
  : path.join(__dirname, "..", "test-cases", "TBO_Certification_Reshare.postman_collection.json");

const RESULTS_DIR = process.env.TBO_RESULTS_DIR
  ? path.resolve(process.env.TBO_RESULTS_DIR)
  : path.join(__dirname, "..", "tbo-results");

let VARS = {};
let GLOBAL_VARS = {};
let FARE_BREAKDOWN = null;      // captured at FareQuote, consumed at Book/Ticket
let SEARCH_CANDIDATES = [];     // ranked result objects for FareQuote retry

function initVars(collection) {
  for (const v of collection.variable || []) VARS[v.key] = v.value || "";
  if (process.env.TBO_USERNAME) VARS.TBO_USERNAME = process.env.TBO_USERNAME;
  if (process.env.TBO_PASSWORD) VARS.TBO_PASSWORD = process.env.TBO_PASSWORD;
  // Optional string SSR fields default to empty (GDS Book accepts empty Meal/Seat).
  for (const k of ["MEAL_CODE", "SEAT_CODE"]) if (VARS[k] === undefined) VARS[k] = "";
  GLOBAL_VARS = { ...VARS };
}

// Resolve {{VAR}}. Known vars substitute their value; unknown ones collapse to
// "" (and are reported) so string fields like Meal.Code stay valid JSON.
function substitute(str, reportInto) {
  if (!str) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (VARS[key] !== undefined) return VARS[key];
    if (reportInto) reportInto.add(key);
    return "";
  });
}

// ─── HTTP ────────────────────────────────────────────────────────────────────

async function httpPost(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
  return { status: res.status, text: await res.text() };
}

// ─── result-file naming (mirrors tbo-results/ convention) ────────────────────
// Request  → camelCase method + step variant LETTER  (fareRuleRequest, bookARequest, ticketBRequest)
// Response → all-lowercase method, NO variant letter  (fareruleResponse, bookResponse, ticketResponse)
function methodSlugs(stepName) {
  const m = String(stepName).match(/^\s*Step\s+\d+([a-z]?)\s*[—\-–]\s*(.+)$/i);
  if (!m) {
    const fb = String(stepName).replace(/[^A-Za-z0-9]+/g, "") || "step";
    return { camel: fb, lower: fb.toLowerCase() };
  }
  const variant = m[1] ? m[1].toUpperCase() : "";          // "6a" → "A"
  const word = (m[2].trim().match(/^[A-Za-z][A-Za-z]*/) || ["step"])[0];
  const camelBase = /^[A-Z]+$/.test(word) ? word.toLowerCase() : word.charAt(0).toLowerCase() + word.slice(1);
  return { camel: camelBase + variant, lower: word.toLowerCase() };
}

function saveExchange(caseNum, stepName, requestBody, status, responseText) {
  const dir = path.join(RESULTS_DIR, `case-${String(caseNum).padStart(2, "0")}`);
  fs.mkdirSync(dir, { recursive: true });
  const { camel, lower } = methodSlugs(stepName);

  if (requestBody !== undefined && requestBody !== null && requestBody !== "") {
    const reqJson = safeJson(requestBody);
    const out = reqJson ? JSON.stringify(reqJson, null, 2) : String(requestBody);
    fs.writeFileSync(path.join(dir, `${camel}Request.txt`), out + "\n");
  }
  const resFile = path.join(dir, `${lower}Response.txt`);
  const resJson = safeJson(responseText);
  fs.writeFileSync(resFile, JSON.stringify({ status, response: resJson || responseText }, null, 2) + "\n");
  return resFile;
}

// ─── search-result helpers ───────────────────────────────────────────────────

function flattenResults(json) {
  const results = json?.Response?.Results ?? json?.Results;
  if (!Array.isArray(results)) return [];
  const out = [];
  for (const r of results) {
    if (Array.isArray(r)) r.forEach((x) => out.push(Array.isArray(x) ? x[0] : x));
    else out.push(r);
  }
  return out.filter(Boolean);
}

// An NDC result is flagged by TBO on FareClassification.Type ("PublishNDC")
// or ResultFareType ("...NDC..."). Do NOT sniff the base64 ResultIndex — it
// can contain the letters "ndc" by chance and produce false positives.
function isNdc(f) {
  return /ndc/i.test(String(f?.FareClassification?.Type)) || /ndc/i.test(String(f?.ResultFareType));
}

// Auto-pick the ResultIndex appropriate to the case. Honors TBO_RESULT_INDEX.
function autoSelectResult(json, caseNum) {
  if (process.env.TBO_RESULT_INDEX) {
    return { idx: process.env.TBO_RESULT_INDEX, note: "from TBO_RESULT_INDEX env" };
  }
  const results = flattenResults(json);
  if (!results.length) return { idx: null, note: "no results in response" };

  let pick, note;
  if (caseNum === 11 || caseNum === 12) {
    const ndc = results.filter(isNdc);
    const ai = ndc.filter((f) => f.AirlineCode === "AI");
    pick = ai[0] || ndc[0] || null;
    if (!pick) return { idx: null, note: red("no NDC (PublishNDC) result found — cannot certify NDC booking") };
    note = `NDC ${pick.AirlineCode} (${ndc.length} NDC results; ${ai.length} AI)`;
  } else if (caseNum === 6) {
    pick = results.find((f) => f.IsLCC === true) || results[0];
    note = `LCC ${pick.AirlineCode} (IsLCC=${pick.IsLCC})`;
  } else {
    pick = results.find((f) => f.IsLCC === false) || results[0];
    note = `GDS/Non-LCC ${pick.AirlineCode} (IsLCC=${pick.IsLCC})`;
  }
  return { idx: pick?.ResultIndex || null, note, flight: pick };
}

// Ranked list of fallback candidates for a case, best-first. Used to retry
// FareQuote against a different result when the supplier rejects one
// ("Fare Quote failed from the Supplier end", error 28).
function rankedCandidates(json, caseNum) {
  const results = flattenResults(json);
  if (caseNum === 11 || caseNum === 12) {
    const ndc = results.filter(isNdc);
    const ai  = ndc.filter((f) => f.AirlineCode === "AI");
    const rest = ndc.filter((f) => f.AirlineCode !== "AI");
    // Round-robin the non-AI NDC results by airline so a supplier outage on one
    // carrier (e.g. EK Error 28) doesn't starve the retry of other carriers
    // (e.g. BA) that sit at the tail of the list.
    return [...ai, ...roundRobinByAirline(rest)];   // NDC only, AI first
  }
  if (caseNum === 6) {
    return [...results.filter((f) => f.IsLCC === true), ...results.filter((f) => f.IsLCC !== true)];
  }
  return [...results.filter((f) => f.IsLCC === false), ...results.filter((f) => f.IsLCC !== false)];
}

// Interleave results so each AirlineCode is sampled before repeating any.
function roundRobinByAirline(list) {
  const groups = new Map();
  for (const f of list) {
    const k = f.AirlineCode || "?";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(f);
  }
  const out = [];
  let added = true;
  while (added) {
    added = false;
    for (const arr of groups.values()) {
      if (arr.length) { out.push(arr.shift()); added = true; }
    }
  }
  return out;
}

// A FareQuote that fails on the supplier side (vs. a clean reprice).
function isSupplierQuoteFail(json, status) {
  const err = json?.Error ?? json?.Response?.Error;
  const code = String(err?.ErrorCode ?? "");
  const msg = String(err?.ErrorMessage ?? "");
  if (status && status !== 200) return true;
  return (code !== "0" && code !== "") &&
    (code === "28" || /fare\s*quote failed|supplier|try again/i.test(msg));
}

// Replace the ResultIndex inside a request body with a specific value.
function setResultIndex(body, resultIndex) {
  const o = safeJson(body);
  if (!o) return body;
  o.ResultIndex = resultIndex;
  return JSON.stringify(o);
}

// ─── per-pax fare correction (the case 6/7/8 fix) ────────────────────────────

// Split an integer `value` across `n` heads so the parts sum back to `value`.
function splitInt(value, n) {
  const v = Math.round(Number(value) || 0);
  const base = Math.floor(v / n);
  let rem = v - base * n;
  return Array.from({ length: n }, () => base + (rem-- > 0 ? 1 : 0));
}

// Rewrite each passenger's Fare to its per-head share of the FareBreakdown for
// its PaxType. Returns a short human summary for the log.
function applyPerPaxFares(bodyObj, fareBreakdown) {
  if (!Array.isArray(bodyObj?.Passengers) || !Array.isArray(fareBreakdown)) return null;

  const splitsByType = {};
  for (const b of fareBreakdown) {
    const type = String(b.PassengerType);
    const n = Number(b.PassengerCount) ||
      bodyObj.Passengers.filter((p) => String(p.PaxType) === type).length || 1;
    splitsByType[type] = {
      base: splitInt(b.BaseFare, n),
      tax:  splitInt(b.Tax, n),
      yq:   splitInt(b.YQTax || 0, n),
    };
  }

  const cursor = {};
  const summary = [];
  for (const pax of bodyObj.Passengers) {
    const type = String(pax.PaxType);
    const s = splitsByType[type];
    if (!s || !pax.Fare) continue;
    const i = (cursor[type] = (cursor[type] || 0));
    cursor[type]++;
    const base = s.base[i] ?? s.base[s.base.length - 1];
    const tax  = s.tax[i]  ?? s.tax[s.tax.length - 1];
    const yq   = s.yq[i]   ?? s.yq[s.yq.length - 1];
    pax.Fare.BaseFare = base;
    pax.Fare.Tax = tax;
    pax.Fare.YQTax = yq;
    summary.push(`PT${type}#${i + 1} base=${base} tax=${tax} yq=${yq}`);
  }
  return summary.join("  ");
}

// Shift every Search segment's preferred dates by N days. TBO blocks a repeat
// Book with identical pax + sector + date ("Booking is already done for the
// same criteria"), so set TBO_DATE_OFFSET_DAYS to move the journey to a fresh
// date and obtain a new PNR without editing the collection.
function addDays(isoDateTime, days) {
  const [datePart, timePart = "00:00:00"] = String(isoDateTime).split("T");
  const d = new Date(datePart + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + Number(days));
  return `${d.toISOString().slice(0, 10)}T${timePart}`;
}
function shiftSearchDates(body, days) {
  const o = safeJson(body);
  if (!o || !Array.isArray(o.Segments)) return body;
  o.Segments = o.Segments.map((s) => ({
    ...s,
    PreferredDepartureTime: addDays(s.PreferredDepartureTime, days),
    PreferredArrivalTime:   addDays(s.PreferredArrivalTime, days),
  }));
  return JSON.stringify(o);
}

// Remove orphan passport fields: if a passenger has no PassportNo, drop the
// PassportExpiry / PassportIssueDate / PassportIssueCountryCode that would
// otherwise trip TBO's "Passport No shouldn't be empty if Passport Expiry
// provided" validation (domestic cases 6/7/8). Returns count of pax cleaned.
function stripEmptyPassports(bodyObj) {
  if (!Array.isArray(bodyObj?.Passengers)) return 0;
  let n = 0;
  for (const pax of bodyObj.Passengers) {
    const hasNo = typeof pax.PassportNo === "string" && pax.PassportNo.trim() !== "";
    if (hasNo) continue;
    let touched = false;
    for (const k of ["PassportNo", "PassportExpiry", "PassportIssueDate", "PassportIssueCountryCode"]) {
      if (k in pax) { delete pax[k]; touched = true; }
    }
    if (touched) n++;
  }
  return n;
}

// Drop optional Meal/Seat SSR objects unless they carry a REAL selected code.
// TBO validates these objects: an empty Code → "Invalid Meal Data", and even
// the "NoSeat"/"NoMeal" sentinels (with Description:2) → "Invalid Seat Data"
// on a GDS Book. So we only keep a Meal/Seat that holds an actual SSR code
// (e.g. a seat number or meal code from the SSR step). Returns count removed.
function stripEmptyMealSeat(bodyObj) {
  if (!Array.isArray(bodyObj?.Passengers)) return 0;
  const isPlaceholder = (code) =>
    typeof code !== "string" || code.trim() === "" || /^no(seat|meal|baggage)$/i.test(code.trim());
  let n = 0;
  for (const pax of bodyObj.Passengers) {
    for (const k of ["Meal", "Seat"]) {
      if (pax[k] && isPlaceholder(pax[k].Code)) { delete pax[k]; n++; }
    }
  }
  return n;
}

// Drop empty/placeholder entries from the LCC SSR arrays (Baggage,
// MealDynamic, SeatDynamic). When the SSR step captured nothing, the template
// leaves Code as "" (after {{VAR}} → ""), which TBO rejects as "Invalid
// Baggage/Meal Data". An empty array is valid, so we only remove bad entries.
function stripEmptySsrArrays(bodyObj) {
  if (!Array.isArray(bodyObj?.Passengers)) return 0;
  const bad = (code) =>
    typeof code !== "string" || code.trim() === "" ||
    /^no(seat|meal|baggage)$/i.test(code.trim()) || /^\{\{.*\}\}$/.test(code.trim());
  let n = 0;
  for (const pax of bodyObj.Passengers) {
    for (const k of ["Baggage", "MealDynamic", "SeatDynamic"]) {
      if (Array.isArray(pax[k])) {
        const before = pax[k].length;
        pax[k] = pax[k].filter((item) => item && !bad(item.Code));
        n += before - pax[k].length;
      }
    }
  }
  return n;
}

// ─── JT=5 ResultIndex normalisation (cases 6, 7) ─────────────────────────────
// For JT=5 Special Return the supplier returns a single OB-prefixed index that
// encodes both legs and REJECTS a comma-joined "OB,IB". Strip any trailing IB.
function normalizeJt5ResultIndex(body) {
  if (VARS.JOURNEY_TYPE !== "5") return body;
  const json = safeJson(body);
  if (!json || typeof json.ResultIndex !== "string") return body;
  if (json.ResultIndex.includes(",")) {
    json.ResultIndex = json.ResultIndex.split(",")[0].trim();
    return JSON.stringify(json);
  }
  return body;
}

// ─── booking-id / pnr capture (from Book or LCC Ticket responses) ────────────
function captureBookingIdentity(json) {
  const inner = json?.Response?.Response ?? json?.Response;
  const fi = inner?.FlightItinerary ?? null;
  const bid = inner?.BookingId ?? fi?.BookingId;
  const pnr = inner?.PNR ?? fi?.PNR;
  if (bid !== undefined && bid !== null && bid !== "") VARS.BOOKING_ID = String(bid);
  if (pnr) VARS.PNR = pnr;
  return { bid, pnr };
}

// TBO rejects a direct /Ticket for GDS suppliers ("Incase GDS, Direct Ticket
// not allowed. Do booking first and then ticket"). For non-LCC fares we POST
// the passenger payload to /Book, capture the BookingId/PNR, then issue
// /Ticket with { TokenId, TraceId, PNR, BookingId }. The Book exchange is saved
// as book*, the follow-up Ticket as ticket*, matching the tbo-results layout.
async function bookThenTicket(caseNum, stepName, ticketUrl, passengersBody) {
  const bookUrl = ticketUrl.replace(/\/Ticket(\?|$)/i, "/Book$1");
  console.log(dim(`  ↪ GDS/non-LCC → POST /Book first`));
  let bookRes;
  try { bookRes = await httpPost(bookUrl, passengersBody); }
  catch (e) { console.error(red("  [network error] ") + e.message); return null; }

  const bookJson = safeJson(bookRes.text);
  const bookSaved = saveExchange(caseNum, stepName.replace(/Ticket/gi, "Book"), passengersBody, bookRes.status, bookRes.text);
  console.log((bookRes.status === 200 ? green : red)(`  ← Book HTTP ${bookRes.status}`) +
    dim(`  (saved ${path.relative(path.join(__dirname, ".."), bookSaved)})`));
  const bookErr = bookJson?.Error ?? bookJson?.Response?.Error;
  if (bookErr?.ErrorCode && String(bookErr.ErrorCode) !== "0") {
    console.log(red(`  [Book API error ${bookErr.ErrorCode}] `) + (bookErr.ErrorMessage || ""));
    return { status: bookRes.status, json: bookJson };
  }

  const { bid, pnr } = captureBookingIdentity(bookJson);
  const bookingIdNum = Number(bid);
  if (!Number.isFinite(bookingIdNum)) {
    console.log(red("  [!] Book returned no usable BookingId — cannot issue Ticket."));
    return { status: bookRes.status, json: bookJson };
  }
  console.log(green("  ✓ BOOKING_ID: ") + cyan(String(bid)) + (pnr ? green("  PNR: ") + cyan(pnr) : ""));

  const ticketBody = JSON.stringify({
    TokenId: VARS.TOKEN,
    EndUserIp: "1.1.1.1",
    TraceId: VARS.FQ_TRACE_ID || bookJson?.Response?.TraceId || VARS.TRACE_ID || "",
    PNR: pnr || "",
    BookingId: bookingIdNum,
  });
  console.log(dim(`  → POST ${ticketUrl}  (Ticket after Book)`));
  let tRes;
  try { tRes = await httpPost(ticketUrl, ticketBody); }
  catch (e) { console.error(red("  [network error] ") + e.message); return { status: bookRes.status, json: bookJson }; }

  const tJson = safeJson(tRes.text);
  const tSaved = saveExchange(caseNum, "Step 99 — Ticket (auto)", ticketBody, tRes.status, tRes.text);
  console.log((tRes.status === 200 ? green : red)(`  ← Ticket HTTP ${tRes.status}`) +
    dim(`  (saved ${path.relative(path.join(__dirname, ".."), tSaved)})`));
  const tErr = tJson?.Error ?? tJson?.Response?.Error;
  if (tErr?.ErrorCode && String(tErr.ErrorCode) !== "0") {
    console.log(red(`  [Ticket API error ${tErr.ErrorCode}] `) + (tErr.ErrorMessage || ""));
  } else {
    const fi = (tJson?.Response?.Response ?? tJson?.Response)?.FlightItinerary;
    const tix = (fi?.Passenger || []).map((p) => p?.Ticket?.TicketNumber).filter(Boolean);
    if (tix.length) console.log(green("  ✓ Tickets: ") + cyan(tix.join(", ")));
  }
  return { status: tRes.status, json: tJson };
}

// Post FareQuote, retrying against the next ranked candidate whenever the
// supplier rejects the current result (error 28). Each candidate is tried
// twice (the error message says "try again", so some failures are transient).
// Returns { res, body, candidate } for the attempt we settle on.
async function fareQuoteWithFallback(url, body, caseNum) {
  const cands = SEARCH_CANDIDATES.length ? SEARCH_CANDIDATES : [{ ResultIndex: safeJson(body)?.ResultIndex, AirlineCode: "?" }];
  const maxCands = Math.min(cands.length, 10);
  let last = null;

  for (let i = 0; i < maxCands; i++) {
    const cand = cands[i];
    let attemptBody = normalizeJt5ResultIndex(setResultIndex(body, cand.ResultIndex));

    for (let attempt = 1; attempt <= 2; attempt++) {
      let res;
      try { res = await httpPost(url, attemptBody); }
      catch (e) { console.error(red("  [network error] ") + e.message); return { res: last?.res, body: attemptBody, candidate: cand }; }

      last = { res, body: attemptBody, candidate: cand };
      const json = safeJson(res.text);
      if (!isSupplierQuoteFail(json, res.status)) {
        if (i > 0 || attempt > 1) {
          console.log(green(`  ✓ FareQuote succeeded on candidate ${i + 1}/${maxCands} (${cand.AirlineCode})`));
          VARS.RESULT_INDEX = VARS.OB_RESULT_INDEX = cand.ResultIndex;
        }
        return last;
      }
      const msg = (json?.Error ?? json?.Response?.Error)?.ErrorMessage || `HTTP ${res.status}`;
      console.log(red(`  [!] FareQuote candidate ${i + 1}/${maxCands} (${cand.AirlineCode}) attempt ${attempt}: `) + dim(msg));
    }
  }
  console.log(red(`  [!] All ${maxCands} candidate(s) failed FareQuote at the supplier. Proceeding with the last response.`));
  return last;
}

// True when this is a Ticket call carrying a Passengers payload (LCC-style
// direct issue) — the only shape eligible for GDS Book promotion.
function isDirectTicketWithPax(url, body) {
  return /\/Ticket(\?|$)/i.test(url) && /"Passengers"\s*:/.test(body || "");
}

function isGdsDirectTicketError(json) {
  const err = json?.Error ?? json?.Response?.Error;
  const msg = String(err?.ErrorMessage || "");
  return String(err?.ErrorCode) === "3" && /direct ticket not allowed|booking first/i.test(msg);
}

// ─── one step ────────────────────────────────────────────────────────────────

const SKIP = (stepName) => {
  const n = stepName.toLowerCase();
  const isLCC = VARS.IS_LCC === "true";
  if (n.includes("skip if lcc") && isLCC) return "IS_LCC=true → skipping Non-LCC step";
  if (n.includes("skip if non-lcc") && !isLCC) return "IS_LCC=false → skipping LCC step";
  if (/skip\s*6a\/6b|skip\s*5a\/5b/.test(n) && !isLCC) return "IS_LCC=false → skipping LCC-only step";
  return null;
};

const isSearch = (n) => /search/i.test(n) && !/research/i.test(n);

async function runStep(step, caseNum, stepIdx) {
  const name = step.name;
  console.log("\n" + bold(`  Step ${stepIdx}: ${name}`));

  const skip = SKIP(name);
  if (skip) { console.log(dim(`  ⟳ SKIPPED — ${skip}`)); return; }

  const urlRaw = typeof step.request.url === "string" ? step.request.url : step.request.url?.raw;
  const url = substitute(urlRaw);
  const missing = new Set();
  let body = step.request?.body?.raw ? substitute(step.request.body.raw, missing) : undefined;

  // Optional date shift to dodge TBO's duplicate-booking guard (fresh PNR).
  if (isSearch(name) && body && process.env.TBO_DATE_OFFSET_DAYS) {
    const days = parseInt(process.env.TBO_DATE_OFFSET_DAYS, 10);
    if (Number.isFinite(days) && days !== 0) {
      body = shiftSearchDates(body, days);
      console.log(dim(`  ↪ shifted search dates by ${days} day(s) (TBO_DATE_OFFSET_DAYS)`));
    }
  }

  // Capture JourneyType from the Search request (disambiguates JT=2 vs JT=5).
  if (isSearch(name) && body) {
    const jt = safeJson(body)?.JourneyType;
    if (jt != null) { VARS.JOURNEY_TYPE = String(jt); console.log(green("  ✓ JOURNEY_TYPE: ") + cyan(VARS.JOURNEY_TYPE)); }
  }

  // JT=5 OB-only normalisation for FareRule/FareQuote.
  if (body && /farequote|farerule/i.test(name)) body = normalizeJt5ResultIndex(body);

  // ── Passenger payload hygiene (cases 6/7/8 fares + passport cleanup) ──
  if (body && /"Passengers"\s*:/.test(body)) {
    const obj = safeJson(body);
    if (obj) {
      // (1) per-pax fares = FareBreakdown ÷ PassengerCount (cases 6/7/8 fix).
      const sum = applyPerPaxFares(obj, FARE_BREAKDOWN);
      if (sum) console.log(green("  ✓ per-pax fares set: ") + dim(sum));
      else if (!FARE_BREAKDOWN) console.log(red("  [!] No FareBreakdown captured — passenger fares NOT corrected."));
      // (2) Strip orphan passport fields on domestic pax: TBO rejects a
      //     PassportExpiry/IssueDate without a PassportNo ("Passport No
      //     shouldn't be empty if Passport Expiry provided").
      const cleaned = stripEmptyPassports(obj);
      if (cleaned) console.log(dim(`  ↪ stripped empty-passport fields on ${cleaned} pax (domestic)`));
      // (3) Drop empty Meal/Seat SSR objects ("Invalid Meal Data" otherwise).
      const ssrStripped = stripEmptyMealSeat(obj);
      if (ssrStripped) console.log(dim(`  ↪ removed ${ssrStripped} empty Meal/Seat object(s)`));
      // (4) Drop empty entries from LCC SSR arrays (Baggage/MealDynamic/SeatDynamic).
      const arrStripped = stripEmptySsrArrays(obj);
      if (arrStripped) console.log(dim(`  ↪ removed ${arrStripped} empty SSR array entr(ies)`));
      body = JSON.stringify(obj);
    }
  }

  if (missing.size) console.log(dim(`  [vars→empty] ${[...missing].join(", ")}`));

  // Explicit Ticket-after-Book steps ship only BookingId; TBO rejects that with
  // "invalid pnr". If we captured a PNR from the preceding Book, add it.
  if (body && /\/Ticket(\?|$)/i.test(url) && !/"Passengers"\s*:/.test(body)) {
    const o = safeJson(body);
    if (o && o.BookingId !== undefined && o.BookingId !== "" && !o.PNR && VARS.PNR) {
      o.PNR = VARS.PNR;
      body = JSON.stringify(o);
      console.log(green("  ✓ added PNR to Ticket: ") + cyan(VARS.PNR));
    }
  }

  // GDS Book→Ticket promotion: for non-LCC fares a direct /Ticket is rejected,
  // so book first then ticket. IS_LCC === "true" → issue Ticket directly; any
  // other value (false, or not yet known) → book first.
  if (isDirectTicketWithPax(url, body) && VARS.IS_LCC !== "true") {
    await bookThenTicket(caseNum, name, url, body);
    return;
  }

  console.log(dim(`  → POST ${url}`));

  let result;
  if (/farequote/i.test(name)) {
    // Walk the ranked candidates so a single supplier-side quote failure
    // (error 28) on one NDC/result doesn't sink the whole case.
    const fb = await fareQuoteWithFallback(url, body, caseNum);
    if (!fb || !fb.res) { console.error(red("  [network error] FareQuote produced no response.")); return; }
    result = fb.res;
    body = fb.body;
  } else {
    try { result = await httpPost(url, body); }
    catch (e) { console.error(red("  [network error] ") + e.message); return; }
  }

  let json = safeJson(result.text);

  // Reactive fallback: an LCC-classified fare that the supplier still treats as
  // GDS will reject the direct Ticket — recover by booking first, then ticket.
  if (isDirectTicketWithPax(url, body) && isGdsDirectTicketError(json)) {
    console.log(red("  [!] Direct Ticket rejected as GDS — retrying via Book→Ticket."));
    await bookThenTicket(caseNum, name, url, body);
    return;
  }

  const saved = saveExchange(caseNum, name, body, result.status, result.text);
  const sc = result.status === 200 ? green : red;
  console.log(sc(`  ← HTTP ${result.status}`) + dim(`  (saved ${path.relative(path.join(__dirname, ".."), saved)})`));

  const apiErr = json?.Error ?? json?.Response?.Error;
  if (apiErr?.ErrorCode && String(apiErr.ErrorCode) !== "0") {
    console.log(red(`  [API error ${apiErr.ErrorCode}] `) + (apiErr.ErrorMessage || ""));
  }

  // ── captures ──
  if (/authenticate/i.test(name) && json) {
    const tok = json.TokenId ?? json.Response?.TokenId;
    if (tok) { VARS.TOKEN = tok; console.log(green("  ✓ TOKEN: ") + cyan(tok)); }
  }

  if (isSearch(name) && json) {
    const trace = json?.Response?.TraceId ?? json?.TraceId;
    if (trace) VARS.TRACE_ID = trace;
    const { idx, note, flight } = autoSelectResult(json, caseNum);
    SEARCH_CANDIDATES = rankedCandidates(json, caseNum);   // for FareQuote retry
    console.log(dim("  flights: ") + flattenResults(json).length +
      dim("   candidates: ") + SEARCH_CANDIDATES.length + dim("   pick: ") + note);
    if (idx) {
      // Spread the chosen index across every alias a step body might reference.
      VARS.RESULT_INDEX = VARS.OB_RESULT_INDEX = VARS.SEARCH_RESULT_INDEX = VARS.RBD_RESULT_INDEX = idx;
      VARS.IB_RESULT_INDEX = "";
      if (flight?.AirlineCode) VARS.SEL_AIRLINE = flight.AirlineCode;
      console.log(green("  ✓ RESULT_INDEX: ") + cyan(String(idx).slice(0, 48) + "…"));
    } else {
      console.log(red("  [!] No usable ResultIndex selected; aborting case."));
      throw new Error("result selection failed");
    }
  }

  if (/farequote/i.test(name) && json) {
    const res = json?.Response?.Results;
    const R = Array.isArray(res) ? res[0] : res;
    const trace = json?.Response?.TraceId ?? json?.TraceId;
    if (trace) VARS.FQ_TRACE_ID = trace;
    if (R?.ResultIndex) { VARS.FQ_RESULT_INDEX = R.ResultIndex; }
    if (R?.IsLCC != null) { VARS.IS_LCC = String(R.IsLCC); console.log(green("  ✓ IS_LCC: ") + cyan(VARS.IS_LCC)); }
    if (Array.isArray(R?.FareBreakdown)) {
      FARE_BREAKDOWN = R.FareBreakdown;
      const tot = R.FareBreakdown.map((b) => `PT${b.PassengerType}x${b.PassengerCount} base=${b.BaseFare} tax=${b.Tax}`).join(" | ");
      console.log(green("  ✓ FareBreakdown captured: ") + dim(tot));
    } else {
      console.log(red("  [!] FareQuote returned no FareBreakdown — fares cannot be corrected."));
    }
  }

  if (/\bssr\b/i.test(name) && json && result.status === 200) {
    const r = json?.Response;
    const meal0 = Array.isArray(r?.MealDynamic?.[0]) ? r.MealDynamic[0] : (Array.isArray(r?.Meal) ? r.Meal : null);
    const seat0 = Array.isArray(r?.SeatDynamic?.[0]) ? r.SeatDynamic[0] : null;
    const pickMeal = meal0?.find?.((m) => m.Code && m.Code !== "NoMeal");
    const pickSeat = seat0?.find?.((s) => s.Code && s.Code !== "NoSeat");
    if (pickMeal?.Code) { VARS.MEAL_CODE = pickMeal.Code; console.log(green("  ✓ MEAL_CODE: ") + cyan(pickMeal.Code)); }
    if (pickSeat?.Code) { VARS.SEAT_CODE = pickSeat.Code; console.log(green("  ✓ SEAT_CODE: ") + cyan(pickSeat.Code)); }
  }

  // Book / LCC-Ticket → BookingId + PNR for the follow-up Ticket / GetBookingDetails.
  if ((/book/i.test(name) || /ticket/i.test(name)) && json && result.status === 200 &&
      !(apiErr?.ErrorCode && String(apiErr.ErrorCode) !== "0")) {
    const { bid, pnr } = captureBookingIdentity(json);
    if (bid != null && bid !== "") console.log(green("  ✓ BOOKING_ID: ") + cyan(String(bid)));
    if (pnr) console.log(green("  ✓ PNR: ") + cyan(pnr));
    const fi = (json?.Response?.Response ?? json?.Response)?.FlightItinerary;
    const tix = (fi?.Passenger || []).map((p) => p?.Ticket?.TicketNumber).filter(Boolean);
    if (tix.length) console.log(green("  ✓ Tickets: ") + cyan(tix.join(", ")));
  }
}

// ─── one case ────────────────────────────────────────────────────────────────

function caseNumberFromName(name) {
  const m = String(name).match(/case\s*0*(\d+)/i);
  return m ? parseInt(m[1], 10) : NaN;
}

async function runCase(folder) {
  const caseNum = caseNumberFromName(folder.name);
  console.log("\n" + bold(cyan(`${"─".repeat(64)}\n${folder.name}\n${"─".repeat(64)}`)));

  if (!VARS.TBO_USERNAME || !VARS.TBO_PASSWORD) {
    VARS.TBO_USERNAME = (await ask("  TBO_USERNAME: ")).trim();
    VARS.TBO_PASSWORD = (await ask("  TBO_PASSWORD: ")).trim();
  }

  // Reset per-case state, keeping only credentials.
  const keep = {};
  for (const k of ["TBO_USERNAME", "TBO_PASSWORD"]) if (VARS[k]) keep[k] = VARS[k];
  VARS = { ...GLOBAL_VARS, ...keep };
  FARE_BREAKDOWN = null;
  SEARCH_CANDIDATES = [];

  const steps = folder.item || [];
  for (let i = 0; i < steps.length; i++) {
    await runStep(steps[i], caseNum, i + 1);
    if (!AUTO && i < steps.length - 1) {
      const a = (await ask(`\n  Continue to "${steps[i + 1].name}" ? [Y/n/q]: `)).trim().toLowerCase();
      if (a === "q") { console.log("  Aborted."); process.exit(0); }
      if (a === "n") { console.log("  Stopped."); break; }
    }
  }
  console.log("\n" + green(`  ✓ ${folder.name} complete.`) + "\n");
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  const collection = JSON.parse(fs.readFileSync(COLLECTION_PATH, "utf8"));
  initVars(collection);
  const folders = collection.item || [];

  let want = parseInt(process.argv[2], 10);
  const byNum = new Map(folders.map((f) => [caseNumberFromName(f.name), f]));

  if (!byNum.has(want)) {
    console.log(bold(cyan("\nTBO Reshare — available cases:")));
    for (const [num, f] of byNum) console.log(`  ${String(num).padStart(2)}. ${f.name}`);
    const a = await ask("\nSelect case number: ");
    want = parseInt(a.trim(), 10);
  }
  const folder = byNum.get(want);
  if (!folder) { console.error(red("Invalid case number.")); process.exit(1); }

  await runCase(folder);
  rl.close();
}

main().catch((e) => { console.error(red(String(e && e.message || e))); process.exit(1); });
