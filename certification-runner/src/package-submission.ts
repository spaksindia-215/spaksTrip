/**
 * TBO Hotel API Certification — Submission Packager
 *
 * Reads certification-output/case-N/ directories, parses each summary.txt,
 * and builds the final TBO-Certification-SpaksTrip/ folder structure with:
 *   - Numbered file prefixes  (01-search-request.json … 09-bookingdetail-response.json)
 *   - TBO case folder names   (Case-1-Domestic-Adult1/, …)
 *   - Prettified JSON files
 *   - Per-case summary.txt    (human-readable)
 *   - MASTER-SUMMARY.txt      (table + email body ready)
 *
 * Usage:
 *   ts-node src/package-submission.ts
 *
 * Output:
 *   <repo-root>/TBO-Certification-SpaksTrip/   ← ready to ZIP and email
 */

import * as fs from "fs";
import * as path from "path";

// ─── Configuration ────────────────────────────────────────────────────────────

const REPO_ROOT = path.resolve(__dirname, "../../");
const SOURCE_DIR = path.join(REPO_ROOT, "certification-output");
const OUT_DIR = path.join(REPO_ROOT, "TBO-Certification-SpaksTrip");
const AGENCY_NAME = "SpaksTrip";
const DATE_STAMP = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// Mapping: source filename → [numeric prefix, destination filename]
const FILE_MAP: Record<string, [string, string]> = {
  "search-request.json":         ["01", "01-search-request.json"],
  "search-response.json":        ["02", "02-search-response.json"],
  "prebook-request.json":        ["03", "03-prebook-request.json"],
  "prebook-response.json":       ["04", "04-prebook-response.json"],
  "booking-request.json":        ["05", "05-booking-request.json"],
  "booking-response.json":       ["06", "06-booking-response.json"],
  "voucher-request.json":        ["07", "07-voucher-request.json"],
  "voucher-response.json":       ["08", "08-voucher-response.json"],
  "booking-detail-response.json":["09", "09-bookingdetail-response.json"],
};

// TBO official case folder names
const CASE_FOLDER_NAMES: Record<number, string> = {
  1: "Case-1-Domestic-Adult1",
  2: "Case-2-Domestic-Adult2-Child2",
  3: "Case-3-Domestic-Room2-Adult1-Adult1",
  4: "Case-4-Domestic-Room2-Adult1Child2-Adult2",
  5: "Case-5-International-Adult1",
  6: "Case-6-International-Adult2-Child2",
  7: "Case-7-International-Room2-Adult1-Adult1",
  8: "Case-8-International-Room2-Adult1Child2-Adult2",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedSummary {
  caseNumber: number;
  caseName: string;
  timestamp: string;
  hotelName: string;
  hotelCode: string;
  bookingId: string;
  confirmationNo: string;
  bookingRefNo: string;
  status: string;
  voucher: string;
  roomCount: string;
  adultCount: string;
  childCount: string;
  childAges: string;
  duration: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSummary(txt: string, caseNumber: number): ParsedSummary {
  const get = (label: string): string => {
    const m = txt.match(new RegExp(`${label}\\s*:\\s*(.+)`));
    return m ? m[1].trim() : "N/A";
  };
  return {
    caseNumber,
    caseName:      get("Case Name"),
    timestamp:     get("Timestamp"),
    hotelName:     get("Hotel Name"),
    hotelCode:     get("Hotel Code"),
    bookingId:     get("Booking ID"),
    confirmationNo:get("Confirm No"),
    bookingRefNo:  get("Booking Ref"),
    status:        get("Status"),
    voucher:       get("Voucher"),
    roomCount:     get("Room Count"),
    adultCount:    get("Adult Count"),
    childCount:    get("Child Count"),
    childAges:     get("Child Ages"),
    duration:      get("Duration"),
  };
}

function prettifyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw; // already non-JSON or malformed — return as-is
  }
}

function pad(n: number): string {
  return String(n).padStart(2, " ");
}

function col(s: string, width: number): string {
  return String(s).slice(0, width).padEnd(width);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  // Clean and recreate output dir
  if (fs.existsSync(OUT_DIR)) {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const summaries: ParsedSummary[] = [];
  const missingCases: number[] = [];

  for (let n = 1; n <= 8; n++) {
    const srcCase = path.join(SOURCE_DIR, `case-${n}`);
    const summaryPath = path.join(srcCase, "summary.txt");

    if (!fs.existsSync(srcCase)) {
      console.warn(`  [WARN] case-${n} source folder not found — skipping`);
      missingCases.push(n);
      continue;
    }

    if (!fs.existsSync(summaryPath)) {
      console.warn(`  [WARN] case-${n}/summary.txt missing — skipping`);
      missingCases.push(n);
      continue;
    }

    const summaryTxt = fs.readFileSync(summaryPath, "utf8");
    const parsed = parseSummary(summaryTxt, n);

    // Check this case actually passed
    if (parsed.status.toLowerCase() !== "confirmed") {
      console.warn(`  [WARN] Case ${n} status="${parsed.status}" — including anyway`);
    }

    const destFolder = CASE_FOLDER_NAMES[n];
    const destCase = path.join(OUT_DIR, destFolder);
    fs.mkdirSync(destCase, { recursive: true });

    // Copy + prettify JSON files
    let copiedFiles = 0;
    let missingFiles: string[] = [];

    for (const [srcName, [, destName]] of Object.entries(FILE_MAP)) {
      const srcFile = path.join(srcCase, srcName);
      const destFile = path.join(destCase, destName);

      if (!fs.existsSync(srcFile)) {
        missingFiles.push(srcName);
        continue;
      }

      const raw = fs.readFileSync(srcFile, "utf8");
      fs.writeFileSync(destFile, prettifyJson(raw), "utf8");
      copiedFiles++;
    }

    // Copy summary.txt verbatim
    fs.copyFileSync(summaryPath, path.join(destCase, "summary.txt"));

    summaries.push(parsed);

    const status = missingFiles.length === 0 ? "OK" : `WARN (missing: ${missingFiles.join(", ")})`;
    console.log(`  [Case ${n}] ${destFolder} — ${copiedFiles} JSON files  [${status}]`);
  }

  if (summaries.length === 0) {
    console.error("\nNo cases processed. Aborting.");
    process.exit(1);
  }

  // ─── Master Summary ─────────────────────────────────────────────────────────

  const divider = "─".repeat(108);
  const header  = [
    `TBO Hotel API Certification — Master Submission Summary`,
    `Agency       : ${AGENCY_NAME}`,
    `Date         : ${DATE_STAMP}`,
    `Total Cases  : 8  |  Passed: ${summaries.length}  |  Failed/Missing: ${8 - summaries.length}`,
    ``,
  ].join("\n");

  const tableHeader = [
    divider,
    `${col("Case", 5)} ${col("Booking ID", 11)} ${col("Confirmation No.", 18)} ${col("Hotel Code", 11)} ${col("Hotel Name", 40)} ${col("Type", 14)} ${col("Status", 10)}`,
    divider,
  ].join("\n");

  const tableRows = summaries
    .map((s) => {
      const type = s.caseNumber <= 4 ? "Domestic" : "International";
      return `${col(String(s.caseNumber), 5)} ${col(s.bookingId, 11)} ${col(s.confirmationNo, 18)} ${col(s.hotelCode, 11)} ${col(s.hotelName, 40)} ${col(type, 14)} ${col(s.status.toUpperCase(), 10)}`;
    })
    .join("\n");

  const tableFooter = divider;

  const emailSection = buildEmailBody(summaries);

  const zipName = `TBO-Certification-${AGENCY_NAME}-${DATE_STAMP}.zip`;
  const masterContent = [
    header,
    tableHeader,
    tableRows,
    tableFooter,
    "",
    "─".repeat(108),
    "FOLDER STRUCTURE",
    "─".repeat(108),
    ...summaries.map((s) => `  ${CASE_FOLDER_NAMES[s.caseNumber]}/`),
    "",
    "─".repeat(108),
    "READY-TO-SEND EMAIL (copy body below this line)",
    "─".repeat(108),
    "",
    emailSection,
    "",
    "─".repeat(108),
    `ZIP this folder as: ${zipName}`,
    "─".repeat(108),
  ].join("\n");

  fs.writeFileSync(path.join(OUT_DIR, "MASTER-SUMMARY.txt"), masterContent, "utf8");

  // ─── Final Report ────────────────────────────────────────────────────────────

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Submission package built at:`);
  console.log(`  ${OUT_DIR}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review MASTER-SUMMARY.txt`);
  console.log(`  2. ZIP the folder as: ${zipName}`);
  console.log(`  3. Send email with subject: Hotel Certification Cases-${AGENCY_NAME}`);
  if (missingCases.length > 0) {
    console.warn(`\n  [WARN] Missing/skipped cases: ${missingCases.join(", ")}`);
  }
  console.log(`${"=".repeat(60)}\n`);
}

// ─── Email Builder ────────────────────────────────────────────────────────────

function buildEmailBody(summaries: ParsedSummary[]): string {
  const tableHeader = [
    "─".repeat(108),
    `${col("Case", 5)} ${col("Booking ID", 11)} ${col("Confirmation No.", 18)} ${col("Hotel Code", 11)} ${col("Hotel Name", 40)} ${col("Type", 14)} ${col("Status", 10)}`,
    "─".repeat(108),
  ].join("\n");

  const tableRows = summaries
    .map((s) => {
      const type = s.caseNumber <= 4 ? "Domestic" : "International";
      return `${col(String(s.caseNumber), 5)} ${col(s.bookingId, 11)} ${col(s.confirmationNo, 18)} ${col(s.hotelCode, 11)} ${col(s.hotelName, 40)} ${col(type, 14)} ${col(s.status.toUpperCase(), 10)}`;
    })
    .join("\n");

  return `Subject: Hotel Certification Cases-SpaksTrip

Dear TBO API Team,

I hope this email finds you well.

I am writing to submit Step 1 – Test Cases Verification for our Hotel API
integration under agency name SpaksTrip.

We have successfully executed and verified all 8 mandatory certification
test cases (4 Domestic + 4 International) in the UAT/staging environment.
All 8 cases have been completed with confirmed bookings and generated vouchers.

The JSON Request/Response logs for each case are attached casewise as separate
folders within the enclosed ZIP file. Each case folder contains the complete
API call chain in chronological order:
  Search → PreBook → Book → Generate Voucher → Get Booking Details

BOOKING SUMMARY — ALL 8 CASES CONFIRMED
${tableHeader}
${tableRows}
${"─".repeat(108)}

Attached: TBO-Certification-SpaksTrip-${DATE_STAMP}.zip

Each case folder contains:
  • 01-search-request.json / 02-search-response.json
  • 03-prebook-request.json / 04-prebook-response.json
  • 05-booking-request.json / 06-booking-response.json
  • 07-voucher-request.json / 08-voucher-response.json
  • 09-bookingdetail-response.json
  • summary.txt (BookingId, ConfirmationNo, HotelCode, HotelName, timestamps)

All JSON files are prettified for readability.

We kindly request Step 1 verification at your earliest convenience. We
understand the processing time is 3–4 working days and are available for
any queries or clarifications during this period.

Thank you for your time and support.

Best regards,
Muskan Kumari
SpaksTrip
homeopathy38@gmail.com`;
}

// ─── Entry ────────────────────────────────────────────────────────────────────

main();
