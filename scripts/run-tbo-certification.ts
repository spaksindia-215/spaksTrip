#!/usr/bin/env node
/**
 * TBO Insurance Certification Test Runner
 *
 * This script runs TBO insurance certification test cases and saves all
 * request/response payloads to the tbo-certification directory.
 *
 * Usage:
 *   npm run tbo:cert               # Run all 5 test cases
 *   npm run tbo:cert -- --case 1   # Run only case 1
 *   npm run tbo:cert -- --case 2   # Run only case 2
 *   npm run tbo:cert -- --all      # Run all cases (explicit)
 *
 * Output:
 *   Files saved to: ./tbo-certification/case-N-*/
 *   - request-search.json
 *   - response-search.json
 *   - request-book.json
 *   - response-book.json
 *   - confirmation.txt
 *   - summary.md
 *
 * Environment Variables (optional):
 *   TBO_CERTIFICATION_DIR  - Base directory for certification results
 *                            (default: ./tbo-certification)
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dynamically import the runner (requires ES module setup)
async function main() {
  // Parse CLI arguments
  const args = process.argv.slice(2);
  let caseNumber: number | null = null;
  let runAll = true;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--case" && args[i + 1]) {
      caseNumber = parseInt(args[i + 1], 10);
      runAll = false;
      i++;
    } else if (args[i] === "--all") {
      runAll = true;
      caseNumber = null;
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
TBO Insurance Certification Test Runner

Usage:
  node run-tbo-certification.ts [options]

Options:
  --case <number>  Run specific case (1-5)
  --all            Run all cases (default)
  --help           Show this help message

Examples:
  node run-tbo-certification.ts --case 1
  node run-tbo-certification.ts --all
  node run-tbo-certification.ts
      `);
      process.exit(0);
    }
  }

  if (caseNumber && (caseNumber < 1 || caseNumber > 5)) {
    console.error("Error: Case number must be between 1 and 5");
    process.exit(1);
  }

  try {
    // Import the runner functions
    const {
      runAllCertificationCases,
      getTestCaseByNumber,
    } = await import("../client/src/lib/adapters/tbo/insurance/testCases.js");
    const { ALL_TEST_CASES } = await import(
      "../client/src/lib/adapters/tbo/insurance/testCases.js"
    );
    const { createCertificationRunner } = await import(
      "../client/src/lib/adapters/tbo/insurance/certificationRunner.js"
    );

    const certDir = process.env.TBO_CERTIFICATION_DIR || "./tbo-certification";

    console.log("\n" + "=".repeat(70));
    console.log("TBO INSURANCE CERTIFICATION TEST RUNNER");
    console.log("=".repeat(70) + "\n");

    let testCases = ALL_TEST_CASES;
    if (caseNumber) {
      const specific = getTestCaseByNumber(caseNumber);
      if (specific) {
        testCases = [specific];
        console.log(`Running Case ${caseNumber}: ${specific.caseName}\n`);
      }
    } else {
      console.log("Running all 5 certification test cases:\n");
      ALL_TEST_CASES.forEach((tc) => {
        console.log(`  [Case ${tc.caseNumber}] ${tc.caseName}`);
      });
      console.log();
    }

    const runner = createCertificationRunner(certDir);
    const startTime = Date.now();

    const results = [];
    for (const testCase of testCases) {
      console.log(
        `\n[${testCase.caseNumber}] Running: ${testCase.caseName}...`,
      );
      try {
        const result = await runner.runTestCase(testCase);
        results.push(result);

        if (result.success) {
          console.log(
            `    ✓ SUCCESS - Confirmation: ${result.confirmationNumber}`,
          );
          console.log(
            `    Duration: ${result.executionDurationMs}ms`,
          );
          console.log(
            `    Files: ${certDir}/case-${testCase.caseNumber}-*/`,
          );
        } else {
          console.log(
            `    ✗ FAILED - ${result.errorMessage}`,
          );
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : String(error);
        console.log(
          `    ✗ ERROR - ${errorMsg}`,
        );
      }
    }

    const totalTime = Date.now() - startTime;
    const passed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log("\n" + "=".repeat(70));
    console.log("CERTIFICATION RESULTS");
    console.log("=".repeat(70));
    console.log(`Total Cases:  ${results.length}`);
    console.log(`Passed:       ${passed}`);
    console.log(`Failed:       ${failed}`);
    console.log(`Total Time:   ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`Results Dir:  ${certDir}`);
    console.log("=".repeat(70) + "\n");

    // Generate certification report
    const reportPath = path.join(certDir, "certification-report.md");
    const report = generateReport(results, certDir, totalTime);
    fs.mkdirSync(certDir, { recursive: true });
    fs.writeFileSync(reportPath, report);
    console.log(`✓ Report saved to: ${reportPath}\n`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

function generateReport(
  results: any[],
  certDir: string,
  totalTime: number,
): string {
  const timestamp = new Date().toISOString();
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  let report =
    `# TBO Insurance Certification Report\n\n` +
    `**Generated**: ${timestamp}\n\n` +
    `## Summary\n\n` +
    `- **Total Cases**: ${results.length}\n` +
    `- **Passed**: ${passed}\n` +
    `- **Failed**: ${failed}\n` +
    `- **Total Duration**: ${(totalTime / 1000).toFixed(2)}s\n` +
    `- **Results Directory**: ${certDir}\n\n` +
    `## Test Cases\n\n`;

  for (const result of results) {
    report += `### Case ${result.caseNumber}: ${result.caseName}\n\n`;
    report += `- **Status**: ${result.success ? "✓ PASSED" : "✗ FAILED"}\n`;
    report += `- **Trip Type**: ${result.tripType}\n`;
    report += `- **Adults**: ${result.adultCount}\n`;
    report += `- **Duration**: ${result.executionDurationMs}ms\n`;
    report += `- **Timestamp**: ${result.executionTimestamp}\n`;

    if (result.success) {
      report += `- **Confirmation Number**: ${result.confirmationNumber}\n`;
      report += `- **Booking Status**: ${result.bookingStatus}\n`;
    } else if (result.errorMessage) {
      report += `- **Error**: ${result.errorMessage}\n`;
    }

    report += `- **Files**:\n`;
    report += `  - \`request-search.json\`\n`;
    report += `  - \`response-search.json\`\n`;
    report += `  - \`request-book.json\`\n`;
    report += `  - \`response-book.json\`\n`;
    report += `  - \`confirmation.txt\`\n`;
    report += `  - \`summary.md\`\n\n`;
  }

  report += `## File Structure\n\n`;
  report += "```\n";
  report += "tbo-certification/\n";
  report += "├── certification-report.md\n";

  for (const result of results) {
    const caseDir = `case-${result.caseNumber}-${getCaseName(
      result.caseNumber,
    )}`;
    report += `├── ${caseDir}/\n`;
    report += `│   ├── request-search.json\n`;
    report += `│   ├── response-search.json\n`;
    report += `│   ├── request-book.json\n`;
    report += `│   ├── response-book.json\n`;
    report += `│   ├── confirmation.txt\n`;
    report += `│   └── summary.md\n`;
  }

  report += "```\n";

  return report;
}

function getCaseName(caseNumber: number): string {
  const names: Record<number, string> = {
    1: "domestic-1-adult",
    2: "domestic-2-adults",
    3: "non-us-1-adult",
    4: "non-us-2-adults",
    5: "us-canada-2-adults",
  };
  return names[caseNumber] || `case-${caseNumber}`;
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
