import { Logger } from "./logger";
import { TestCase } from "./cases";
import {
  TboInsuranceAuthResponse,
  TboInsuranceSearchResponse,
  TboInsuranceBookResponse,
} from "./types";

export class Validator {
  static validateAuthResponse(
    response: unknown,
    logger: Logger
  ): response is TboInsuranceAuthResponse {
    const auth = response as TboInsuranceAuthResponse;

    if (!auth || typeof auth !== "object") {
      logger.error("Auth response is not an object");
      return false;
    }

    if (auth.Status !== 1) {
      logger.error(
        `Auth failed with status ${auth.Status}: ${auth.Error?.ErrorMessage}`
      );
      return false;
    }

    if (!auth.TokenId || typeof auth.TokenId !== "string") {
      logger.error("Auth response missing TokenId");
      return false;
    }

    logger.info(`Auth successful, TokenId: ${auth.TokenId.substring(0, 20)}...`);
    return true;
  }

  static validateSearchResponse(
    response: unknown,
    logger: Logger
  ): response is TboInsuranceSearchResponse {
    const search = response as TboInsuranceSearchResponse;

    if (!search || !search.Response) {
      logger.error("Search response structure invalid");
      return false;
    }

    const r = search.Response;

    if (r.ResponseStatus !== 1) {
      logger.error(
        `Search failed with status ${r.ResponseStatus}: ${r.Error?.ErrorMessage}`
      );
      return false;
    }

    if (!Array.isArray(r.Results) || r.Results.length === 0) {
      logger.error("Search returned no plans");
      return false;
    }

    logger.info(`Search returned ${r.Results.length} plan(s)`);
    return true;
  }

  static validateBookResponse(
    response: unknown,
    logger: Logger
  ): response is TboInsuranceBookResponse {
    const book = response as TboInsuranceBookResponse;

    if (!book || !book.Response) {
      logger.error("Book response structure invalid");
      return false;
    }

    const r = book.Response;

    if (r.ResponseStatus !== 1) {
      logger.error(
        `Book failed with status ${r.ResponseStatus}: ${r.Error?.ErrorMessage}`
      );
      return false;
    }

    if (!r.Itinerary || !r.Itinerary.BookingId) {
      logger.error("Book response missing BookingId");
      return false;
    }

    logger.info(`Book successful, BookingId: ${r.Itinerary.BookingId}`);
    return true;
  }

  static validateTestCase(testCase: TestCase, logger: Logger): boolean {
    // Validate traveller count
    if (testCase.travellers.length === 0) {
      logger.error(`Test case ${testCase.id}: No travellers defined`);
      return false;
    }

    if (testCase.travellers.length > 2) {
      logger.warn(
        `Test case ${testCase.id}: More than 2 travellers (certification doesn't support this)`
      );
    }

    // Validate traveller ages
    for (let i = 0; i < testCase.travellers.length; i++) {
      const age = testCase.travellers[i].age;

      if (age < 0 || age > 100) {
        logger.error(
          `Test case ${testCase.id}: Traveller ${i + 1} age ${age} is invalid`
        );
        return false;
      }

      // Check boundary conditions for multi-traveller cases
      if (testCase.travellers.length === 2) {
        const isFirstRange = i === 0 && age >= 0 && age <= 40;
        const isSecondRange = i === 1 && age >= 41 && age <= 70;

        if (!isFirstRange && !isSecondRange) {
          logger.warn(
            `Test case ${testCase.id}: Traveller ${i + 1} age ${age} doesn't match expected boundary range`
          );
        }
      }
    }

    logger.info(`Test case ${testCase.id} validation passed`);
    return true;
  }

  static validatePassengerData(
    firstName: string,
    lastName: string,
    dob: string,
    email: string,
    phone: string,
    logger: Logger
  ): boolean {
    if (!firstName || firstName.trim().length === 0) {
      logger.error("First name is required");
      return false;
    }

    if (!lastName || lastName.trim().length === 0) {
      logger.error("Last name is required");
      return false;
    }

    if (!email || !email.includes("@")) {
      logger.error("Valid email is required");
      return false;
    }

    if (!phone || phone.length < 10) {
      logger.error("Valid phone number is required");
      return false;
    }

    try {
      const dobDate = new Date(dob);
      if (isNaN(dobDate.getTime())) {
        logger.error("Invalid DOB format");
        return false;
      }
    } catch {
      logger.error("Invalid DOB format");
      return false;
    }

    return true;
  }
}
