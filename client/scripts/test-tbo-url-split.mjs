#!/usr/bin/env node
/**
 * Test #15 — Search & Book URL Validation.
 *
 * Confirms whether this TBO account accepts the Search-vs-Book service split:
 *   Search service  → BookingEngineService_Air      (Search)
 *   Booking service → BookingEngineService_AirBook   (FareRule, FareQuote, SSR,
 *                                                      Book, Ticket, GetBookingDetails)
 *
 * Strategy (NO booking is ever created):
 *   1. Authenticate.
 *   2. Search on _Air to get a live ResultIndex + TraceId.
 *   3. Call the NON-transactional booking-service methods (FareRule, FareQuote, SSR)
 *      on BOTH _Air and _AirBook and compare the results.
 *
 * Because Book/Ticket live on the SAME _AirBook service as FareRule/FareQuote/SSR,
 * if those succeed on _AirBook the split is proven for live Book/Ticket too — without
 * sending a single Book request. (Book/Ticket are intentionally NOT called.)
 *
 * Usage:
 *   node scripts/test-tbo-url-split.mjs
 *   node scripts/test-tbo-url-split.mjs --from DEL --to BOM --days 14
 *
 * Requires Node >= 18 (global fetch). Reads credentials from client/.env.local.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// ─── tiny .env.local loader (no deps) ──────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "..", ".env.local");

function loadEnv(path) {
  const env = {};
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    console.error(`Could not read ${path}. Run this from the client/ project.`);
    process.exit(2);
  }
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

const env = loadEnv(ENV_PATH);

// ─── args ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const FROM = getArg("from", "DEL");
const TO = getArg("to", "BOM");
const DAYS = parseInt(getArg("days", "14"), 10);

// ─── host resolution (mirrors src/lib/adapters/tbo/auth.ts) ─────────────────────
function stripSlash(u) {
  return u.replace(/\/$/, "");
}
function serviceBase(explicit, fallbackHost) {
  if (explicit) return stripSlash(explicit);
  const base = env.TBO_API_URL;
  if (!base) return `https://${fallbackHost}`;
  try {
    const url = new URL(stripSlash(base));
    url.hostname = fallbackHost;
    return stripSlash(url.toString());
  } catch {
    return `https://${fallbackHost}`;
  }
}

const SHARED_BASE = serviceBase(env.TBO_SHARED_API_URL, "sharedapi.tektravels.com");
const AIR_BASE = serviceBase(env.TBO_AIR_API_URL, "api.tektravels.com");

const SEARCH_SVC = `${AIR_BASE}/BookingEngineService_Air/AirService.svc/rest`;
const BOOK_SVC = `${AIR_BASE}/BookingEngineService_AirBook/AirService.svc/rest`;

const END_USER_IP = env.TBO_END_USER_IP || "1.1.1.1";
const CLIENT_ID = env.TBO_CLIENT_ID || "ApiIntegrationNew";

// ─── helpers ─────────────────────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m",
  yellow: "\x1b[33m", dim: "\x1b[2m", bold: "\x1b[1m",
};
const ok = (s) => `${C.green}${s}${C.reset}`;
const bad = (s) => `${C.red}${s}${C.reset}`;
const warn = (s) => `${C.yellow}${s}${C.reset}`;

async function postJson(url, body, timeoutMs = 60000) {
  const started = Date.now();
  let res, text;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    text = await res.text();
  } catch (e) {
    return { reachable: false, httpStatus: 0, errorCode: null, errorMessage: String(e?.message ?? e), ms: Date.now() - started };
  }
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    return { reachable: false, httpStatus: res.status, errorCode: null, errorMessage: `non-JSON: ${text.slice(0, 120)}`, ms: Date.now() - started, raw: text };
  }
  return { reachable: true, httpStatus: res.status, json, ms: Date.now() - started };
}

// Extract the TBO Error node from any response envelope shape.
function readError(json) {
  const r = json?.Response ?? json;
  const err = r?.Error ?? json?.Error;
  return { code: err?.ErrorCode ?? null, message: err?.ErrorMessage ?? "" };
}

function isoDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

// ─── main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`${C.bold}TBO URL split test (#15 — Search & Book URL Validation)${C.reset}`);
  console.log(`${C.dim}Air base:    ${AIR_BASE}${C.reset}`);
  console.log(`${C.dim}Shared base: ${SHARED_BASE}${C.reset}`);
  console.log(`${C.dim}Route:       ${FROM} → ${TO}  on ${isoDate(DAYS)} (today + ${DAYS}d)${C.reset}`);
  console.log("");

  if (!env.TBO_USER_NAME || !env.TBO_PASSWORD) {
    console.error(bad("TBO_USER_NAME / TBO_PASSWORD missing in .env.local"));
    process.exit(2);
  }

  // [1] Authenticate
  const authUrl = `${SHARED_BASE}/SharedData.svc/rest/Authenticate`;
  const auth = await postJson(authUrl, {
    ClientId: CLIENT_ID,
    UserName: env.TBO_USER_NAME,
    Password: env.TBO_PASSWORD,
    EndUserIp: END_USER_IP,
  });
  const token = auth.json?.TokenId;
  if (!auth.reachable || !token) {
    console.error(`[1] Authenticate ... ${bad("FAILED")}  (${auth.httpStatus}) ${auth.errorMessage ?? readError(auth.json).message}`);
    process.exit(1);
  }
  console.log(`[1] Authenticate ............ ${ok("OK")}  ${C.dim}(token ${token.slice(0, 6)}…, ${auth.ms}ms)${C.reset}`);

  const base = { TokenId: token, EndUserIp: END_USER_IP };

  // [2] Search on _Air
  const search = await postJson(`${SEARCH_SVC}/Search`, {
    ...base,
    AdultCount: "1", ChildCount: "0", InfantCount: "0",
    DirectFlight: "false", OneStopFlight: "false",
    JourneyType: "1", PreferredAirlines: null, Sources: null,
    Segments: [{
      Origin: FROM, Destination: TO, FlightCabinClass: "2",
      PreferredDepartureTime: `${isoDate(DAYS)}T00:00:00`,
      PreferredArrivalTime: `${isoDate(DAYS)}T00:00:00`,
    }],
  });
  const sErr = readError(search.json);
  const traceId = search.json?.Response?.TraceId;
  const results = search.json?.Response?.Results;
  const flat = Array.isArray(results) ? (Array.isArray(results[0]) ? results[0] : results) : [];
  const first = flat.find((r) => r?.ResultIndex);
  if (!search.reachable || sErr.code) {
    console.error(`[2] Search (_Air) ........... ${bad("FAILED")}  (${search.httpStatus}) ErrCode ${sErr.code} ${sErr.message}`);
    process.exit(1);
  }
  if (!traceId || !first) {
    console.error(`[2] Search (_Air) ........... ${warn("NO RESULTS")} — try a different --from/--to/--days`);
    process.exit(1);
  }
  console.log(`[2] Search (_Air) ........... ${ok("OK")}  ${C.dim}(TraceId ${traceId.slice(0, 8)}…, ${flat.length} results, LCC=${first.IsLCC}, ${search.ms}ms)${C.reset}`);
  console.log("");

  const ri = first.ResultIndex;
  const payload = { ...base, ResultIndex: ri, TraceId: traceId };

  // [3] Run FareRule / FareQuote / SSR on BOTH services.
  const methods = ["FareRule", "FareQuote", "SSR"];
  console.log(`[3] Booking-service methods on each path ${C.dim}(Book/Ticket NOT called — same _AirBook service):${C.reset}`);
  console.log(`    ${"method".padEnd(11)}${"_Air (Search svc)".padEnd(26)}_AirBook (Book svc)`);

  const cell = (r) => {
    if (!r.reachable) {
      const why = String(r.errorMessage || "").replace(/\s+/g, " ").slice(0, 24);
      return bad(`HTTP ${r.httpStatus || "net"}: ${why}`);
    }
    const e = readError(r.json);
    if (e.code === 0 || e.code === null) return ok(`OK ${r.httpStatus} (${r.ms}ms)`);
    return warn(`ErrCode ${e.code} ${String(e.message).slice(0, 20)}`);
  };

  let airBookAllOk = true;
  let airAlsoOk = true;
  for (const m of methods) {
    // Call _AirBook first (the path we are validating), then _Air for comparison.
    const ab = await postJson(`${BOOK_SVC}/${m}`, payload);
    const a = await postJson(`${SEARCH_SVC}/${m}`, payload);

    const abErr = readError(ab.json);
    const aErr = readError(a.json);
    const abGood = ab.reachable && (abErr.code === 0 || abErr.code === null);
    const aGood = a.reachable && (aErr.code === 0 || aErr.code === null);
    if (!abGood) airBookAllOk = false;
    if (!aGood) airAlsoOk = false;

    console.log(`    ${m.padEnd(11)}${stripAnsiPad(cell(a), 26)}${cell(ab)}`);
  }

  // ─── conclusion ──────────────────────────────────────────────────────────────
  console.log("");
  console.log(`${C.bold}Conclusion${C.reset}`);
  console.log(`  _AirBook accepted for booking-service methods: ${airBookAllOk ? ok("YES") : bad("NO")}`);
  console.log(`  _Air also accepts them (lenient env):          ${airAlsoOk ? ok("YES") : warn("NO")}`);
  console.log("");
  if (airBookAllOk) {
    console.log(ok("  ✔ Keep the split. Book/Ticket on _AirBook will work for this account"));
    console.log(`${C.dim}    (FareRule/FareQuote/SSR share the _AirBook service with Book/Ticket).${C.reset}`);
    process.exitCode = 0;
  } else {
    console.log(bad("  ✗ _AirBook is NOT available for this account/host."));
    console.log(`${C.dim}    Keep AIR_BOOK_SVC = "BookingEngineService_Air/..." (current default) in`);
    console.log(`    src/lib/adapters/tbo/auth.ts. Only switch to _AirBook once TBO provisions it`);
    console.log(`    for your account and this script reports YES.${C.reset}`);
    process.exitCode = 1;
  }
}

// pad a string that contains ANSI colour codes to a visible width
function stripAnsiPad(s, width) {
  const visible = s.replace(/\x1b\[[0-9;]*m/g, "").length;
  return s + " ".repeat(Math.max(1, width - visible));
}

main().catch((e) => {
  console.error(bad(`Unexpected error: ${e?.stack ?? e}`));
  process.exit(1);
});
