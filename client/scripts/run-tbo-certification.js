#!/usr/bin/env node
/**
 * TBO Insurance Certification Test Runner
 *
 * This script runs certification tests via the Next.js API endpoint
 */

async function main() {
  try {
    const args = process.argv.slice(2);
    let caseNumber = null;

    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--case" && args[i + 1]) {
        caseNumber = parseInt(args[i + 1], 10);
        i++;
      } else if (args[i] === "--help" || args[i] === "-h") {
        console.log(`
TBO Insurance Certification Test Runner

Usage:
  npm run tbo:cert [options]

Options:
  --case <number>  Run specific case (1-5)
  --help           Show this help message

Examples:
  npm run tbo:cert -- --case 1
  npm run tbo:cert

Note: Requires the Next.js dev server running on http://localhost:3000
Start it with: npm run dev
        `);
        process.exit(0);
      }
    }

    if (caseNumber && (caseNumber < 1 || caseNumber > 5)) {
      console.error("Error: Case number must be between 1 and 5");
      process.exit(1);
    }

    console.log("\n" + "=".repeat(70));
    console.log("TBO INSURANCE CERTIFICATION TEST RUNNER");
    console.log("=".repeat(70) + "\n");

    // Check if Next.js server is running
    const isServerRunning = await checkServerHealth();
    if (!isServerRunning) {
      console.error("\n❌ ERROR: Next.js client server is not running!");
      console.error("\nTo start the Next.js server, run in a NEW terminal:");
      console.error("  cd /home/muskan/spaksTrip/client");
      console.error("  npm run dev");
      console.error("\nNote: The backend server on port 4000 is separate.");
      console.error("You need the Next.js client on port 3000 for the API endpoint.\n");
      process.exit(1);
    }

    console.log("✓ Server is running\n");

    if (caseNumber) {
      console.log(`Running Case ${caseNumber}...\n`);
    } else {
      console.log("Running all 5 certification test cases:\n");
      console.log("  [Case 1] Domestic Trip - 1 Adult");
      console.log("  [Case 2] Domestic Trip - 2 Adults");
      console.log("  [Case 3] Non-US Trip - 1 Adult");
      console.log("  [Case 4] Non-US Trip - 2 Adults");
      console.log("  [Case 5] US/Canada Trip - 2 Adults\n");
    }

    const url = caseNumber
      ? `http://localhost:3000/api/tbo-insurance/certification?caseNumber=${caseNumber}`
      : "http://localhost:3000/api/tbo-insurance/certification";

    console.log(`Calling API: POST ${url}\n`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ API Error:");
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    // Display results
    console.log("=".repeat(70));
    console.log("CERTIFICATION RESULTS");
    console.log("=".repeat(70));
    console.log(`Total Cases:  ${data.summary.totalCases}`);
    console.log(`Passed:       ${data.summary.passed}`);
    console.log(`Failed:       ${data.summary.failed}`);
    console.log(`Results Dir:  ${data.filesLocation}`);
    console.log("=".repeat(70) + "\n");

    // Show individual results
    if (data.results && data.results.length > 0) {
      console.log("Individual Results:\n");
      data.results.forEach((result) => {
        const status = result.success ? "✓ PASSED" : "✗ FAILED";
        console.log(`[Case ${result.caseNumber}] ${result.caseName}`);
        console.log(`  Status: ${status}`);
        if (result.success) {
          console.log(`  Confirmation: ${result.confirmationNumber}`);
          console.log(`  Duration: ${result.executionDurationMs}ms`);
        } else if (result.errorMessage) {
          console.log(`  Error: ${result.errorMessage}`);
        }
        console.log();
      });
    }

    if (data.summary.passed > 0) {
      console.log("✓ Check detailed results at:");
      console.log(`  ${data.filesLocation}/certification-report.md\n`);
    }

    process.exit(data.summary.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("Fatal error:", error.message);
    process.exit(1);
  }
}

async function checkServerHealth() {
  try {
    const response = await fetch("http://localhost:3000/api/tbo-insurance/certification", {
      method: "GET",
      timeout: 5000,
    });
    return response.ok || response.status === 405; // GET returns 405 but server is up
  } catch {
    return false;
  }
}

main();
