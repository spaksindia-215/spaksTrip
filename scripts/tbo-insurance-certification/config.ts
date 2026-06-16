// TBO Insurance Certification Configuration

export const TBO_CONFIG = {
  AUTH_URL: process.env.TBO_BASE_URL
    ? `${process.env.TBO_BASE_URL}/SharedData.svc/rest/Authenticate`
    : "http://sharedapi.tektravels.com/SharedData.svc/rest/Authenticate",

  SEARCH_URL:
    process.env.TBO_INSURANCE_SEARCH_URL ??
    "https://InsuranceBE.tektravels.com/InsuranceService.svc/rest/Search",

  BOOK_URL:
    process.env.TBO_INSURANCE_BOOK_URL ??
    "https://InsuranceBE.tektravels.com/InsuranceService.svc/rest/Book",

  GENERATE_POLICY_URL:
    process.env.TBO_INSURANCE_GENERATE_POLICY_URL ??
    "https://InsuranceBE.tektravels.com/InsuranceService.svc/rest/GeneratePolicy",

  GET_BOOKING_DETAILS_URL:
    process.env.TBO_INSURANCE_GET_BOOKING_DETAILS_URL ??
    "https://InsuranceBE.tektravels.com/InsuranceService.svc/rest/GetBookingDetails",

  USERNAME: process.env.TBO_INSURANCE_USERNAME ?? "",
  PASSWORD: process.env.TBO_INSURANCE_API_PASSWORD ?? "",
  SERVER_IP: process.env.TBO_INSURANCE_SERVER_IP ?? "1.1.1.1",
  CLIENT_ID: "ApiIntegrationNew",
};

export const CERTIFICATION_CONFIG = {
  RETRY_ATTEMPTS: parseInt(process.env.RETRY_ATTEMPTS ?? "3", 10),
  RETRY_DELAY_MS: parseInt(process.env.RETRY_DELAY_MS ?? "2000", 10),
  REQUEST_TIMEOUT_MS: parseInt(process.env.REQUEST_TIMEOUT_MS ?? "30000", 10),
  DELAY_BETWEEN_REQUESTS_MS: parseInt(
    process.env.DELAY_BETWEEN_REQUESTS_MS ?? "2000",
    10
  ),
  OUTPUT_DIR: process.env.OUTPUT_DIR ?? "./certification-output",
  LOG_LEVEL: process.env.LOG_LEVEL ?? "info", // debug, info, warn, error
};

export const TRAVEL_CONFIG = {
  // Travel start date (ISO 8601 format)
  TRAVEL_START_DATE: process.env.TRAVEL_START_DATE ?? "2026-07-25T00:00:00",
  // Trip duration in days
  TRIP_DURATION_DAYS: parseInt(process.env.TRIP_DURATION_DAYS ?? "7", 10),
};
