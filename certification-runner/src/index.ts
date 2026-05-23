#!/usr/bin/env node
import { runCertification } from "./runner";

/**
 * TBO Hotel API Certification Runner
 *
 * Usage:
 *   ts-node src/index.ts               -- run all 8 cases
 *   ts-node src/index.ts --all         -- run all 8 cases
 *   ts-node src/index.ts --case 1      -- run only case 1
 *   ts-node src/index.ts --case 1,3,5  -- run cases 1, 3, and 5
 *   ts-node src/index.ts --stop        -- stop on first failure
 */

function parseArgs(): { cases?: number[]; stopOnFirstFailure: boolean } {
  const args = process.argv.slice(2);
  const result: { cases?: number[]; stopOnFirstFailure: boolean } = {
    stopOnFirstFailure: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--stop") {
      result.stopOnFirstFailure = true;
    } else if (arg === "--all") {
      // explicit all — leave cases undefined
    } else if (arg === "--case" && args[i + 1]) {
      // --case 1,2,3  (space-separated value)
      result.cases = args[i + 1]
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
      i++;
    } else if (arg.startsWith("--case")) {
      // --case1  or  --case1,2,3  (no space)
      const raw = arg.replace(/^--case/, "");
      if (raw) {
        result.cases = raw
          .split(",")
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n));
      }
    }
  }

  return result;
}

async function main(): Promise<void> {
  const opts = parseArgs();

  const label = opts.cases
    ? `Cases: ${opts.cases.join(", ")}`
    : "All Cases (1–8)";
  console.log(`\nTBO Hotel API Certification Runner`);
  console.log(`Running: ${label}`);
  console.log(`Stop on failure: ${opts.stopOnFirstFailure}`);

  try {
    const report = await runCertification(opts);

    console.log(`\n${"=".repeat(50)}`);
    console.log(`Certification Complete`);
    console.log(`${"=".repeat(50)}`);
    console.log(`Total : ${report.totalCases}`);
    console.log(`Passed: ${report.passed}`);
    console.log(`Failed: ${report.failed}`);

    process.exit(report.failed > 0 ? 1 : 0);
  } catch (err) {
    console.error(
      "\nFatal error:",
      err instanceof Error ? err.message : String(err)
    );
    process.exit(2);
  }
}

main();
