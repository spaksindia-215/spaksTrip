import { NextResponse } from "next/server";
import { runAllCertificationCases } from "@/lib/adapters/tbo/insurance/certificationRunner";
import { ALL_TEST_CASES, getTestCaseByNumber } from "@/lib/adapters/tbo/insurance/testCases";
import type { CertificationResult } from "@/lib/adapters/tbo/insurance/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for all cases

/**
 * POST /api/tbo-insurance/certification
 *
 * Run all or specific TBO Insurance certification test cases.
 *
 * Query parameters:
 *   ?caseNumber=1  - Run specific case (1-5)
 *   ?all=true      - Run all cases (default)
 *
 * Response: Array of CertificationResult objects with request/response payloads
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const caseNumberParam = url.searchParams.get("caseNumber");
    const runAll = url.searchParams.get("all") !== "false";

    let testCases = ALL_TEST_CASES;

    // If specific case is requested, filter to just that case
    if (caseNumberParam) {
      const caseNumber = parseInt(caseNumberParam, 10);
      if (isNaN(caseNumber) || caseNumber < 1 || caseNumber > 5) {
        return NextResponse.json(
          {
            error: "Invalid case number. Must be 1-5.",
            availableCases: [1, 2, 3, 4, 5],
          },
          { status: 400 },
        );
      }
      const specificCase = getTestCaseByNumber(caseNumber);
      if (!specificCase) {
        return NextResponse.json(
          { error: `Test case ${caseNumber} not found.` },
          { status: 404 },
        );
      }
      testCases = [specificCase];
    }

    console.log(
      `[TBO Certification] Starting ${testCases.length} test case(s)`,
    );

    const certificationDir = process.env.TBO_CERTIFICATION_DIR || "./tbo-certification";
    const results = await runAllCertificationCases(testCases, certificationDir);

    const passCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      summary: {
        totalCases: results.length,
        passed: passCount,
        failed: failCount,
        timestamp: new Date().toISOString(),
      },
      results,
      filesLocation: certificationDir,
    });
  } catch (error) {
    console.error("[TBO Certification] Error:", error);
    return NextResponse.json(
      {
        error: "Certification test execution failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/tbo-insurance/certification
 *
 * Get information about available certification test cases.
 */
export async function GET() {
  return NextResponse.json({
    availableCases: ALL_TEST_CASES.map((tc) => ({
      number: tc.caseNumber,
      name: tc.caseName,
      type: tc.tripType,
      adults: tc.adultCount,
      origin: tc.origin,
      destination: tc.destination,
    })),
    usage: {
      runAll: "POST /api/tbo-insurance/certification",
      runSpecific: "POST /api/tbo-insurance/certification?caseNumber=1",
    },
  });
}
