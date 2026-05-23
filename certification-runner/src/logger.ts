import * as fs from "fs";
import * as path from "path";

export class CaseLogger {
  private caseDir: string;
  private caseNumber: number;
  private caseName: string;
  private logs: string[] = [];

  constructor(outputDir: string, caseNumber: number, caseName: string) {
    this.caseNumber = caseNumber;
    this.caseName = caseName;
    this.caseDir = path.join(outputDir, `case-${caseNumber}`);
    fs.mkdirSync(this.caseDir, { recursive: true });
  }

  saveJson(filename: string, data: unknown): void {
    const filepath = path.join(this.caseDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf-8");
    this.log(`Saved: ${filename}`);
  }

  saveSummary(summary: CaseSummary): void {
    const lines = [
      `TBO Hotel Certification - Case ${this.caseNumber}`,
      "=".repeat(60),
      `Case Name   : ${summary.caseName}`,
      `Timestamp   : ${summary.timestamp}`,
      `Duration    : ${summary.durationMs}ms`,
      `Success     : ${summary.success ? "YES" : "NO"}`,
      "",
      "Booking Details",
      "-".repeat(40),
      `Hotel Name  : ${summary.hotelName ?? "N/A"}`,
      `Hotel Code  : ${summary.hotelCode ?? "N/A"}`,
      `Booking ID  : ${summary.bookingId ?? "N/A"}`,
      `Confirm No  : ${summary.confirmationNo ?? "N/A"}`,
      `Booking Ref : ${summary.bookingRefNo ?? "N/A"}`,
      `Status      : ${summary.bookingStatus}`,
      `Voucher     : ${summary.voucherStatus ? "Generated" : "Pending"}`,
      "",
      "Validation Results",
      "-".repeat(40),
      `Room Count  : ${summary.validations.roomCount}`,
      `Adult Count : ${summary.validations.adultCount}`,
      `Child Count : ${summary.validations.childCount}`,
      `Child Ages  : ${summary.validations.childAges.join(", ") || "None"}`,
      "",
    ];

    if (!summary.success && summary.error) {
      lines.push("Error", "-".repeat(40), summary.error, "");
    }

    lines.push(
      "Log Entries",
      "-".repeat(40),
      ...this.logs.map((l, i) => `[${i + 1}] ${l}`),
      "",
      `Files saved to: ${this.caseDir}`
    );

    fs.writeFileSync(
      path.join(this.caseDir, "summary.txt"),
      lines.join("\n"),
      "utf-8"
    );
  }

  log(message: string): void {
    const entry = `[${new Date().toISOString()}] ${message}`;
    this.logs.push(entry);
    console.log(`  [Case ${this.caseNumber}] ${message}`);
  }

  error(message: string, err?: unknown): void {
    const detail =
      err instanceof Error ? err.message : err ? String(err) : "";
    const entry = `ERROR: ${message}${detail ? ` — ${detail}` : ""}`;
    this.logs.push(`[${new Date().toISOString()}] ${entry}`);
    console.error(`  [Case ${this.caseNumber}] ${entry}`);
  }

  get dir(): string {
    return this.caseDir;
  }
}

export interface CaseSummary {
  caseName: string;
  timestamp: string;
  durationMs: number;
  success: boolean;
  hotelName: string | null;
  hotelCode: string | null;
  bookingId: number | null;
  confirmationNo: string | null;
  bookingRefNo: string | null;
  bookingStatus: string;
  voucherStatus: boolean;
  error?: string;
  validations: {
    roomCount: number;
    adultCount: number;
    childCount: number;
    childAges: number[];
  };
}

export function createMasterSummary(
  outputDir: string,
  results: Array<{
    caseNumber: number;
    caseName: string;
    success: boolean;
    bookingId: number | null;
    confirmationNo: string | null;
    duration: number;
    error?: string;
  }>
): void {
  const lines = [
    "TBO Hotel API Certification — Master Summary",
    "=".repeat(60),
    `Generated: ${new Date().toISOString()}`,
    "",
    `Total Cases : ${results.length}`,
    `Passed      : ${results.filter((r) => r.success).length}`,
    `Failed      : ${results.filter((r) => !r.success).length}`,
    "",
    "Case Results",
    "-".repeat(60),
  ];

  for (const r of results) {
    const status = r.success ? "PASS" : "FAIL";
    const booking = r.confirmationNo ? `Conf: ${r.confirmationNo}` : r.error ?? "No confirmation";
    lines.push(
      `[${status}] Case ${r.caseNumber}: ${r.caseName}`,
      `       BookingId: ${r.bookingId ?? "N/A"} | ${booking}`,
      `       Duration: ${r.duration}ms`,
      ""
    );
  }

  fs.writeFileSync(
    path.join(outputDir, "master-summary.txt"),
    lines.join("\n"),
    "utf-8"
  );

  console.log("\n" + lines.join("\n"));
}
