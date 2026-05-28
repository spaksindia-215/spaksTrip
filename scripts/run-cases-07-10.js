#!/usr/bin/env node
// Thin launcher that points the existing TBO runner at the Cases 07 + 10
// reference collection. Results land in tbo-results-07-10/ so they don't
// overwrite other runs.
//
// Usage:
//   TBO_USERNAME=xxx TBO_PASSWORD=yyy node run-cases-07-10.js [case_number] [flags]
//
// case_number: 1 or 2 (positional in this collection — 1 = Case 07, 2 = Case 10).
//
// Route / date flags (optional — defaults come from the collection variables):
//   --from07=<IATA>         Case 07 outbound origin       (default DEL)
//   --to07=<IATA>           Case 07 outbound destination  (default BOM)
//   --out07=YYYY-MM-DD      Case 07 outbound date         (default 2026-08-25)
//   --in07=YYYY-MM-DD       Case 07 inbound date          (default 2026-08-28)
//   --route07=DEL-BLR       Shortcut for --from07/--to07  ("DEL/BLR" also works)
//   --from10=<IATA>         Case 10 origin                (default DEL)
//   --to10=<IATA>           Case 10 destination           (default DXB)
//   --date10=YYYY-MM-DD     Case 10 departure date        (default 2026-08-20)
//   --route10=DEL-BOM       Shortcut for --from10/--to10
//
// All flags below the surface set TBO_VAR_<NAME> env vars, which the runner
// promotes into collection variables (see run-tbo-tests.js initVars).
//
// Examples:
//   node run-cases-07-10.js 1 --route07=DEL-BLR --out07=2026-09-10 --in07=2026-09-15
//   node run-cases-07-10.js 2 --route10=DEL-BOM --date10=2026-09-12

"use strict";

const path = require("path");

function parseRoute(arg) {
  if (!arg) return null;
  const m = String(arg).toUpperCase().match(/\b([A-Z]{3})\b[^A-Z0-9]*\b([A-Z]{3})\b/);
  return m ? [m[1], m[2]] : null;
}

function pluck(flag) {
  const idx = process.argv.findIndex((a) => a === flag || a.startsWith(flag + "="));
  if (idx === -1) return undefined;
  const arg = process.argv[idx];
  const val = arg.includes("=") ? arg.slice(arg.indexOf("=") + 1) : process.argv[idx + 1];
  process.argv.splice(idx, arg.includes("=") ? 1 : 2);
  return val;
}

function set(varName, value) {
  if (value === undefined || value === null || value === "") return;
  process.env[`TBO_VAR_${varName}`] = String(value);
}

// ─── Case 07 overrides ──────────────────────────────────────────────────────
const route07 = parseRoute(pluck("--route07"));
if (route07) { set("CASE07_FROM", route07[0]); set("CASE07_TO", route07[1]); }
set("CASE07_FROM", pluck("--from07")?.toUpperCase());
set("CASE07_TO",   pluck("--to07")?.toUpperCase());
set("CASE07_OUTBOUND_DATE", pluck("--out07"));
set("CASE07_INBOUND_DATE",  pluck("--in07"));

// ─── Case 10 overrides ──────────────────────────────────────────────────────
const route10 = parseRoute(pluck("--route10"));
if (route10) { set("CASE10_FROM", route10[0]); set("CASE10_TO", route10[1]); }
set("CASE10_FROM", pluck("--from10")?.toUpperCase());
set("CASE10_TO",   pluck("--to10")?.toUpperCase());
set("CASE10_DATE", pluck("--date10"));

// ─── Wire collection + results directory ────────────────────────────────────
process.env.TBO_COLLECTION ||= path.join(
  __dirname,
  "test-cases",
  "TBO_Cases_07_10_Reference.postman_collection.json",
);

process.env.TBO_RESULTS_DIR ||= path.join(__dirname, "tbo-results-07-10");

require("./run-tbo-tests.js");
