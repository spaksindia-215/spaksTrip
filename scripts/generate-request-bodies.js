#!/usr/bin/env node
/**
 * Generates request body JSON files for cases 4–12 from the canonical
 * Postman collection at test-cases/TBO_Certification_Tests.postman_collection.json.
 *
 * Writes each step's request body to
 *   tbo-results/case-NN/<stepCamel>Request.json
 *
 * Existing response files (step_N_*.json saved by the runner) are left untouched.
 *
 * Postman {{VAR}} placeholders are kept verbatim — these files are documentation
 * of request shape, not pre-substituted executable payloads. To run a real
 * request, use run-tbo-tests.js / run-case10.js or the Postman collection itself.
 *
 * Safe to re-run; existing files are overwritten.
 */

"use strict";

const fs   = require("fs");
const path = require("path");

const ROOT       = __dirname;
const COLLECTION = path.join(ROOT, "test-cases", "TBO_Certification_Tests.postman_collection.json");
const OUT_BASE   = path.join(ROOT, "tbo-results");

// Cases to generate. 1–3 are already captured under tbo-results/case-0N/
// from the gitignored test-case-01.js / 02.js / 03.js, so we skip those here.
const CASE_RANGE = { from: 4, to: 12 };

// ─── slug helpers ───────────────────────────────────────────────────────────

// Pull the first API-method word out of "Step Nx — <Method> (...)".
// Lowercases all-caps tokens (SSR -> ssr) and lowers the first letter otherwise
// (FareRule -> fareRule, GetBookingDetails -> getBookingDetails, PriceRBD -> priceRBD).
function slugify(stepName) {
  const m = String(stepName).match(/^\s*Step\s+\d+([a-z]?)\s*[—\-–]\s*(.+)$/i);
  if (!m) {
    return stepName.replace(/[^A-Za-z0-9]+/g, "_").toLowerCase();
  }
  const variant = m[1];          // "", "a", "b", "c"
  const rest    = m[2].trim();
  const word    = (rest.match(/^[A-Za-z][A-Za-z]*/) || ["step"])[0];

  const base = /^[A-Z]+$/.test(word)
    ? word.toLowerCase()
    : word.charAt(0).toLowerCase() + word.slice(1);

  return variant ? `${base}${variant.toUpperCase()}` : base;
}

// ─── main ───────────────────────────────────────────────────────────────────

const collection = JSON.parse(fs.readFileSync(COLLECTION, "utf8"));
const cases      = collection.item || [];

let totalFiles = 0;

for (let n = CASE_RANGE.from; n <= CASE_RANGE.to; n++) {
  const caseItem = cases[n - 1];
  if (!caseItem) {
    console.warn(`[skip] case ${n}: not present in collection`);
    continue;
  }

  const outDir = path.join(OUT_BASE, `case-${String(n).padStart(2, "0")}`);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`\nCase ${String(n).padStart(2, "0")}  →  ${path.relative(ROOT, outDir)}  (${caseItem.name})`);

  const usedSlugs = new Map();
  for (const step of (caseItem.item || [])) {
    const rawBody = step.request && step.request.body && step.request.body.raw;
    if (!rawBody) {
      console.log(`  · ${step.name}: no request body — skipped`);
      continue;
    }

    let slug = slugify(step.name);
    // Dedupe on the rare collision (no variant letter and same first word).
    const seen = usedSlugs.get(slug) || 0;
    usedSlugs.set(slug, seen + 1);
    if (seen > 0) slug = `${slug}${seen + 1}`;

    // Try to pretty-print; if the body is unparseable JSON (placeholders may
    // sit in non-string positions like `"BookingId": {{BOOKING_ID}}`), save raw.
    let out;
    try {
      out = JSON.stringify(JSON.parse(rawBody), null, 2) + "\n";
    } catch {
      out = rawBody.endsWith("\n") ? rawBody : rawBody + "\n";
    }

    const filePath = path.join(outDir, `${slug}Request.json`);
    fs.writeFileSync(filePath, out);
    console.log(`  ✓ ${path.basename(filePath)}`);
    totalFiles++;
  }
}

console.log(`\nDone. ${totalFiles} request file(s) written.`);
