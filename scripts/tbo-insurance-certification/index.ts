import * as path from "path";
import * as fs from "fs";

// Load environment variables from .env.local in client directory
const envPath = path.resolve(__dirname, "../../client/.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").trim();
      // Only set if not already set (command line takes precedence)
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

import { CERTIFICATION_CASES, TestCase } from "./cases";
import { CERTIFICATION_CONFIG } from "./config";
import { Logger } from "./logger";
import { TboInsuranceClient } from "./insuranceClient";
import { Validator } from "./validators";
import { SummaryGenerator } from "./summary";
import {
  CertificationResult,
  StepResult,
  CertificationReport,
} from "./types";

class InsuranceCertificationRunner {
  private outputDir: string;
  private logLevel = CERTIFICATION_CONFIG.LOG_LEVEL as
    | "debug"
    | "info"
    | "warn"
    | "error";

  constructor() {
    this.outputDir = path.resolve(CERTIFICATION_CONFIG.OUTPUT_DIR);
  }

  async runAllCases(): Promise<CertificationReport> {
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║     TBO INSURANCE CERTIFICATION RUNNER - Starting...       ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    const reportStartTime = new Date().toISOString();
    const results: CertificationResult[] = [];

    // Filter cases if specific case ID provided
    let casesToRun = CERTIFICATION_CASES;
    const specificCase = process.argv[2];
    if (specificCase) {
      const filtered = CERTIFICATION_CASES.filter((c) => c.id === specificCase);
      if (filtered.length === 0) {
        console.error(
          `✗ Case "${specificCase}" not found. Available cases: ${CERTIFICATION_CASES.map((c) => c.id).join(", ")}`
        );
        process.exit(1);
      }
      casesToRun = filtered;
      console.log(`Running single case: ${specificCase}\n`);
    } else {
      console.log(`Running ${casesToRun.length} certification cases...\n`);
    }

    for (const testCase of casesToRun) {
      console.log(
        `\n──────────────────────────────────────────────────────────────`
      );
      console.log(`Running: ${testCase.name}`);
      console.log(
        `──────────────────────────────────────────────────────────────`
      );

      const result = await this.runCase(testCase);
      results.push(result);

      // Save case-specific summary
      const caseDir = path.join(this.outputDir, testCase.id);
      SummaryGenerator.saveCaseSummaryText(result, caseDir);

      if (result.status === "SUCCESS") {
        console.log(`✓ ${testCase.id}: SUCCESS`);
      } else {
        console.log(`✗ ${testCase.id}: FAILED - ${result.error}`);
      }
    }

    console.log(
      `\n──────────────────────────────────────────────────────────────`
    );
    console.log("All cases completed. Generating report...\n");

    // Generate final report
    const report: CertificationReport = {
      executedAt: reportStartTime,
      totalCases: results.length,
      successfulCases: results.filter((r) => r.status === "SUCCESS").length,
      failedCases: results.filter((r) => r.status === "FAILED").length,
      results,
    };

    // Save report
    SummaryGenerator.saveReport(report, this.outputDir);

    // Print summary
    console.log(SummaryGenerator.generateReportSummary(report));

    return report;
  }

  private async runCase(testCase: TestCase): Promise<CertificationResult> {
    const startTime = new Date().toISOString();
    const logger = new Logger(testCase.id, this.outputDir, this.logLevel);
    const client = new TboInsuranceClient(logger);
    const steps: StepResult[] = [];

    // Validate test case
    if (!Validator.validateTestCase(testCase, logger)) {
      return {
        caseId: testCase.id,
        status: "FAILED",
        startTime,
        endTime: new Date().toISOString(),
        duration: 0,
        error: "Test case validation failed",
        steps,
      };
    }

    try {
      // Step 1: Authentication
      let stepStart = Date.now();
      const authResult = await client.authenticate();
      steps.push({
        name: "Authentication",
        status: authResult.status,
        duration: Date.now() - stepStart,
      });

      if (authResult.status === "FAILED") {
        return this.createFailedResult(
          testCase.id,
          startTime,
          steps,
          "Authentication failed"
        );
      }

      const tokenId = authResult.tokenId;

      // Step 2: Search Plans
      stepStart = Date.now();
      const searchResult = await client.searchPlans(testCase, tokenId);
      steps.push({
        name: "Search Plans",
        status: searchResult.status,
        duration: Date.now() - stepStart,
      });

      if (searchResult.status === "FAILED") {
        return this.createFailedResult(
          testCase.id,
          startTime,
          steps,
          "Search failed"
        );
      }

      const traceId = searchResult.traceId;
      const resultIndex = searchResult.resultIndex;

      // Step 3: Book Insurance
      stepStart = Date.now();
      const bookResult = await client.bookInsurance(
        testCase,
        tokenId,
        traceId,
        resultIndex
      );
      steps.push({
        name: "Book Insurance",
        status: bookResult.status,
        duration: Date.now() - stepStart,
      });

      if (bookResult.status === "FAILED") {
        return this.createFailedResult(
          testCase.id,
          startTime,
          steps,
          "Book failed"
        );
      }

      const bookingId = bookResult.bookingId;
      const confirmationNumber = bookResult.confirmationNumber;

      // Step 4: Generate Policy
      stepStart = Date.now();
      const policyResult = await client.generatePolicy(tokenId, bookingId);
      steps.push({
        name: "Generate Policy",
        status: policyResult.status,
        duration: Date.now() - stepStart,
      });

      if (policyResult.status === "FAILED") {
        return this.createFailedResult(
          testCase.id,
          startTime,
          steps,
          "Generate policy failed"
        );
      }

      // Step 5: Get Booking Details
      stepStart = Date.now();
      const detailsResult = await client.getBookingDetails(tokenId, bookingId);
      steps.push({
        name: "Get Booking Details",
        status: detailsResult.status,
        duration: Date.now() - stepStart,
      });

      if (detailsResult.status === "FAILED") {
        return this.createFailedResult(
          testCase.id,
          startTime,
          steps,
          "Get booking details failed"
        );
      }

      const endTime = new Date().toISOString();

      // All steps successful
      const result: CertificationResult = {
        caseId: testCase.id,
        status: "SUCCESS",
        startTime,
        endTime,
        duration: new Date(endTime).getTime() - new Date(startTime).getTime(),
        authTokenId: tokenId,
        traceId,
        bookingId,
        confirmationNumber,
        steps,
      };

      // Save final summary
      const caseDir = path.join(this.outputDir, testCase.id);
      logger.saveSummary({
        caseId: testCase.id,
        tripType: testCase.tripType,
        policyNumber: "See booking details response",
        bookingId,
        confirmationNumber,
        status: "SUCCESS",
        timestamp: endTime,
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Case execution failed: ${errorMessage}`);

      return this.createFailedResult(
        testCase.id,
        startTime,
        steps,
        errorMessage
      );
    }
  }

  private createFailedResult(
    caseId: string,
    startTime: string,
    steps: StepResult[],
    error: string
  ): CertificationResult {
    const endTime = new Date().toISOString();
    return {
      caseId,
      status: "FAILED",
      startTime,
      endTime,
      duration: new Date(endTime).getTime() - new Date(startTime).getTime(),
      error,
      steps,
    };
  }
}

// Main execution
async function main(): Promise<void> {
  try {
    const runner = new InsuranceCertificationRunner();
    const report = await runner.runAllCases();

    // Exit with appropriate code
    const exitCode = report.failedCases === 0 ? 0 : 1;
    process.exit(exitCode);
  } catch (error) {
    console.error(
      "Fatal error:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main();
