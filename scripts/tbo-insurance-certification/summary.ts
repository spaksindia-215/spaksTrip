import * as fs from "fs";
import * as path from "path";
import { CertificationResult, CertificationReport } from "./types";

export class SummaryGenerator {
  static generateCaseSummary(result: CertificationResult): string {
    const lines = [
      "═══════════════════════════════════════════════════════════════",
      `CERTIFICATION CASE SUMMARY - ${result.caseId.toUpperCase()}`,
      "═══════════════════════════════════════════════════════════════",
      "",
      `Status:                 ${result.status}`,
      `Start Time:             ${result.startTime}`,
      `End Time:               ${result.endTime}`,
      `Duration:               ${result.duration}ms (${(result.duration / 1000).toFixed(2)}s)`,
      "",
      "── IDENTIFIERS ───────────────────────────────────────────────",
      `Auth Token:             ${result.authTokenId ? result.authTokenId.substring(0, 20) + "..." : "N/A"}`,
      `Trace ID:               ${result.traceId || "N/A"}`,
      `Booking ID:             ${result.bookingId || "N/A"}`,
      `Policy Number:          ${result.policyNumber || "N/A"}`,
      `Confirmation Number:    ${result.confirmationNumber || "N/A"}`,
      "",
      "── STEP-BY-STEP RESULTS ───────────────────────────────────────",
    ];

    for (const step of result.steps) {
      const statusIcon = step.status === "SUCCESS" ? "✓" : "✗";
      const httpStatus = step.httpStatus ? ` (HTTP ${step.httpStatus})` : "";
      const error = step.error ? ` - ${step.error}` : "";
      const duration = ` [${step.duration}ms]`;
      lines.push(
        `${statusIcon} ${step.name.padEnd(25)} ${statusIcon === "✓" ? "PASS" : "FAIL"}${httpStatus}${duration}${error}`
      );
    }

    lines.push("");
    lines.push(
      "═══════════════════════════════════════════════════════════════"
    );

    if (result.error) {
      lines.push("");
      lines.push("── ERROR DETAILS ──────────────────────────────────────────────");
      lines.push(result.error);
      lines.push("");
      lines.push(
        "═══════════════════════════════════════════════════════════════"
      );
    }

    return lines.join("\n");
  }

  static generateReportSummary(report: CertificationReport): string {
    const successRate = report.totalCases > 0
      ? ((report.successfulCases / report.totalCases) * 100).toFixed(2)
      : "0.00";

    const lines = [
      "╔═════════════════════════════════════════════════════════════╗",
      "║          TBO INSURANCE CERTIFICATION REPORT                 ║",
      "╚═════════════════════════════════════════════════════════════╝",
      "",
      `Executed At:            ${report.executedAt}`,
      "",
      "── OVERALL STATISTICS ─────────────────────────────────────────",
      `Total Cases:            ${report.totalCases}`,
      `Successful Cases:       ${report.successfulCases}`,
      `Failed Cases:           ${report.failedCases}`,
      `Success Rate:           ${successRate}%`,
      "",
      "── CASE RESULTS ───────────────────────────────────────────────",
    ];

    for (const result of report.results) {
      const statusIcon = result.status === "SUCCESS" ? "✓" : "✗";
      const duration = (result.duration / 1000).toFixed(2);
      lines.push(
        `${statusIcon} ${result.caseId.padEnd(15)} ${result.status.padEnd(10)} ${duration}s`
      );
    }

    lines.push("");
    lines.push("╔═════════════════════════════════════════════════════════════╗");

    if (report.successfulCases === report.totalCases) {
      lines.push("║         ✓ ALL TEST CASES PASSED - READY FOR SUBMISSION      ║");
    } else {
      lines.push(
        "║         ✗ SOME TEST CASES FAILED - REVIEW BEFORE SUBMISSION   ║"
      );
    }

    lines.push("╚═════════════════════════════════════════════════════════════╝");
    lines.push("");
    lines.push("Instructions for TBO Submission:");
    lines.push("1. Navigate to /certification-output/");
    lines.push("2. Each case has a dedicated folder (case-1, case-2, etc.)");
    lines.push("3. Each folder contains:");
    lines.push("   - auth-request.json / auth-response.json");
    lines.push("   - search-request.json / search-response.json");
    lines.push("   - book-request.json / book-response.json");
    lines.push("   - policy-request.json / policy-response.json");
    lines.push("   - booking-details-request.json / booking-details-response.json");
    lines.push("   - summary.json and summary.txt");
    lines.push("4. Submit each case folder separately to TBO API team");
    lines.push("");

    return lines.join("\n");
  }

  static saveReport(report: CertificationReport, outputDir: string): string {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const reportFile = path.join(outputDir, "certification-report.json");
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), "utf-8");

    const summaryFile = path.join(
      outputDir,
      "certification-summary.txt"
    );
    const summary = this.generateReportSummary(report);
    fs.writeFileSync(summaryFile, summary, "utf-8");

    return reportFile;
  }

  static saveCaseSummaryText(result: CertificationResult, caseDir: string): void {
    const summary = this.generateCaseSummary(result);
    const summaryFile = path.join(caseDir, "case-summary.txt");
    fs.writeFileSync(summaryFile, summary, "utf-8");
  }
}
