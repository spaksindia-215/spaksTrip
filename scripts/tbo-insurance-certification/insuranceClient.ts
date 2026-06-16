import { Logger } from "./logger";
import { retryWithBackoff, sleep } from "./retry";
import { Validator } from "./validators";
import { HelperFunctions } from "./helpers";
import { CERTIFICATION_CONFIG, TBO_CONFIG, TRAVEL_CONFIG } from "./config";
import { TestCase } from "./cases";
import {
  TboInsuranceAuthResponse,
  TboInsuranceSearchResponse,
  TboInsuranceBookResponse,
  TboInsuranceGeneratePolicyRequest,
  TboInsuranceGetBookingDetailsRequest,
  CertificationResult,
  StepResult,
} from "./types";

export class TboInsuranceClient {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async authenticate(): Promise<{ tokenId: string; status: "SUCCESS" | "FAILED" }> {
    const startTime = new Date().toISOString();
    const stepName = "auth";

    try {
      const request = {
        ClientId: TBO_CONFIG.CLIENT_ID,
        UserName: TBO_CONFIG.USERNAME,
        Password: "[REDACTED]",
        EndUserIp: TBO_CONFIG.SERVER_IP,
      };

      const response = await retryWithBackoff(
        () => this.fetchWithTimeout(TBO_CONFIG.AUTH_URL, "POST", request),
        {
          maxAttempts: CERTIFICATION_CONFIG.RETRY_ATTEMPTS,
          delayMs: CERTIFICATION_CONFIG.RETRY_DELAY_MS,
        },
        this.logger,
        "Authentication"
      );

      // Validate response
      if (!Validator.validateAuthResponse(response, this.logger)) {
        this.logger.saveRequestResponse(stepName, request, response, true);
        return { tokenId: "", status: "FAILED" };
      }

      const auth = response as TboInsuranceAuthResponse;
      this.logger.saveRequestResponse(stepName, request, response);
      this.logger.info("✓ Authentication successful");

      return { tokenId: auth.TokenId, status: "SUCCESS" };
    } catch (error) {
      this.logger.error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`);
      return { tokenId: "", status: "FAILED" };
    } finally {
      await this.delayBetweenRequests();
    }
  }

  async searchPlans(
    testCase: TestCase,
    tokenId: string
  ): Promise<{ traceId: string; resultIndex: number; status: "SUCCESS" | "FAILED" }> {
    const stepName = "search";

    try {
      const request = {
        PlanCategory: testCase.planCategory,
        PlanType: 1,
        PlanCoverage: testCase.planCoverage,
        TravelStartDate: HelperFunctions.formatDateForTravel(
          TRAVEL_CONFIG.TRAVEL_START_DATE
        ),
        NoOfPax: testCase.travellers.length,
        PaxAge: testCase.travellers.map((t) => t.age),
        EndUserIp: TBO_CONFIG.SERVER_IP,
        TokenId: tokenId,
      };

      const response = await retryWithBackoff(
        () => this.fetchWithTimeout(TBO_CONFIG.SEARCH_URL, "POST", request),
        {
          maxAttempts: CERTIFICATION_CONFIG.RETRY_ATTEMPTS,
          delayMs: CERTIFICATION_CONFIG.RETRY_DELAY_MS,
        },
        this.logger,
        "Search"
      );

      // Validate response
      if (!Validator.validateSearchResponse(response, this.logger)) {
        this.logger.saveRequestResponse(stepName, request, response, true);
        return { traceId: "", resultIndex: -1, status: "FAILED" };
      }

      const search = response as TboInsuranceSearchResponse;
      const traceId = search.Response.TraceId;
      const resultIndex = HelperFunctions.extractPlanIndex(search);

      this.logger.saveRequestResponse(stepName, request, response);
      this.logger.info(
        `✓ Search successful, TraceId: ${traceId}, ResultIndex: ${resultIndex}`
      );

      return { traceId, resultIndex, status: "SUCCESS" };
    } catch (error) {
      this.logger.error(
        `Search failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return { traceId: "", resultIndex: -1, status: "FAILED" };
    } finally {
      await this.delayBetweenRequests();
    }
  }

  async bookInsurance(
    testCase: TestCase,
    tokenId: string,
    traceId: string,
    resultIndex: number
  ): Promise<{ bookingId: number; confirmationNumber: string; status: "SUCCESS" | "FAILED" }> {
    const stepName = "book";

    try {
      const passengers = [];
      for (let i = 0; i < testCase.travellers.length; i++) {
        passengers.push(
          HelperFunctions.generatePassengerInput(testCase, i, this.logger)
        );
      }

      const request = {
        TokenId: tokenId,
        EndUserIp: TBO_CONFIG.SERVER_IP,
        TraceId: traceId,
        GenerateInsurancePolicy: "false",
        ResultIndex: resultIndex,
        Passenger: passengers,
      };

      const response = await retryWithBackoff(
        () => this.fetchWithTimeout(TBO_CONFIG.BOOK_URL, "POST", request),
        {
          maxAttempts: CERTIFICATION_CONFIG.RETRY_ATTEMPTS,
          delayMs: CERTIFICATION_CONFIG.RETRY_DELAY_MS,
        },
        this.logger,
        "Book"
      );

      // Validate response
      if (!Validator.validateBookResponse(response, this.logger)) {
        this.logger.saveRequestResponse(stepName, request, response, true);
        return { bookingId: -1, confirmationNumber: "", status: "FAILED" };
      }

      const book = response as TboInsuranceBookResponse;
      const bookingId = book.Response.Itinerary.BookingId;
      const bookingDetails = HelperFunctions.extractBookingDetails(book, this.logger);
      const confirmationNumber = bookingDetails.confirmationNumber ||
        HelperFunctions.generateConfirmationNumber(bookingId, testCase.id);

      this.logger.saveRequestResponse(stepName, request, response);
      this.logger.info(
        `✓ Book successful, BookingId: ${bookingId}, ConfirmationNumber: ${confirmationNumber}`
      );

      return { bookingId, confirmationNumber, status: "SUCCESS" };
    } catch (error) {
      this.logger.error(
        `Book failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return { bookingId: -1, confirmationNumber: "", status: "FAILED" };
    } finally {
      await this.delayBetweenRequests();
    }
  }

  async generatePolicy(
    tokenId: string,
    bookingId: number
  ): Promise<{ status: "SUCCESS" | "FAILED" }> {
    const stepName = "generate-policy";

    try {
      const request: TboInsuranceGeneratePolicyRequest = {
        EndUserIp: TBO_CONFIG.SERVER_IP,
        TokenId: tokenId,
        BookingId: bookingId,
      };

      const response = await retryWithBackoff(
        () =>
          this.fetchWithTimeout(TBO_CONFIG.GENERATE_POLICY_URL, "POST", request),
        {
          maxAttempts: CERTIFICATION_CONFIG.RETRY_ATTEMPTS,
          delayMs: CERTIFICATION_CONFIG.RETRY_DELAY_MS,
        },
        this.logger,
        "Generate Policy"
      );

      // Validate response - same structure as book response
      if (!Validator.validateBookResponse(response, this.logger)) {
        this.logger.saveRequestResponse(stepName, request, response, true);
        return { status: "FAILED" };
      }

      this.logger.saveRequestResponse(stepName, request, response);
      this.logger.info("✓ Generate Policy successful");

      return { status: "SUCCESS" };
    } catch (error) {
      this.logger.error(
        `Generate Policy failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return { status: "FAILED" };
    } finally {
      await this.delayBetweenRequests();
    }
  }

  async getBookingDetails(
    tokenId: string,
    bookingId: number
  ): Promise<{ status: "SUCCESS" | "FAILED"; details?: unknown }> {
    const stepName = "booking-details";

    try {
      const request: TboInsuranceGetBookingDetailsRequest = {
        EndUserIp: TBO_CONFIG.SERVER_IP,
        TokenId: tokenId,
        BookingId: bookingId,
      };

      const response = await retryWithBackoff(
        () =>
          this.fetchWithTimeout(
            TBO_CONFIG.GET_BOOKING_DETAILS_URL,
            "POST",
            request
          ),
        {
          maxAttempts: CERTIFICATION_CONFIG.RETRY_ATTEMPTS,
          delayMs: CERTIFICATION_CONFIG.RETRY_DELAY_MS,
        },
        this.logger,
        "Get Booking Details"
      );

      // Validate response - same structure as book response
      if (!Validator.validateBookResponse(response, this.logger)) {
        this.logger.saveRequestResponse(stepName, request, response, true);
        return { status: "FAILED" };
      }

      this.logger.saveRequestResponse(stepName, request, response);
      this.logger.info("✓ Get Booking Details successful");

      return { status: "SUCCESS", details: response };
    } catch (error) {
      this.logger.error(
        `Get Booking Details failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return { status: "FAILED" };
    } finally {
      await this.delayBetweenRequests();
    }
  }

  private async fetchWithTimeout(
    url: string,
    method: string,
    body: unknown
  ): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      CERTIFICATION_CONFIG.REQUEST_TIMEOUT_MS
    );

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok && response.status >= 500) {
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  private async delayBetweenRequests(): Promise<void> {
    await sleep(CERTIFICATION_CONFIG.DELAY_BETWEEN_REQUESTS_MS);
  }
}
