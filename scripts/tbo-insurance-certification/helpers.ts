import { Logger } from "./logger";
import { TestCase } from "./cases";
import {
  TboInsurancePassengerInput,
  TboInsuranceBookedPassengerInfo,
} from "./types";

export class HelperFunctions {
  static calculateDOB(age: number): string {
    const today = new Date();
    const birthDate = new Date(
      today.getFullYear() - age,
      today.getMonth(),
      today.getDate()
    );
    return birthDate.toISOString();
  }

  static formatDateForTravel(dateString: string): string {
    // Ensure ISO 8601 format: YYYY-MM-DDTHH:mm:ss
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}T00:00:00`;
  }

  static addDaysToDate(dateString: string, days: number): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0] + "T00:00:00";
  }

  static generatePassengerInput(
    testCase: TestCase,
    passengerIndex: number,
    logger: Logger
  ): TboInsurancePassengerInput {
    const age = testCase.travellers[passengerIndex].age;
    const dob = this.calculateDOB(age);
    const firstName = `Traveller${passengerIndex + 1}`;
    const lastName = testCase.id;

    logger.debug(
      `Generating passenger input: ${firstName} ${lastName}, Age: ${age}, DOB: ${dob}`
    );

    return {
      Title: "Mr",
      FirstName: firstName,
      LastName: lastName,
      BeneficiaryName: `${firstName} ${lastName}`,
      RelationShipToInsured: "Self",
      RelationToBeneficiary: "Self",
      Gender: "1",
      Sex: 1,
      DOB: dob,
      PassportNo: `P${testCase.id.toUpperCase()}${passengerIndex + 1}`,
      PhoneNumber: "9876543210",
      EmailId: `traveller${passengerIndex + 1}.${testCase.id}@test.com`,
      AddressLine1: "123 Test Street",
      AddressLine2: "Test Building",
      CityCode: "DEL",
      CountryCode: "IN",
      PassportCountry: "IN",
      MajorDestination: testCase.tripType === "domestic" ? "DEL" : "SIN",
      PinCode: 110001,
    };
  }

  static extractBookingDetails(
    bookResponse: unknown,
    logger: Logger
  ): {
    bookingId?: number;
    policyNumbers?: string[];
    confirmationNumber?: string;
  } {
    const book = bookResponse as {
      Response?: {
        Itinerary?: {
          BookingId?: number;
          "Passenger Info"?: Array<{
            PolicyNo?: string;
            ReferenceId?: string;
          }>;
        };
      };
    };

    const result: {
      bookingId?: number;
      policyNumbers?: string[];
      confirmationNumber?: string;
    } = {};

    if (book?.Response?.Itinerary?.BookingId) {
      result.bookingId = book.Response.Itinerary.BookingId;
      logger.info(`Extracted BookingId: ${result.bookingId}`);
    }

    const passengerInfo = book?.Response?.Itinerary?.["Passenger Info"];
    if (Array.isArray(passengerInfo) && passengerInfo.length > 0) {
      result.policyNumbers = passengerInfo
        .map((p) => p.PolicyNo)
        .filter(Boolean) as string[];
      result.confirmationNumber = passengerInfo[0].ReferenceId;

      if (result.policyNumbers.length > 0) {
        logger.info(`Extracted PolicyNumbers: ${result.policyNumbers.join(", ")}`);
      }
      if (result.confirmationNumber) {
        logger.info(`Extracted ConfirmationNumber: ${result.confirmationNumber}`);
      }
    }

    return result;
  }

  static extractPlanIndex(searchResponse: unknown): number {
    const search = searchResponse as {
      Response?: {
        Results?: Array<{
          ResultIndex?: number;
        }>;
      };
    };

    const results = search?.Response?.Results;
    if (Array.isArray(results) && results.length > 0) {
      return results[0].ResultIndex ?? 0;
    }

    return 0;
  }

  static generateConfirmationNumber(bookingId: number, caseId: string): string {
    const timestamp = new Date().getTime();
    return `TBO-${caseId.toUpperCase()}-${bookingId}-${timestamp}`;
  }

  static formatDuration(startTime: string, endTime: string): number {
    return new Date(endTime).getTime() - new Date(startTime).getTime();
  }
}
