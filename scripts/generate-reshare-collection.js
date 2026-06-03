#!/usr/bin/env node
/**
 * Generate the TBO certification "reshare" collection containing ONLY the
 * rejected cases (6, 7, 8, 11, 12), with the fixes TBOI asked for baked in:
 *
 *   Cases 6, 7, 8  — "incorrect base fare and taxes for all paxes".
 *       The original collection ships per-pax-type fare placeholders
 *       ({{ADT_BASE_FARE}} …). These are left in place; the RUNNER
 *       (run-tbo-reshare.js) now fills them with FareBreakdown ÷
 *       PassengerCount so every passenger carries its own per-head fare and
 *       the sum reconciles to the FareQuote total.
 *
 *   Cases 11, 12  — "not making an NDC fare booking" and "not passing full
 *       passport details". Here we:
 *         • mark these folders so the runner auto-selects an NDC result
 *           (FareClassification.Type === "PublishNDC"); and
 *         • inject the full passport block on EVERY passenger in the
 *           Book / Ticket bodies: PassportNo, PassportExpiry,
 *           PassportIssueDate, PassportIssueCountryCode.
 *
 * Source : test-cases/TBO_Certification_Tests.postman_collection.json
 * Output : test-cases/TBO_Certification_Reshare.postman_collection.json
 */
"use strict";

const fs   = require("fs");
const path = require("path");

const ROOT       = path.resolve(__dirname, "..");
const SRC_PATH   = path.join(ROOT, "test-cases", "TBO_Certification_Tests.postman_collection.json");
const OUT_PATH   = path.join(ROOT, "test-cases", "TBO_Certification_Reshare.postman_collection.json");

// Cases to reshare (1-based numbers as they appear in the source collection).
const RESHARE_CASES = [6, 7, 8, 11, 12];

// Cases that fly international and therefore need full passport details on
// every passenger (TBOI rejection for cases 11 & 12).
const PASSPORT_CASES = [11, 12];

// Per-passenger passport block, keyed by FirstName. Issue dates precede the
// passenger's DOB-appropriate window and all expire well past the journey.
// The sample TBOI gave us (Z4337010 / 2028-01-15 / 2022-04-18 / IN) seeds the
// lead passenger; the rest follow the same shape with unique numbers.
const PASSPORTS = {
  RAHUL: { PassportNo: "Z4337010", PassportExpiry: "2028-01-15T00:00:00", PassportIssueDate: "2022-04-18T00:00:00", PassportIssueCountryCode: "IN" },
  PRIYA: { PassportNo: "Z4337011", PassportExpiry: "2029-03-20T00:00:00", PassportIssueDate: "2023-02-10T00:00:00", PassportIssueCountryCode: "IN" },
  ROHAN: { PassportNo: "Z4337012", PassportExpiry: "2030-06-30T00:00:00", PassportIssueDate: "2024-05-15T00:00:00", PassportIssueCountryCode: "IN" },
  RIYA:  { PassportNo: "Z4337013", PassportExpiry: "2031-08-25T00:00:00", PassportIssueDate: "2025-01-20T00:00:00", PassportIssueCountryCode: "IN" },
  AMIT:  { PassportNo: "Z4337014", PassportExpiry: "2029-11-05T00:00:00", PassportIssueDate: "2023-07-22T00:00:00", PassportIssueCountryCode: "IN" },
  KABIR: { PassportNo: "Z4337015", PassportExpiry: "2032-02-14T00:00:00", PassportIssueDate: "2025-06-01T00:00:00", PassportIssueCountryCode: "IN" },
  // Case 11 reshare identities (distinct family → no duplicate-booking clash).
  ROHIT:  { PassportNo: "Z7710001", PassportExpiry: "2030-04-10T00:00:00", PassportIssueDate: "2022-04-10T00:00:00", PassportIssueCountryCode: "IN" },
  NEHA:   { PassportNo: "Z7710002", PassportExpiry: "2031-09-18T00:00:00", PassportIssueDate: "2023-09-18T00:00:00", PassportIssueCountryCode: "IN" },
  VEER:   { PassportNo: "Z7710003", PassportExpiry: "2031-06-12T00:00:00", PassportIssueDate: "2023-06-12T00:00:00", PassportIssueCountryCode: "IN" },
  KIARA:  { PassportNo: "Z7710004", PassportExpiry: "2032-10-05T00:00:00", PassportIssueDate: "2024-10-05T00:00:00", PassportIssueCountryCode: "IN" },
  // Case 12 reshare identities (distinct from SHARMA/MENON so TBO does not
  // reject the Book as a duplicate of an already-booked PNR).
  KARAN:  { PassportNo: "Z6612001", PassportExpiry: "2030-05-18T00:00:00", PassportIssueDate: "2022-05-18T00:00:00", PassportIssueCountryCode: "IN" },
  DEEPA:  { PassportNo: "Z6612002", PassportExpiry: "2031-08-25T00:00:00", PassportIssueDate: "2023-08-25T00:00:00", PassportIssueCountryCode: "IN" },
  ADITYA: { PassportNo: "Z6612003", PassportExpiry: "2031-11-30T00:00:00", PassportIssueDate: "2023-11-30T00:00:00", PassportIssueCountryCode: "IN" },
  MEERA:  { PassportNo: "Z6612004", PassportExpiry: "2032-04-09T00:00:00", PassportIssueDate: "2024-04-09T00:00:00", PassportIssueCountryCode: "IN" },
};
const DEFAULT_PASSPORT = { PassportNo: "Z4337099", PassportExpiry: "2030-01-01T00:00:00", PassportIssueDate: "2022-01-01T00:00:00", PassportIssueCountryCode: "IN" };

// Per-case passenger identity overrides (by passenger index). Used to give a
// case a fresh passenger set when TBO has already booked the default names for
// the same itinerary ("Booking is already done for the same criteria").
// Only identity fields are overridden; PaxType, address, fare, Email/ContactNo,
// IsLeadPax and SSR objects are preserved from the source body.
const PAX_IDENTITY_OVERRIDES = {
  11: [
    { Title: "Mr",   FirstName: "ROHIT", LastName: "RAO", DateOfBirth: "1982-04-10T00:00:00", Gender: 1 },
    { Title: "Mrs",  FirstName: "NEHA",  LastName: "RAO", DateOfBirth: "1985-09-18T00:00:00", Gender: 2 },
    { Title: "Mstr", FirstName: "VEER",  LastName: "RAO", DateOfBirth: "2018-06-12T00:00:00", Gender: 1 },
    { Title: "Miss", FirstName: "KIARA", LastName: "RAO", DateOfBirth: "2019-10-05T00:00:00", Gender: 2 },
  ],
  12: [
    { Title: "Mr",   FirstName: "KARAN",  LastName: "NAIR", DateOfBirth: "1980-05-18T00:00:00", Gender: 1 },
    { Title: "Mrs",  FirstName: "DEEPA",  LastName: "NAIR", DateOfBirth: "1984-08-25T00:00:00", Gender: 2 },
    { Title: "Mstr", FirstName: "ADITYA", LastName: "NAIR", DateOfBirth: "2017-11-30T00:00:00", Gender: 1 },
    { Title: "Miss", FirstName: "MEERA",  LastName: "NAIR", DateOfBirth: "2020-04-09T00:00:00", Gender: 2 },
  ],
};

// Per-case Search overrides. TBOI advised NDC certification must run on
// DEL–DXB with Air India, so cases 11 (oneway) and 12 (return) are repointed
// from DEL–LHR to DEL–DXB and constrained to AirlineCode AI via
// PreferredAirlines. The latter matters because TBO caps the result list — on
// the DEL↔DXB return, SpiceJet fares filled all 461 slots and pushed every Air
// India (hence every NDC) result out. PreferredAirlines:["AI"] surfaces AI's
// NDC fares directly. Dates, cabin and pax counts are preserved.
const SEARCH_OVERRIDES = {
  11: { route: [["DEL", "DXB"]],                  preferredAirlines: ["AI"] },
  12: { route: [["DEL", "DXB"], ["DXB", "DEL"]],  preferredAirlines: ["AI"] },
};

function caseNumberFromName(name) {
  const m = String(name).match(/case\s*0*(\d+)/i);
  return m ? parseInt(m[1], 10) : NaN;
}

// Detect a Search request body (has Segments + JourneyType, no Passengers).
function isSearchBody(rawBody) {
  return typeof rawBody === "string" &&
    /"Segments"\s*:/.test(rawBody) && /"JourneyType"\s*:/.test(rawBody) && !/"Passengers"\s*:/.test(rawBody);
}

// Rewrite a Search body's Origin/Destination per segment and, optionally,
// constrain it to specific airlines via PreferredAirlines.
function applySearchOverride(rawBody, override) {
  let o;
  try { o = JSON.parse(rawBody); } catch { return rawBody; }
  if (Array.isArray(o.Segments) && Array.isArray(override.route)) {
    o.Segments = o.Segments.map((s, i) => {
      const r = override.route[i];
      return r ? { ...s, Origin: r[0], Destination: r[1] } : s;
    });
  }
  if (Array.isArray(override.preferredAirlines)) {
    o.PreferredAirlines = override.preferredAirlines.slice();
  }
  return JSON.stringify(o, null, 2);
}

// Overwrite passenger identity (Title/Name/DOB/Gender) by index, leaving every
// other field untouched. Runs BEFORE injectPassports so the passport lookup
// keys off the NEW FirstName.
function applyIdentityOverride(rawBody, override) {
  let obj;
  try { obj = JSON.parse(rawBody); } catch { return rawBody; }
  if (!Array.isArray(obj.Passengers)) return rawBody;
  obj.Passengers = obj.Passengers.map((pax, i) => {
    const o = override[i];
    if (!o) return pax;
    return { ...pax, Title: o.Title, FirstName: o.FirstName, LastName: o.LastName, DateOfBirth: o.DateOfBirth, Gender: o.Gender };
  });
  return JSON.stringify(obj, null, 2);
}

// Rewrite a Book/Ticket body string so every passenger carries the full
// passport block. The body contains {{vars}} but only inside JSON strings, so
// JSON.parse / stringify round-trips cleanly.
function injectPassports(rawBody) {
  let obj;
  try { obj = JSON.parse(rawBody); } catch { return rawBody; }
  if (!Array.isArray(obj.Passengers)) return rawBody;

  obj.Passengers = obj.Passengers.map((pax) => {
    const p = PASSPORTS[(pax.FirstName || "").toUpperCase()] || DEFAULT_PASSPORT;
    return {
      ...pax,
      PassportNo:               p.PassportNo,
      PassportExpiry:           p.PassportExpiry,
      PassportIssueDate:        p.PassportIssueDate,
      PassportIssueCountryCode: p.PassportIssueCountryCode,
    };
  });
  return JSON.stringify(obj, null, 2);
}

function hasPassengers(rawBody) {
  return typeof rawBody === "string" && /"Passengers"\s*:/.test(rawBody);
}

function main() {
  const src = JSON.parse(fs.readFileSync(SRC_PATH, "utf8"));

  const folders = (src.item || []).filter((folder) =>
    RESHARE_CASES.includes(caseNumberFromName(folder.name)),
  );

  if (folders.length !== RESHARE_CASES.length) {
    console.warn(`[warn] expected ${RESHARE_CASES.length} cases, matched ${folders.length}`);
  }

  // Deep-clone so we never mutate the source object graph, then apply fixes.
  const items = folders.map((folder) => {
    const f = JSON.parse(JSON.stringify(folder));
    const caseNum = caseNumberFromName(f.name);
    const idOverride = PAX_IDENTITY_OVERRIDES[caseNum];
    const searchOverride = SEARCH_OVERRIDES[caseNum];
    for (const step of f.item || []) {
      const raw = step.request?.body?.raw;
      if (!raw) continue;
      if (searchOverride && isSearchBody(raw)) {                           // NDC route → DEL–DXB, AI only
        step.request.body.raw = applySearchOverride(raw, searchOverride);
        continue;
      }
      if (!hasPassengers(raw)) continue;
      let next = raw;
      if (idOverride) next = applyIdentityOverride(next, idOverride);      // fresh names/DOB
      if (PASSPORT_CASES.includes(caseNum)) next = injectPassports(next);  // full passport
      step.request.body.raw = next;
    }
    // Keep the folder label in sync with the repointed NDC route.
    if (searchOverride) f.name = f.name.replace(/LHR/g, "DXB");
    return f;
  });

  const out = {
    info: {
      _postman_id: "tbo-reshare-" + Date.now().toString(36),
      name: "TBO Air API — Certification Reshare (Cases 6,7,8,11,12)",
      description:
        "Reshare of TBOI-rejected certification cases.\n\n" +
        "Cases 6/7/8: per-passenger base fare & taxes are corrected by the runner " +
        "(FareBreakdown ÷ PassengerCount).\n" +
        "Cases 11/12: NDC fare is auto-selected and full passport details " +
        "(PassportNo, PassportExpiry, PassportIssueDate, PassportIssueCountryCode) " +
        "are sent for every passenger.\n\n" +
        "Run with scripts/run-tbo-reshare.js.",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    variable: src.variable || [],
    item: items,
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${path.relative(ROOT, OUT_PATH)}`);
  console.log(`Cases: ${items.map((i) => caseNumberFromName(i.name)).join(", ")}`);
}

main();
