#!/usr/bin/env node
/**
 * Extracts request/response JSON blocks from the gitignored
 * test-case-01.js / test-case-02.js / test-case-03.js capture files
 * and writes them under tbo-results/case-NN/ as
 *   <stepCamelCase>Request.json
 *   <stepCamelCase>Response.json
 *
 * Headers like `// ######### 01 Auth ##########` open a step.
 * Within each step, the next `// ... Request ...` marker starts a
 * request block; the next `// ... Response ...` marker starts a
 * response block. The first balanced { ... } after the marker is
 * captured (string-aware), pretty-printed, and saved.
 *
 * Safe to re-run; existing files are overwritten.
 */

"use strict";

const fs   = require("fs");
const path = require("path");

const ROOT       = __dirname;
const OUT_BASE   = path.join(ROOT, "tbo-results");
const SOURCES    = [
  { num: "01", src: path.join(ROOT, "test-case-01.js") },
  { num: "02", src: path.join(ROOT, "test-case-02.js") },
  { num: "03", src: path.join(ROOT, "test-case-03.js") },
];

// ─── helpers ────────────────────────────────────────────────────────────────

// Match step headers like `// ######### 01 Auth ##########`
// or `// ######### Ticket LCC #########`
const HEADER_RE = /^\s*\/\/\s*#{2,}\s*(.+?)\s*#{2,}\s*$/gm;

// Match Request / Response markers. The capture files contain a typo "Reuest"
// in test-case-01.js, so accept both forms.
const REQ_RE = /^\s*\/\/[^\n]*\b(?:Request|Reuest)\b/im;
const RES_RE = /^\s*\/\/[^\n]*\bResponse\b/im;

// Pull the first balanced { ... } substring from text starting at startIdx.
// String-aware (ignores braces inside double-quoted strings, handles escapes).
function extractBalancedJson(text, startIdx) {
  const open = text.indexOf("{", startIdx);
  if (open < 0) return null;

  let depth = 0;
  let inStr = false;
  let esc   = false;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (esc) { esc = false; continue; }
    if (inStr) {
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"')  { inStr = false; }
      continue;
    }
    if (ch === '"')      inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  return null;
}

// camelCase a header into a filesystem-safe slug. Strip leading step numbers
// and parenthetical decorations so e.g. "03 fareRule (OB)" becomes "fareRuleOb".
function camelize(header) {
  return header
    .replace(/^\d+\s*[\-–—:.)]?\s*/, "")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w, i) => (i === 0
      ? w.toLowerCase()
      : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join("") || "step";
}

// Pretty-print JSON. Fall back to the raw text (and warn) if it doesn't parse —
// some capture blocks contain trailing comments or single-quoted prose.
function prettyOrRaw(jsonText, label) {
  const tryParse = (t) => JSON.stringify(JSON.parse(t), null, 2) + "\n";
  try {
    return { text: tryParse(jsonText), ok: true };
  } catch {
    // Capture files often contain JS-style trailing commas (`,` before `}` or `]`).
    // Strip those (string-aware) and try once more before falling back to raw.
    const cleaned = stripTrailingCommas(jsonText);
    try {
      return { text: tryParse(cleaned), ok: true };
    } catch (e2) {
      console.warn(`    [!] ${label}: JSON.parse failed (${e2.message}); saving raw.`);
      return { text: jsonText + "\n", ok: false };
    }
  }
}

// Remove `,` that immediately precedes `}` or `]`, while ignoring commas
// inside double-quoted strings. Cheap fixer for JS-source -> JSON capture text.
function stripTrailingCommas(text) {
  let out   = "";
  let inStr = false;
  let esc   = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (esc) { out += ch; esc = false; continue; }
    if (inStr) {
      if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      out += ch;
      continue;
    }
    if (ch === '"') { inStr = true; out += ch; continue; }
    if (ch === ",") {
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j])) j++;
      if (text[j] === "}" || text[j] === "]") continue; // drop the comma
    }
    out += ch;
  }
  return out;
}

// ─── per-file extraction ────────────────────────────────────────────────────

function extractOne({ num, src }) {
  if (!fs.existsSync(src)) {
    console.warn(`[skip] ${src} not found`);
    return;
  }
  const text = fs.readFileSync(src, "utf8");

  // 1. Find every step header with its start offset.
  const headers = [];
  for (const m of text.matchAll(HEADER_RE)) {
    headers.push({ name: m[1].trim(), start: m.index, end: m.index + m[0].length });
  }
  if (!headers.length) {
    console.warn(`[skip] ${src}: no step headers found`);
    return;
  }

  const outDir = path.join(OUT_BASE, `case-${num}`);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`\nCase ${num} → ${path.relative(ROOT, outDir)}`);
  const usedSlugs = new Map(); // dedupe identical slug occurrences (rare but possible)
  let writtenCount = 0;

  for (let i = 0; i < headers.length; i++) {
    const h          = headers[i];
    const sliceEnd   = i + 1 < headers.length ? headers[i + 1].start : text.length;
    const stepBody   = text.slice(h.end, sliceEnd);
    const stepOffset = h.end;

    let slug = camelize(h.name);

    // Disambiguate duplicate slugs (test-case-03 has FareRule OB+IB; the OB/IB
    // marker should already have made the slugs differ, but guard anyway).
    const seen = usedSlugs.get(slug) || 0;
    if (seen > 0) slug = `${slug}${seen + 1}`;
    usedSlugs.set(camelize(h.name), seen + 1);

    // Locate Request marker, then Response marker, both relative to stepBody.
    const reqM = stepBody.match(REQ_RE);
    const resM = stepBody.match(RES_RE);

    // Save helper — first tries balanced JSON; falls back to raw partial if the
    // capture is truncated (some response samples in the source files have
    // unbalanced braces).
    const saveBlock = (kind, window) => {
      const json = extractBalancedJson(window, 0);
      if (json) {
        const out  = path.join(outDir, `${slug}${kind}.json`);
        const body = prettyOrRaw(json, `${slug} ${kind.toLowerCase()}`);
        fs.writeFileSync(out, body.text);
        console.log(`  ✓ ${path.basename(out)}${body.ok ? "" : "  (raw)"}`);
        writtenCount++;
        return true;
      }
      // Fallback: save raw window from first `{` onward, if any.
      const openIdx = window.indexOf("{");
      if (openIdx >= 0) {
        const out = path.join(outDir, `${slug}${kind}.partial.json`);
        fs.writeFileSync(out, window.slice(openIdx).trimEnd() + "\n");
        console.log(`  ⚠ ${path.basename(out)}  (unbalanced — saved raw)`);
        writtenCount++;
        return true;
      }
      return false;
    };

    // Request block: JSON between Request marker (or step header if missing)
    // and the Response marker (or end-of-step).
    const reqWindowStart = reqM ? reqM.index + reqM[0].length : 0;
    const reqWindowEnd   = resM ? resM.index : stepBody.length;
    const reqWindow      = stepBody.slice(reqWindowStart, reqWindowEnd);
    const reqSaved       = saveBlock("Request", reqWindow);
    if (!reqSaved && reqM) {
      console.warn(`  [skip] ${slug}: Request marker found but no JSON block`);
    }

    // Response block: JSON after Response marker, anywhere until end of step.
    if (resM) {
      const resMarkerEnd = resM.index + resM[0].length;
      const resWindow    = stepBody.slice(resMarkerEnd);
      const resSaved     = saveBlock("Response", resWindow);
      if (!resSaved) {
        console.warn(`  [skip] ${slug}: Response marker found but no JSON block`);
      }
    }

    if (!reqSaved && !resM) {
      console.log(`  · ${slug}: no JSON found — header skipped`);
    }
  }

  console.log(`  ${writtenCount} file(s) written.`);
}

// ─── main ───────────────────────────────────────────────────────────────────

SOURCES.forEach(extractOne);
console.log("\nDone.");
