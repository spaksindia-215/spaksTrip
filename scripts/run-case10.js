#!/usr/bin/env node
/**
 * Case 10 — GDS Advance Search + PriceRBD (standalone runner)
 *
 * Drives the 6-step flow against TBO/TekTravels:
 *   1. Authenticate
 *   2. Search (JT=4, Sources=[GDS], ResultFareType=2)
 *   3. PriceRBD (seat-sells the chosen RBD letter)
 *   4. FareQuote
 *   5. Book (Non-LCC, 2 Adults)
 *   6. Ticket (BookingId + PNR)
 *
 * Usage:
 *   TBO_USERNAME=xxx TBO_PASSWORD=yyy node run-case10.js
 *
 * Reads the collection at test-cases/case-10/case10.postman_collection.json,
 * substitutes {{vars}}, and pauses after Search so the user can pick a
 * ResultIndex + RBD letter from the displayed flights.
 *
 * Responses are saved to ./tbo-results/case-10-standalone/<step>.json
 */

"use strict";

const fs   = require("fs");
const path = require("path");

// ─── stdin helper (resilient to mid-run readline close) ─────────────────────
let rl       = require("readline").createInterface({ input: process.stdin, output: process.stdout });
let rlClosed = false;
rl.on("close", () => { rlClosed = true; });

const ask = (q) => new Promise((res) => {
  if (rlClosed) {
    rl       = require("readline").createInterface({ input: process.stdin, output: process.stdout });
    rlClosed = false;
    rl.on("close", () => { rlClosed = true; });
  }
  rl.question(q, res);
});

// ─── tiny ansi helpers ──────────────────────────────────────────────────────
const c     = (code, t) => `\x1b[${code}m${t}\x1b[0m`;
const bold  = (t) => c("1",  t);
const dim   = (t) => c("2",  t);
const green = (t) => c("32", t);
const red   = (t) => c("31", t);
const cyan  = (t) => c("36", t);

const safeJson = (s) => { try { return JSON.parse(s); } catch { return null; } };

// ─── collection + vars ──────────────────────────────────────────────────────
const COLLECTION_PATH = path.join(__dirname, "test-cases", "case-10", "case10.postman_collection.json");
const RESULTS_DIR     = path.join(__dirname, "tbo-results", "case-10-standalone");

if (!fs.existsSync(COLLECTION_PATH)) {
  console.error(red(`Collection not found: ${COLLECTION_PATH}`));
  process.exit(1);
}

const collection = JSON.parse(fs.readFileSync(COLLECTION_PATH, "utf8"));
const VARS = {};
for (const v of collection.variable || []) VARS[v.key] = v.value || "";
if (process.env.TBO_USERNAME) VARS.TBO_USERNAME = process.env.TBO_USERNAME;
if (process.env.TBO_PASSWORD) VARS.TBO_PASSWORD = process.env.TBO_PASSWORD;

// Allow TBO_VAR_<NAME> overrides (e.g. TBO_VAR_DEPARTURE_DATE=2026-09-01T00:00:00)
for (const [k, v] of Object.entries(process.env)) {
  if (k.startsWith("TBO_VAR_") && v !== undefined) VARS[k.slice("TBO_VAR_".length)] = v;
}

const substitute = (s) => !s ? s : s.replace(/\{\{(\w+)\}\}/g, (_, k) => VARS[k] !== undefined ? VARS[k] : `{{${k}}}`);

// ─── pm shim for running collection scripts ─────────────────────────────────
function makePm(responseText, statusCode) {
  const json = safeJson(responseText);
  return {
    response: {
      json: () => json,
      text: () => responseText,
      code: statusCode,
      to: { have: { status: (code) => { if (statusCode !== code) throw new Error(`Expected ${code}, got ${statusCode}`); } } },
    },
    collectionVariables: {
      set: (k, v) => { VARS[k] = v; },
      get: (k)    => VARS[k] !== undefined ? VARS[k] : "",
    },
    test: (name, fn) => {
      try   { fn(); process.stdout.write(green("  ✓ ") + dim(name) + "\n"); }
      catch (e) { process.stdout.write(red("  ✗ ") + dim(name) + " — " + e.message + "\n"); }
    },
  };
}

function runTestScript(events, responseText, statusCode) {
  const ev = (events || []).find((e) => e.listen === "test");
  if (!ev) return;
  try {
    // eslint-disable-next-line no-new-func
    new Function("pm", "console", ev.script.exec.join("\n"))(makePm(responseText, statusCode), {
      log:  (...a) => console.log(dim("  [pm] ") + a.join(" ")),
      warn: (...a) => console.warn(dim("  [pm] ") + a.join(" ")),
    });
  } catch (e) {
    console.error(red(`  [script error] `) + e.message);
  }
}

// ─── HTTP ───────────────────────────────────────────────────────────────────
async function httpPost(url, body) {
  const res  = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
  const text = await res.text();
  return { status: res.status, text };
}

// Mirror the convention used by run-tbo-tests.js + tbo-results/case-05/...
//   <method>Request.json  (camelCase + variant letter)
//   <method>Response.json (all lowercase, no variant letter; wraps status+body)
function methodSlugs(stepName) {
  const m = String(stepName).match(/^\s*Step\s+\d+([a-z]?)\s*[—\-–]\s*(.+)$/i);
  if (!m) {
    const fb = String(stepName).replace(/[^A-Za-z0-9]+/g, "") || "step";
    return { camel: fb, lower: fb.toLowerCase() };
  }
  const variant = m[1] ? m[1].toUpperCase() : "";
  const rest    = m[2].trim();
  const word    = (rest.match(/^[A-Za-z][A-Za-z]*/) || ["step"])[0];
  const camel   = /^[A-Z]+$/.test(word)
    ? word.toLowerCase()
    : word.charAt(0).toLowerCase() + word.slice(1);
  return { camel: camel + variant, lower: word.toLowerCase() };
}

function saveExchange(stepName, requestBody, status, responseText) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const { camel, lower } = methodSlugs(stepName);

  if (requestBody !== undefined && requestBody !== null && requestBody !== "") {
    const reqJson = safeJson(requestBody);
    const out     = reqJson ? JSON.stringify(reqJson, null, 2) : String(requestBody);
    fs.writeFileSync(path.join(RESULTS_DIR, `${camel}Request.json`), out + "\n");
  }

  const resFile = path.join(RESULTS_DIR, `${lower}Response.json`);
  const resJson = safeJson(responseText);
  fs.writeFileSync(resFile, JSON.stringify({ status, response: resJson || responseText }, null, 2));
  return resFile;
}

// ─── search result display ──────────────────────────────────────────────────
function displaySearchResults(json) {
  const results = json?.Response?.Results ?? json?.Results;
  if (!Array.isArray(results) || results.length === 0) {
    console.log(red("\n  No Results returned by Search. Try a different date or route."));
    return;
  }
  const directions = Array.isArray(results[0]) ? results : [results];

  directions.forEach((dirResults, dIdx) => {
    if (directions.length > 1) console.log("\n" + bold(cyan(`  ── Direction ${dIdx + 1} (${dirResults.length} flights) ──`)));
    else console.log("\n" + bold(cyan(`  ── Results (${dirResults.length} flights) ──`)));

    dirResults.forEach((flight, i) => {
      const f = Array.isArray(flight) ? flight[0] : flight;
      if (!f) return;
      const seg0   = f.Segments?.[0]?.[0] || f.Segments?.[0] || {};
      const orig   = seg0.Origin?.Airport?.AirportCode      || "?";
      const dest   = seg0.Destination?.Airport?.AirportCode || "?";
      const dep    = seg0.Origin?.DepTime?.replace("T", " ").slice(0, 16)      || "?";
      const arr    = seg0.Destination?.ArrTime?.replace("T", " ").slice(0, 16) || "?";
      const al     = `${seg0.Airline?.AirlineCode || f.AirlineCode || "?"} ${seg0.Airline?.FlightNumber || ""}`;
      const fare   = f.Fare?.PublishedFare || f.Fare?.OfferedFare || "—";
      const refund = f.IsRefundable ? "Ref" : "NonRef";
      const lcc    = f.IsLCC ? "LCC" : "GDS";
      const classes = (seg0.Availability || []).filter((a) => Number(a.Seats) > 0).map((a) => a.Class).join(",") || "—";

      console.log(`\n  [${String(i + 1).padStart(3)}] ${bold(al.trim().padEnd(10))}  ${orig}→${dest}  dep ${dep}  arr ${arr}  INR ${fare}  ${dim(`${lcc} ${refund}`)}`);
      console.log(`        ${dim("RBDs avail:")} ${cyan(classes)}`);
    });
  });
  console.log();
}

async function promptForSelection(json) {
  const results = json?.Response?.Results ?? json?.Results;
  if (!Array.isArray(results) || results.length === 0) return false;

  const directions = Array.isArray(results[0]) ? results : [results];
  const flat = directions[0]; // Advance Search returns a single direction

  // Get the choice
  let chosen;
  while (true) {
    const ans = (await ask(`  Pick flight number [1-${flat.length}]: `)).trim();
    const n   = parseInt(ans, 10);
    if (n >= 1 && n <= flat.length) { chosen = flat[n - 1]; break; }
    console.log(red("  [!] Invalid choice."));
  }
  const f = Array.isArray(chosen) ? chosen[0] : chosen;
  const seg0 = f.Segments?.[0]?.[0] || f.Segments?.[0] || {};

  VARS.SEARCH_RESULT_INDEX = f.ResultIndex || "";
  VARS.SOURCE              = String(f.Source ?? 4);
  VARS.IS_REFUNDABLE       = String(!!f.IsRefundable);
  VARS.AIRLINE_REMARK      = f.AirlineRemark || "";
  VARS.AIRLINE_CODE        = seg0.Airline?.AirlineCode      || "";
  VARS.AIRLINE_NAME        = seg0.Airline?.AirlineName      || "";
  VARS.FLIGHT_NO           = seg0.Airline?.FlightNumber     || "";
  VARS.OPERATING_CARRIER   = seg0.Airline?.OperatingCarrier || "";

  const classes = (seg0.Availability || []).filter((a) => Number(a.Seats) > 0).map((a) => a.Class);
  if (!classes.length) {
    console.log(red("  [!] Selected flight has no available RBD letters. Pick another flight."));
    return false;
  }
  console.log(`  Available RBDs: ${cyan(classes.join(", "))}`);

  while (true) {
    const ans = (await ask(`  Pick an RBD letter from above: `)).trim().toUpperCase();
    if (classes.includes(ans)) { VARS.RBD = ans; break; }
    console.log(red("  [!] Not one of the listed RBDs."));
  }

  console.log(green("  ✓ Captured: ") +
    `RESULT_INDEX=${VARS.SEARCH_RESULT_INDEX.slice(0, 24)}…  SOURCE=${VARS.SOURCE}  ` +
    `AIRLINE=${VARS.AIRLINE_CODE}/${VARS.FLIGHT_NO}  RBD=${VARS.RBD}`);
  return true;
}

// ─── prompt for passenger details (Step 5) ──────────────────────────────────
async function promptPassengerOverrides() {
  console.log(dim("\n  Passenger details for Book request (press Enter to keep defaults from collection):"));
  console.log(dim("  Defaults: 2 adults, lead = Miss Harshi Dhiman, passport KJHHJKHKJH."));
  const ans = (await ask("  Edit passenger details? [y/N]: ")).trim().toLowerCase();
  if (ans !== "y") return null;

  // For simplicity, only ask for the lead-pax basics — anything else stays as the template default.
  const fn  = (await ask("  Lead first name: ")).trim();
  const ln  = (await ask("  Lead last name: ")).trim();
  const dob = (await ask("  Lead DOB (YYYY-MM-DD): ")).trim();
  const pass = (await ask("  Lead passport no: ")).trim();
  const exp  = (await ask("  Passport expiry (YYYY-MM-DD): ")).trim();
  return { fn, ln, dob, pass, exp };
}

function applyPassengerOverrides(body, overrides) {
  if (!overrides) return body;
  let out = body;
  if (overrides.fn)  out = out.replace(/"FirstName":\s*"Harshi"/, `"FirstName": ${JSON.stringify(overrides.fn)}`);
  if (overrides.ln)  out = out.replace(/"LastName":\s*"Dhiman"/, `"LastName": ${JSON.stringify(overrides.ln)}`);
  if (overrides.dob) out = out.replace(/"DateOfBirth":\s*"2000-08-02T00:00:00"/, `"DateOfBirth": "${overrides.dob}T00:00:00"`);
  if (overrides.pass) out = out.replace(/"PassportNo":\s*"KJHHJKHKJH"/, `"PassportNo": ${JSON.stringify(overrides.pass)}`);
  if (overrides.exp)  out = out.replace(/"PassportExpiry":\s*"2027-12-06T00:00:00"/, `"PassportExpiry": "${overrides.exp}T00:00:00"`);
  return out;
}

// ─── per-step runner ────────────────────────────────────────────────────────
async function runStep(step, stepIdx) {
  console.log("\n" + bold(`  Step ${stepIdx}: ${step.name}`));

  const url     = substitute(typeof step.request.url === "string" ? step.request.url : step.request.url?.raw);
  let   body    = step.request?.body?.raw ? substitute(step.request.body.raw) : undefined;

  // Step 5 (Book): give the user a chance to override passenger basics
  if (/Book/i.test(step.name)) {
    const overrides = await promptPassengerOverrides();
    body = applyPassengerOverrides(body, overrides);
  }

  // Warn about any unresolved {{VAR}} placeholders
  if (body) {
    const missing = [...body.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]);
    if (missing.length) console.log(red(`  [!] Empty variables: `) + missing.join(", "));
  }

  console.log(dim(`  → POST ${url}`));

  let result;
  try { result = await httpPost(url, body); }
  catch (e) { console.error(red(`  [network error] `) + e.message); return; }

  const json  = safeJson(result.text);
  const saved = saveExchange(step.name, body, result.status, result.text);

  const colour = result.status === 200 ? green : red;
  console.log(colour(`  ← HTTP ${result.status}`) + dim(`  (saved to ${path.relative(__dirname, saved)})`));

  const apiErr = json?.Error ?? json?.Response?.Error;
  if (apiErr?.ErrorCode && apiErr.ErrorCode !== 0) {
    console.log(red(`  [API error ${apiErr.ErrorCode}] `) + (apiErr.ErrorMessage || ""));
  }

  runTestScript(step.event, result.text, result.status);

  // After Search, show results table and prompt for selection
  if (/Search/i.test(step.name) && stepIdx === 2 && json) {
    displaySearchResults(json);
    const ok = await promptForSelection(json);
    if (!ok) {
      console.log(red("  Aborting — cannot proceed without a valid selection."));
      process.exit(1);
    }
  }

  return result;
}

// ─── main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n" + bold(cyan("─".repeat(64))));
  console.log(bold(cyan("  Case 10 — GDS Advance Search + PriceRBD (standalone runner)")));
  console.log(bold(cyan("─".repeat(64))));

  if (!VARS.TBO_USERNAME || !VARS.TBO_PASSWORD) {
    console.log(red("\n  TBO_USERNAME / TBO_PASSWORD not set in env."));
    VARS.TBO_USERNAME = (await ask("  TBO_USERNAME: ")).trim();
    VARS.TBO_PASSWORD = (await ask("  TBO_PASSWORD: ")).trim();
  }

  const steps = collection.item || [];
  for (let i = 0; i < steps.length; i++) {
    await runStep(steps[i], i + 1);
    if (i < steps.length - 1) {
      const ans = (await ask(`\n  Continue to step ${i + 2}: "${steps[i + 1].name}" ? [Y/n/q]: `)).trim().toLowerCase();
      if (ans === "q" || ans === "n") {
        console.log(`  Stopped after step ${i + 1}.`);
        break;
      }
    }
  }

  console.log("\n" + green("  ✓ Case 10 run complete.") + "\n");
  if (VARS.BOOKING_ID || VARS.PNR) {
    console.log(`  ${bold("BookingId:")} ${VARS.BOOKING_ID || "—"}   ${bold("PNR:")} ${VARS.PNR || "—"}`);
  }
  rl.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
