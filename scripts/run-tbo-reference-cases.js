#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const COLLECTION_PATH = path.join(__dirname, "test-cases", "TBO_Cases_07_10_Reference.postman_collection.json");
const RESULTS_DIR = process.env.TBO_RESULTS_DIR
  ? path.resolve(process.env.TBO_RESULTS_DIR)
  : path.join(__dirname, "tbo-results-reference");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

function colour(code, text) { return `\x1b[${code}m${text}\x1b[0m`; }
const bold = (t) => colour("1", t);
const cyan = (t) => colour("36", t);
const green = (t) => colour("32", t);
const red = (t) => colour("31", t);
const dim = (t) => colour("2", t);

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function loadCollection() {
  return JSON.parse(fs.readFileSync(COLLECTION_PATH, "utf8"));
}

let VARS = {};
let GLOBAL_VARS = {};

function initVars(collection) {
  for (const v of collection.variable || []) VARS[v.key] = v.value || "";
  if (process.env.TBO_USERNAME) VARS.TBO_USERNAME = process.env.TBO_USERNAME;
  if (process.env.TBO_PASSWORD) VARS.TBO_PASSWORD = process.env.TBO_PASSWORD;
  GLOBAL_VARS = { ...VARS };
}

function substitute(str) {
  if (!str) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => (
    VARS[key] !== undefined ? String(VARS[key]) : `{{${key}}}`
  ));
}

function makePm(responseText, statusCode) {
  const json = safeJson(responseText);
  return {
    response: {
      json: () => json,
      text: () => responseText,
      code: statusCode,
      to: {
        have: {
          status: (code) => {
            if (statusCode !== code) throw new Error(`Expected ${code}, got ${statusCode}`);
          },
        },
      },
    },
    collectionVariables: {
      set: (k, v) => { VARS[k] = v; },
      get: (k) => (VARS[k] !== undefined ? VARS[k] : ""),
    },
    test: (name, fn) => {
      try { fn(); console.log(green("  ✓ ") + dim(name)); }
      catch (e) { console.log(red("  ✗ ") + dim(`${name} — ${e.message}`)); }
    },
  };
}

function runTestScript(events, responseText, statusCode) {
  const ev = (events || []).find((e) => e.listen === "test");
  if (!ev) return;
  const script = ev.script.exec.join("\n");
  const pm = makePm(responseText, statusCode);
  try {
    // eslint-disable-next-line no-new-func
    new Function("pm", "console", script)(pm, { log: (...a) => console.log(dim("  [pm] "), ...a) });
  } catch (e) {
    console.log(red(`  [script error] ${e.message}`));
  }
}

async function httpPost(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const text = await res.text();
  return { status: res.status, text };
}

function stepFile(stepName) {
  return stepName.replace(/[^a-zA-Z0-9]/g, "_").replace(/__+/g, "_").toLowerCase();
}

function saveResult(caseNum, stepName, status, body) {
  const dir = path.join(RESULTS_DIR, `case-${String(caseNum).padStart(2, "0")}`);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${stepFile(stepName)}.json`);
  fs.writeFileSync(file, JSON.stringify({ status, response: safeJson(body) || body }, null, 2));
  return file;
}

function displaySearchResults(json) {
  const results = json?.Response?.Results ?? json?.Results;
  const maps = { OB: new Map(), IB: new Map() };
  if (!Array.isArray(results) || !results.length) return maps;

  const directions = Array.isArray(results[0]) ? results : [results];
  directions.forEach((dirResults, dirIdx) => {
    const label = directions.length > 1 ? (dirIdx === 0 ? "OUTBOUND" : "INBOUND") : "RESULTS";
    const key = dirIdx === 0 ? "OB" : "IB";
    console.log("\n" + bold(cyan(`  ── ${label} (${dirResults.length} flights) ──`)));
    dirResults.forEach((flight, index) => {
      const f = Array.isArray(flight) ? flight[0] : flight;
      if (!f) return;
      const firstLeg = f.Segments?.[0]?.[0] || f.Segments?.[0] || {};
      const orig = firstLeg.Origin?.Airport?.AirportCode || "?";
      const dest = firstLeg.Destination?.Airport?.AirportCode || "?";
      const dep = firstLeg.Origin?.DepTime?.replace("T", " ").slice(0, 16) || "?";
      const arr = firstLeg.Destination?.ArrTime?.replace("T", " ").slice(0, 16) || "?";
      const airlineCode = f.AirlineCode || firstLeg.Airline?.AirlineCode || "?";
      const flightNumber = firstLeg.Airline?.FlightNumber || "";
      const resultIndex = f.ResultIndex || "";
      const row = index + 1;
      maps[key].set(row, { resultIndex, flight: f });
      console.log(`  [${String(row).padStart(3)}] ${bold(`${airlineCode} ${flightNumber}`.trim().padEnd(10))}  ${orig}→${dest}  dep ${dep}  arr ${arr}  ${dim(resultIndex.slice(0, 28))}`);
    });
  });

  console.log();
  return maps;
}

function findSelectedEntry(maps, input, preferredKey) {
  const trimmed = input.trim();
  const byKey = preferredKey ? [preferredKey] : ["OB", "IB"];
  const numeric = Number(trimmed);
  if (Number.isInteger(numeric)) {
    for (const key of byKey) {
      if (maps[key]?.has(numeric)) return maps[key].get(numeric);
    }
  }

  for (const key of ["OB", "IB"]) {
    for (const entry of maps[key].values()) {
      if (entry.resultIndex === trimmed) return entry;
    }
  }
  return null;
}

function buildAirSearchResult(flight) {
  return {
    ResultIndex: flight.ResultIndex,
    Source: flight.Source,
    IsLCC: flight.IsLCC,
    IsRefundable: flight.IsRefundable,
    AirlineRemark: flight.AirlineRemark ?? null,
    Segments: (flight.Segments || []).map((segmentGroup) => {
      const legs = Array.isArray(segmentGroup) ? segmentGroup : [segmentGroup];
      return legs.map((leg) => ({
        TripIndicator: leg.TripIndicator,
        SegmentIndicator: leg.SegmentIndicator,
        Airline: {
          AirlineCode: leg.Airline?.AirlineCode || "",
          AirlineName: leg.Airline?.AirlineName || "",
          FlightNumber: leg.Airline?.FlightNumber || "",
          FareClass: leg.Airline?.FareClass || "",
          OperatingCarrier: leg.Airline?.OperatingCarrier || "",
        },
      }));
    }),
  };
}

async function askForCaseSelection(caseNum, stepName, maps) {
  if (caseNum === 7 && /search/i.test(stepName)) {
    while (true) {
      const ob = await ask("  Select OB result (display number or ResultIndex): ");
      const ib = await ask("  Select IB result (display number or ResultIndex): ");
      const obEntry = findSelectedEntry(maps, ob, "OB");
      const ibEntry = findSelectedEntry(maps, ib, "IB");
      if (obEntry?.resultIndex && ibEntry?.resultIndex) {
        VARS.OB_RESULT_INDEX = obEntry.resultIndex;
        VARS.IB_RESULT_INDEX = ibEntry.resultIndex;
        console.log(green("  ✓ OB_RESULT_INDEX set"));
        console.log(green("  ✓ IB_RESULT_INDEX set"));
        return;
      }
      console.log(red("  [!] Could not resolve both OB and IB selections. Try again."));
    }
  }

  if (caseNum === 10 && /search/i.test(stepName)) {
    while (true) {
      const pick = await ask("  Select SEARCH_RESULT_INDEX (display number or ResultIndex): ");
      const entry = findSelectedEntry(maps, pick, "OB");
      if (entry?.resultIndex && entry.flight) {
        VARS.SEARCH_RESULT_INDEX = entry.resultIndex;
        VARS.SEARCH_AIR_SEARCH_RESULT = JSON.stringify(buildAirSearchResult(entry.flight), null, 2);
        console.log(green("  ✓ SEARCH_RESULT_INDEX set"));
        return;
      }
      console.log(red("  [!] Could not resolve the selected search result. Try again."));
    }
  }
}

function captureToken(json) {
  const token = json?.TokenId || json?.Response?.TokenId || json?.Response?.TokenAgentDetails?.TokenId;
  if (token) VARS.TOKEN = token;
}

function captureFareQuote(json) {
  const resp = json?.Response;
  const res = resp?.Results;
  if (resp?.TraceId) VARS.FQ_TRACE_ID = resp.TraceId;
  if (res?.ResultIndex) VARS.FQ_RESULT_INDEX = res.ResultIndex;
  if (res?.IsLCC !== undefined && res?.IsLCC !== null) VARS.IS_LCC = String(res.IsLCC);
  for (const bd of res?.FareBreakdown || []) {
    const count = bd.PassengerCount || 1;
    const base = String((bd.BaseFare || 0) / count);
    const tax = String((bd.Tax || 0) / count);
    const yq = String((bd.YQTax || 0) / count);
    if (bd.PassengerType === 1) {
      VARS.ADT_BASE_FARE = base;
      VARS.ADT_TAX = tax;
      VARS.ADT_YQ_TAX = yq;
    }
    if (bd.PassengerType === 2) {
      VARS.CHD_BASE_FARE = base;
      VARS.CHD_TAX = tax;
      VARS.CHD_YQ_TAX = yq;
    }
    if (bd.PassengerType === 3) {
      VARS.INF_BASE_FARE = base;
      VARS.INF_TAX = tax;
      VARS.INF_YQ_TAX = yq;
    }
  }
}

function capturePriceRbd(json) {
  const resp = json?.Response;
  const res = resp?.Results;
  const first = Array.isArray(res) ? (Array.isArray(res[0]) ? res[0][0] : res[0]) : res;
  if (resp?.TraceId) VARS.RBD_TRACE_ID = resp.TraceId;
  if (first?.ResultIndex) VARS.RBD_RESULT_INDEX = first.ResultIndex;
}

function captureStaticSsr(json) {
  const resp = json?.Response;
  const meal = resp?.Meal?.[0];
  const seat = resp?.SeatPreference?.[0];
  if (meal) {
    VARS.MEAL_CODE = meal.Code || "";
    VARS.MEAL_DESCRIPTION = meal.Description || "";
  }
  if (seat) {
    VARS.SEAT_CODE = seat.Code || "";
    VARS.SEAT_DESCRIPTION = seat.Description || "";
  }
}

function captureBookOrTicket(json) {
  const resp = json?.Response;
  const inner = resp?.Response || resp;
  const fi = inner?.FlightItinerary;
  const bookingId = inner?.BookingId ?? fi?.BookingId;
  const pnr = inner?.PNR ?? fi?.PNR;
  if (bookingId !== undefined && bookingId !== null) VARS.BOOKING_ID = String(bookingId);
  if (pnr) VARS.PNR = pnr;
}

function showVars() {
  const keys = [
    "TOKEN", "TRACE_ID", "OB_RESULT_INDEX", "IB_RESULT_INDEX", "SEARCH_RESULT_INDEX",
    "RBD_RESULT_INDEX", "RBD_TRACE_ID", "FQ_RESULT_INDEX", "FQ_TRACE_ID", "BOOKING_ID", "PNR",
  ];
  const parts = keys.filter((k) => VARS[k]).map((k) => `${cyan(k)}=${String(VARS[k]).slice(0, 40)}`);
  if (parts.length) console.log(dim("  vars: ") + parts.join("  "));
}

async function runStep(step, caseNum, stepIdx) {
  console.log("\n" + bold(`  Step ${stepIdx}: ${step.name}`));

  const rawUrl = typeof step.request.url === "string" ? step.request.url : step.request.url?.raw;
  const url = substitute(rawUrl);
  const rawBody = step.request?.body?.raw || "";
  const body = substitute(rawBody);

  console.log(dim(`  → POST ${url}`));
  let result;
  try { result = await httpPost(url, body); }
  catch (e) { console.log(red(`  [network error] ${e.message}`)); return; }

  const saved = saveResult(caseNum, step.name, result.status, result.text);
  const json = safeJson(result.text);

  console.log((result.status === 200 ? green : red)(`  ← HTTP ${result.status}`) + dim(`  (saved to ${path.relative(__dirname, saved)})`));

  runTestScript(step.event, result.text, result.status);

  if (/authenticate/i.test(step.name) && json) captureToken(json);
  if (/priceRBD/i.test(step.name) && json) capturePriceRbd(json);
  if (/farequote/i.test(step.name) && json) captureFareQuote(json);
  if (/\bssr\b/i.test(step.name) && json) captureStaticSsr(json);
  if (/\bbook\b/i.test(step.name) && json) captureBookOrTicket(json);
  if (/\bticket\b/i.test(step.name) && json) captureBookOrTicket(json);

  const apiErr = json?.Error ?? json?.Response?.Error;
  if (apiErr?.ErrorCode && apiErr.ErrorCode !== 0 && apiErr.ErrorCode !== "0") {
    console.log(red(`  [API error ${apiErr.ErrorCode}] ${apiErr.ErrorMessage || ""}`));
  }

  if (/\bsearch\b/i.test(step.name) && json) {
    const maps = displaySearchResults(json);
    await askForCaseSelection(caseNum, step.name, maps);
  }

  showVars();
}

async function runCase(caseItem, caseNum) {
  console.log("\n" + bold(cyan(`Case ${caseNum}: ${caseItem.name}`)));

  if (!VARS.TBO_USERNAME || !VARS.TBO_PASSWORD) {
    const u = await ask("  TBO_USERNAME: ");
    const p = await ask("  TBO_PASSWORD: ");
    VARS.TBO_USERNAME = u.trim();
    VARS.TBO_PASSWORD = p.trim();
  }

  const KEEP = ["TBO_USERNAME", "TBO_PASSWORD"];
  const kept = {};
  for (const key of KEEP) if (VARS[key]) kept[key] = VARS[key];
  VARS = { ...GLOBAL_VARS, ...kept };

  const steps = caseItem.item || [];
  for (let i = 0; i < steps.length; i += 1) {
    await runStep(steps[i], caseNum, i + 1);
    if (i < steps.length - 1) {
      const ans = await ask(`\n  Continue to step ${i + 2}: "${steps[i + 1].name}" ? [Y/n/q]: `);
      const norm = ans.trim().toLowerCase();
      if (norm === "q") process.exit(0);
      if (norm === "n") break;
    }
  }

  console.log("\n" + green(`  ✓ Case ${caseNum} complete.`));
}

async function main() {
  const collection = loadCollection();
  initVars(collection);

  const cases = collection.item || [];
  const requested = Number(process.argv[2] || 0);
  const target = requested
    ? cases.find((item) => item.name.startsWith(`Case ${String(requested).padStart(2, "0")}`))
    : null;

  if (target) {
    await runCase(target, requested);
    rl.close();
    return;
  }

  console.log(bold(cyan("Available cases")));
  for (const item of cases) console.log(`  - ${item.name}`);
  const answer = await ask("\nRun which case number? ");
  const chosen = Number(answer.trim());
  const selected = cases.find((item) => item.name.startsWith(`Case ${String(chosen).padStart(2, "0")}`));
  if (!selected) {
    console.log(red("Unknown case."));
    rl.close();
    process.exit(1);
  }

  await runCase(selected, chosen);
  rl.close();
}

main().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});
