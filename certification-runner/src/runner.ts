import * as fs from "fs";
import { CaseConfig } from "./types";
import { config } from "./config";
import { CaseLogger, CaseSummary, createMasterSummary } from "./logger";
import { runBookingFlow } from "./bookingFlow";
import { sleep } from "./tboClient";
import { CERTIFICATION_CASES } from "./cases";

export interface RunOptions {
  cases?: number[]; // specific case numbers to run; omit for all
  stopOnFirstFailure?: boolean;
}

export interface RunReport {
  totalCases: number;
  passed: number;
  failed: number;
  results: Array<{
    caseNumber: number;
    caseName: string;
    success: boolean;
    bookingId: number | null;
    confirmationNo: string | null;
    duration: number;
    error?: string;
  }>;
}

export async function runCertification(options: RunOptions = {}): Promise<RunReport> {
  const outputDir = config.outputDir;
  fs.mkdirSync(outputDir, { recursive: true });

  const casesToRun = options.cases
    ? CERTIFICATION_CASES.filter((c) => options.cases!.includes(c.caseNumber))
    : CERTIFICATION_CASES;

  if (casesToRun.length === 0) {
    throw new Error(
      `No matching cases found. Available: ${CERTIFICATION_CASES.map((c) => c.caseNumber).join(", ")}`
    );
  }

  console.log(
    `\nTBO Hotel API Certification Runner\n${"=".repeat(50)}\nRunning ${casesToRun.length} case(s)...\n`
  );

  const results: RunReport["results"] = [];

  for (const caseConfig of casesToRun) {
    const logger = new CaseLogger(outputDir, caseConfig.caseNumber, caseConfig.name);
    const start = Date.now();

    console.log(`\n${"─".repeat(50)}`);
    console.log(`Starting: ${caseConfig.name}`);
    console.log(`Description: ${caseConfig.description}`);
    console.log(`City: ${caseConfig.cityCode} | Rooms: ${caseConfig.rooms.length}`);
    console.log(`${"─".repeat(50)}`);

    let bookingId: number | null = null;
    let confirmationNo: string | null = null;
    let error: string | undefined;
    let success = false;

    try {
      const result = await runBookingFlow(caseConfig, logger);
      bookingId = result.bookingId;
      confirmationNo = result.confirmationNo;
      success = true;

      const totalAdults = caseConfig.rooms.reduce((sum, r) => sum + r.adults, 0);
      const totalChildren = caseConfig.rooms.reduce((sum, r) => sum + r.children, 0);
      const allChildAges = caseConfig.rooms.flatMap((r) => r.childAges);

      const summary: CaseSummary = {
        caseName: caseConfig.name,
        timestamp: result.timestamp,
        durationMs: Date.now() - start,
        success: true,
        hotelName: result.hotelName,
        hotelCode: result.hotelCode,
        bookingId: result.bookingId,
        confirmationNo: result.confirmationNo,
        bookingRefNo: result.bookingRefNo,
        bookingStatus: result.bookingStatus,
        voucherStatus: result.voucherStatus,
        validations: {
          roomCount: caseConfig.rooms.length,
          adultCount: totalAdults,
          childCount: totalChildren,
          childAges: allChildAges,
        },
      };
      logger.saveSummary(summary);
      logger.log(`CASE ${caseConfig.caseNumber} PASSED`);

    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
      logger.error("Case failed", err);

      // Save error details
      const errorData = {
        caseNumber: caseConfig.caseNumber,
        caseName: caseConfig.name,
        timestamp: new Date().toISOString(),
        error,
        stack: err instanceof Error ? err.stack : undefined,
      };
      logger.saveJson("error.json", errorData);

      const totalAdults = caseConfig.rooms.reduce((sum, r) => sum + r.adults, 0);
      const totalChildren = caseConfig.rooms.reduce((sum, r) => sum + r.children, 0);
      const allChildAges = caseConfig.rooms.flatMap((r) => r.childAges);

      const summary: CaseSummary = {
        caseName: caseConfig.name,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - start,
        success: false,
        hotelName: null,
        hotelCode: null,
        bookingId: null,
        confirmationNo: null,
        bookingRefNo: null,
        bookingStatus: "Failed",
        voucherStatus: false,
        error,
        validations: {
          roomCount: caseConfig.rooms.length,
          adultCount: totalAdults,
          childCount: totalChildren,
          childAges: allChildAges,
        },
      };
      logger.saveSummary(summary);

      if (options.stopOnFirstFailure) {
        console.error(`\nStopping after Case ${caseConfig.caseNumber} failure.`);
        results.push({
          caseNumber: caseConfig.caseNumber,
          caseName: caseConfig.name,
          success: false,
          bookingId: null,
          confirmationNo: null,
          duration: Date.now() - start,
          error,
        });
        break;
      }
    }

    results.push({
      caseNumber: caseConfig.caseNumber,
      caseName: caseConfig.name,
      success,
      bookingId,
      confirmationNo,
      duration: Date.now() - start,
      error,
    });

    // Delay between cases to avoid rate limiting
    if (casesToRun.indexOf(caseConfig) < casesToRun.length - 1) {
      console.log(`\n  Waiting ${config.caseDelay}ms before next case...`);
      await sleep(config.caseDelay);
    }
  }

  // Create master summary
  createMasterSummary(outputDir, results);

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    totalCases: results.length,
    passed,
    failed,
    results,
  };
}
