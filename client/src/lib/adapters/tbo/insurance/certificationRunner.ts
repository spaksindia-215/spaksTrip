import "server-only";
import path from "path";
import fs from "fs";
import { getTboToken } from "../auth";
import { logRequest, logResponse, logError } from "../log";
import type {
  CertificationTestCase,
  CertificationResult,
  InsuranceSearchRequest,
  InsuranceSearchResponse,
  InsuranceBookRequest,
  InsuranceBookResponse,
  TravellerDetail,
  TboInsuranceSearchPlanCategory,
  TboInsurancePlanType,
  TboInsurancePlanCoverage,
} from "./types";

const INSURANCE_SEARCH_URL =
  process.env.TBO_INSURANCE_SEARCH_URL ||
  "https://InsuranceBE.tektravels.com/InsuranceService.svc/rest/Search";

const INSURANCE_BOOK_URL =
  process.env.TBO_INSURANCE_BOOK_URL ||
  "https://InsuranceBE.tektravels.com/InsuranceService.svc/rest/Book";

interface SavedExchange {
  timestamp: string;
  request: unknown;
  response: unknown;
  httpStatus: number;
}

class CertificationRunner {
  private resultsDir: string;

  constructor(baseDir: string = "./tbo-certification") {
    this.resultsDir = baseDir;
  }

  private getCaseDirPath(caseNumber: number): string {
    return path.join(this.resultsDir, `case-${caseNumber}-${this.getCaseName(caseNumber)}`);
  }

  private getCaseName(caseNumber: number): string {
    const names: Record<number, string> = {
      1: "domestic-1-adult",
      2: "domestic-2-adults",
      3: "non-us-1-adult",
      4: "non-us-2-adults",
      5: "us-canada-2-adults",
    };
    return names[caseNumber] || `case-${caseNumber}`;
  }

  private ensureCaseDir(caseNumber: number): void {
    const dir = this.getCaseDirPath(caseNumber);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private saveJson(caseNumber: number, filename: string, data: unknown): void {
    this.ensureCaseDir(caseNumber);
    const dir = this.getCaseDirPath(caseNumber);
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + "\n", "utf-8");
    logResponse(`CertificationRunner`, 200, { saved: filepath });
  }

  private saveTxt(caseNumber: number, filename: string, content: string): void {
    this.ensureCaseDir(caseNumber);
    const dir = this.getCaseDirPath(caseNumber);
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, content, "utf-8");
  }

  async runSearchStep(
    caseNumber: number,
    testCase: CertificationTestCase,
    token: string,
  ): Promise<{ request: InsuranceSearchRequest; response: InsuranceSearchResponse }> {
    const startDate = new Date(testCase.startDate);
    const pad = (n: number) => String(n).padStart(2, "0");
    const tboDate = `${startDate.getFullYear()}-${pad(
      startDate.getMonth() + 1,
    )}-${pad(startDate.getDate())}T00:00:00`;

    const request: InsuranceSearchRequest = {
      PlanCategory: testCase.planCategory as TboInsuranceSearchPlanCategory,
      PlanType: testCase.planType as TboInsurancePlanType,
      PlanCoverage: testCase.planCoverage as TboInsurancePlanCoverage,
      TravelStartDate: tboDate,
      NoOfPax: testCase.adultCount,
      PaxAge: testCase.travellers.map(() => {
        // Extract age from test case
        return 35; // Will be overridden per traveller below
      }),
      EndUserIp: process.env.TBO_INSURANCE_SERVER_IP || "1.1.1.1",
      TokenId: token,
    };

    // Set proper ages for each traveller
    request.PaxAge = testCase.travellers.map((t) => {
      const dob = new Date(t.DateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      if (
        today.getMonth() < dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
      ) {
        age--;
      }
      return age;
    });

    logRequest("InsuranceSearch", INSURANCE_SEARCH_URL, {
      ...request,
      TokenId: "[REDACTED]",
    });

    this.saveJson(caseNumber, "request-search.json", request);

    let response: InsuranceSearchResponse;
    let httpStatus: number;

    try {
      const res = await fetch(INSURANCE_SEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "gzip",
        },
        body: JSON.stringify(request),
        cache: "no-store",
      });

      httpStatus = res.status;
      const text = await res.text();

      try {
        response = JSON.parse(text);
      } catch {
        response = { Response: { ResponseStatus: 0, Error: { ErrorCode: 0, ErrorMessage: text }, TraceId: "", Results: [] } };
      }

      logResponse("InsuranceSearch", httpStatus, response);
      this.saveJson(caseNumber, "response-search.json", response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logError("InsuranceSearch", err);
      throw new Error(`Insurance search failed: ${errorMessage}`);
    }

    return { request, response };
  }

  async runBookStep(
    caseNumber: number,
    testCase: CertificationTestCase,
    searchResult: InsuranceSearchResponse,
    token: string,
  ): Promise<{ request: InsuranceBookRequest; response: InsuranceBookResponse }> {
    // Get first plan from search results
    const plans = searchResult.Response?.Results;
    if (!plans || plans.length === 0) {
      throw new Error("No insurance plans found in search results");
    }

    const selectedPlan = plans[0];

    // Convert travellers to Passenger format (ResultIndex from search result)
    const passengers = testCase.travellers.map((t) => ({
      Title: t.Title || "Mr",
      FirstName: t.FirstName,
      LastName: t.LastName,
      BeneficiaryName: t.BeneficiaryName || t.FirstName + " " + t.LastName,
      RelationShipToInsured: t.RelationShipToInsured || "Self",
      RelationToBeneficiary: t.RelationToBeneficiary || "Self",
      Gender: t.Gender || "1",
      Sex: parseInt(t.Gender || "1") as 1 | 2,
      DOB: t.DateOfBirth + "T00:00:00", // Convert to ISO format
      PassportNo: t.Passport || "",
      PhoneNumber: t.PhoneNumber,
      EmailId: t.Email,
      AddressLine1: t.AddressLine1 || "Address Line 1",
      AddressLine2: t.AddressLine2 || "Address Line 2",
      CityCode: t.CityCode || "DEL",
      CountryCode: t.CountryCode || "IN",
      PassportCountry: t.Nationality || "IN",
      MajorDestination: testCase.destination,
      PinCode: parseInt(t.PinCode || "110001"),
    }));

    const request: InsuranceBookRequest = {
      TokenId: token,
      EndUserIp: process.env.TBO_INSURANCE_SERVER_IP || "1.1.1.1",
      TraceId: searchResult.Response?.TraceId || "",
      GenerateInsurancePolicy: "true",
      ResultIndex: selectedPlan.ResultIndex,
      Passenger: passengers as any,
    };

    logRequest("InsuranceBook", INSURANCE_BOOK_URL, {
      ...request,
      TokenId: "[REDACTED]",
    });

    this.saveJson(caseNumber, "request-book.json", request);

    let response: InsuranceBookResponse;
    let httpStatus: number;

    try {
      const res = await fetch(INSURANCE_BOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "gzip",
        },
        body: JSON.stringify(request),
        cache: "no-store",
      });

      httpStatus = res.status;
      const text = await res.text();

      try {
        response = JSON.parse(text);
      } catch {
        response = { Response: { ResponseStatus: 0, Error: { ErrorCode: 0, ErrorMessage: text }, TraceId: "", Itinerary: {} as any } };
      }

      logResponse("InsuranceBook", httpStatus, response);
      this.saveJson(caseNumber, "response-book.json", response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logError("InsuranceBook", err);
      throw new Error(`Insurance book failed: ${errorMessage}`);
    }

    return { request, response };
  }

  async runTestCase(testCase: CertificationTestCase): Promise<CertificationResult> {
    const startTime = Date.now();
    const executionTimestamp = new Date().toISOString();

    try {
      const token = await getTboToken();

      // Step 1: Search
      const { request: searchRequest, response: searchResponse } = await this.runSearchStep(
        testCase.caseNumber,
        testCase,
        token,
      );

      // Check search response
      if (
        searchResponse.Response?.ResponseStatus !== 1 ||
        !searchResponse.Response?.Results ||
        searchResponse.Response.Results.length === 0
      ) {
        throw new Error(
          `Search failed: ${searchResponse.Response?.Error?.ErrorMessage || "No results"}`,
        );
      }

      // Step 2: Book
      const { request: bookRequest, response: bookResponse } = await this.runBookStep(
        testCase.caseNumber,
        testCase,
        searchResponse,
        token,
      );

      // Check book response
      const itinerary = bookResponse.Response?.Itinerary;
      if (bookResponse.Response?.ResponseStatus !== 1 || !itinerary) {
        throw new Error(
          `Booking failed: ${bookResponse.Response?.Error?.ErrorMessage || "No itinerary"}`,
        );
      }

      const confirmationNumber = itinerary.PlanName || `Booking-${itinerary.BookingId}`;
      const bookingDetails = {
        BookingId: itinerary.BookingId,
        PolicyNumber: itinerary["Passenger Info"]?.[0]?.PolicyNo || "N/A",
        ConfirmationNumber: confirmationNumber,
        BookingStatus: String(itinerary.Status),
        Currency: "INR",
        PremiumAmount: itinerary["Passenger Info"]?.[0]?.Price?.GrossFare || 0,
        StartDate: itinerary.PolicyStartDate,
        EndDate: itinerary.PolicyEndDate,
      };

      // Save confirmation file
      this.saveTxt(
        testCase.caseNumber,
        "confirmation.txt",
        `Confirmation Number: ${confirmationNumber}\n` +
          `Policy Number: ${bookingDetails.PolicyNumber}\n` +
          `Booking ID: ${bookingDetails.BookingId}\n` +
          `Status: ${bookingDetails.BookingStatus}\n` +
          `Premium: ${bookingDetails.Currency} ${bookingDetails.PremiumAmount}\n` +
          `Start Date: ${bookingDetails.StartDate}\n` +
          `End Date: ${bookingDetails.EndDate}\n` +
          `Timestamp: ${executionTimestamp}\n`,
      );

      // Save summary
      const summary = this.generateSummary(testCase, confirmationNumber, bookingDetails);
      this.saveTxt(testCase.caseNumber, "summary.md", summary);

      const duration = Date.now() - startTime;

      return {
        caseNumber: testCase.caseNumber,
        caseName: testCase.caseName,
        tripType: testCase.tripType,
        adultCount: testCase.adultCount,
        travellerDetails: testCase.travellers,
        searchRequest,
        searchResponse,
        bookRequest,
        bookResponse,
        confirmationNumber,
        bookingStatus: bookingDetails.BookingStatus,
        executionTimestamp,
        executionDurationMs: duration,
        success: true,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        caseNumber: testCase.caseNumber,
        caseName: testCase.caseName,
        tripType: testCase.tripType,
        adultCount: testCase.adultCount,
        travellerDetails: testCase.travellers,
        searchRequest: {} as InsuranceSearchRequest,
        searchResponse: {} as InsuranceSearchResponse,
        bookRequest: {} as InsuranceBookRequest,
        bookResponse: {} as InsuranceBookResponse,
        confirmationNumber: "",
        bookingStatus: "FAILED",
        executionTimestamp,
        executionDurationMs: duration,
        success: false,
        errorMessage,
      };
    }
  }

  private generateSummary(testCase: CertificationTestCase, confirmation: string, booking: any): string {
    const travellerInfo = testCase.travellers
      .map(
        (t, i) =>
          `- Traveller ${i + 1}: ${t.FirstName} ${t.LastName} (DOB: ${t.DateOfBirth})`,
      )
      .join("\n");

    return (
      `# TBO Insurance Certification Test Case ${testCase.caseNumber}\n\n` +
      `## Test Case Information\n\n` +
      `- **Case Name**: ${testCase.caseName}\n` +
      `- **Trip Type**: ${testCase.tripType}\n` +
      `- **Number of Adults**: ${testCase.adultCount}\n` +
      `- **Execution Timestamp**: ${new Date().toISOString()}\n\n` +
      `## Trip Details\n\n` +
      `- **Origin**: ${testCase.origin}\n` +
      `- **Destination**: ${testCase.destination}\n` +
      `- **Start Date**: ${testCase.startDate}\n` +
      `- **End Date**: ${testCase.endDate}\n\n` +
      `## Traveller Details\n\n` +
      `${travellerInfo}\n\n` +
      `## Booking Confirmation\n\n` +
      `- **Confirmation Number**: ${confirmation}\n` +
      `- **Policy Number**: ${booking.PolicyNumber || "N/A"}\n` +
      `- **Booking Status**: ${booking.BookingStatus}\n` +
      `- **Premium Amount**: ${booking.Currency} ${booking.PremiumAmount}\n` +
      `- **Coverage Period**: ${booking.StartDate} to ${booking.EndDate}\n`
    );
  }
}

export function createCertificationRunner(baseDir?: string): CertificationRunner {
  return new CertificationRunner(baseDir);
}

export async function runAllCertificationCases(
  testCases: CertificationTestCase[],
  baseDir?: string,
): Promise<CertificationResult[]> {
  const runner = createCertificationRunner(baseDir);
  const results: CertificationResult[] = [];

  for (const testCase of testCases) {
    console.log(`Running certification test case ${testCase.caseNumber}: ${testCase.caseName}`);
    try {
      const result = await runner.runTestCase(testCase);
      results.push(result);
      console.log(
        `✓ Case ${testCase.caseNumber} completed: ${
          result.success ? "SUCCESS" : "FAILED"
        } (${result.executionDurationMs}ms)`,
      );
    } catch (error) {
      console.error(`✗ Case ${testCase.caseNumber} error:`, error);
    }
  }

  return results;
}
