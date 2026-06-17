// TBO Insurance API v10.0 Types
// Field names and order match TBO documentation exactly.

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface TboError {
  ErrorCode: number;
  ErrorMessage: string;
}

export interface TboPrice {
  Currency: string;
  GrossFare: number;
  PublishedPrice: number;
  PublishedPriceRoundedOff: number;
  OfferedPrice: number;
  OfferedPriceRoundedOff: number;
  CommissionEarned: number;
  TdsOnCommission: number;
  ServiceTax: number;
  SwachhBharatTax: number;
  KrishiKalyanTax: number;
}

// ─── Authentication ───────────────────────────────────────────────────────────

export interface TboInsuranceAuthRequest {
  ClientId: "ApiIntegrationNew";
  UserName: string;
  Password: string;
  EndUserIp: string;
}

export interface TboInsuranceAuthMember {
  FirstName: string;
  LastName: string;
  Email: string;
  MemberId: number;
  AgencyId: number;
  LoginName: string;
  LoginDetails: string;
  isPrimaryAgent: boolean;
}

export interface TboInsuranceAuthResponse {
  Status: number; // 1 = success
  TokenId: string;
  Error: TboError;
  Member: TboInsuranceAuthMember;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export type TboInsuranceSearchPlanCategory = 1 | 2; // 1=Domestic, 2=Overseas
export type TboInsurancePlanCategory = 1 | 2 | 3 | 4 | 5 | 6;
export type TboInsurancePlanCoverage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type TboInsurancePlanType = 1 | 2;

export interface TboInsuranceSearchRequest {
  PlanCategory: TboInsuranceSearchPlanCategory;
  PlanType: TboInsurancePlanType;
  PlanCoverage: TboInsurancePlanCoverage;
  TravelStartDate: string; // ISO 8601: "YYYY-MM-DDTHH:mm:ss"
  NoOfPax: number;
  PaxAge: number[];
  EndUserIp: string;
  TokenId: string;
}

export interface TboCoverageDetail {
  SumCurrency: string;
  Coverage: string;
  SumInsured: string;
  Excess: string | null;
}

export interface TboPremiumEntry {
  Commission: number;
  CustomerPrice: number;
  Premium: number;
  PassengerCount: number;
  MinAge: number;
  MaxAge: number;
  BaseCurrencyPrice: TboPrice;
  Price: TboPrice;
  BaseCurrencyCancellationCharge: number;
  CancellationCharge: number;
}

export interface TboInsuranceSearchResult {
  PlanCode: string;
  ResultIndex: number;
  PlanType: TboInsurancePlanType;
  PlanName: string;
  PlanDescription: string | null;
  PlanCoverage: TboInsurancePlanCoverage;
  CoverageDetails: TboCoverageDetail[];
  PlanCategory: TboInsurancePlanCategory;
  PremiumList: TboPremiumEntry[];
  Price: TboPrice;
  PolicyStartDate: string; // ISO 8601
  PolicyEndDate: string; // ISO 8601
  PoweredBy: string;
  SumInsuredCurrency: string;
  SumInsured: string;
}

export interface TboInsuranceSearchResponseBody {
  ResponseStatus: number;
  Error: TboError;
  TraceId: string;
  Results: TboInsuranceSearchResult[];
}

export interface TboInsuranceSearchResponse {
  Response: TboInsuranceSearchResponseBody;
}

// ─── Booking ──────────────────────────────────────────────────────────────────

export type TboInsurancePassengerTitle = "Mr" | "Mrs" | "Miss" | "Ms" | "SHRI" | "SMT" | "MR" | "MRS" | "MISS" | "MS";
export type TboInsuranceGenderStr = "1" | "2";
export type TboInsuranceSex = 1 | 2;

export interface TboInsurancePassengerInput {
  Title: TboInsurancePassengerTitle;
  FirstName: string;
  LastName: string;
  BeneficiaryName: string;
  RelationShipToInsured: string;
  RelationToBeneficiary: string;
  Gender: TboInsuranceGenderStr;
  Sex: TboInsuranceSex;
  DOB: string; // ISO 8601: "YYYY-MM-DDTHH:mm:ss"
  PassportNo: string;
  PhoneNumber: string;
  EmailId: string;
  AddressLine1: string;
  AddressLine2: string;
  CityCode: string;
  CountryCode: string;
  PassportCountry: string;
  MajorDestination: string;
  PinCode: number;
}

export interface TboInsuranceBookRequest {
  TokenId: string;
  EndUserIp: string;
  TraceId: string;
  GenerateInsurancePolicy: "false" | "true";
  ResultIndex: number;
  Passenger: TboInsurancePassengerInput[];
}

export interface TboInsuranceBookedPassengerInfo {
  "Passenger Id": number;
  PolicyNo: string;
  ClaimCode: string | null;
  SiebelPolicyNumber: string;
  ReferenceId: string;
  DocumentURL: string | null;
  MaxAge: number;
  MinAge: number;
  Title: string;
  FirstName: string;
  LastName: string;
  Gender: string;
  DOB: string;
  BeneficiaryName: string;
  RelationShipToInsured: string;
  RelationToBeneficiary: string;
  EmailId: string;
  PhoneNumber: string;
  PassportNo: string;
  AddressLine1: string;
  AddressLine2: string;
  Country: string;
  State: string;
  City: string;
  PinCode: string;
  MajorDestination: string;
  Price: TboPrice;
  SupplierPrice?: TboPrice;
  OldPolicyNumber: string;
  PolicyStatus: number;
  ErrorMsg: string;
}

export interface TboInsuranceBookingHistory {
  CreatedBy: number;
  CreatedByName: string;
  CreatedOn: string;
  EventCategory: number;
  LastModifiedBy: number;
  LastModifiedByName: string;
  LastModifiedOn: string;
  Remarks: string;
}

export interface TboInsuranceItinerary {
  BookingId: number;
  InsuranceId: number;
  PlanType: TboInsurancePlanType;
  PlanName: string;
  PlanDescription: string;
  PlanCoverage: TboInsurancePlanCoverage;
  CoverageDetails: TboCoverageDetail[] | null;
  PlanCategory: TboInsurancePlanCategory;
  "Passenger Info": TboInsuranceBookedPassengerInfo[];
  PolicyStartDate: string;
  PolicyEndDate: string;
  CreatedOn: string;
  Source: string;
  IsDomestic: boolean;
  Status: number;
  BookingHistory: TboInsuranceBookingHistory[];
  InvoiceNumber?: string;
  InvoiceCreatedOn?: string;
  InvoiceCreatedBy?: number;
  InvoiceCreatedByName?: string;
  InvoiceLastModifiedBy?: number;
  InvoiceLastModifiedByName?: string;
  SupplierName?: string;
}

export interface TboInsuranceBookResponseBody {
  ResponseStatus: number;
  Error: TboError;
  TraceId: string;
  Itinerary: TboInsuranceItinerary;
}

export interface TboInsuranceBookResponse {
  Response: TboInsuranceBookResponseBody;
}

// ─── Generate Policy ──────────────────────────────────────────────────────────

export interface TboInsuranceGeneratePolicyRequest {
  EndUserIp: string;
  TokenId: string;
  BookingId: number;
}

// Response shape is identical to Book response

// ─── Get Booking Details ──────────────────────────────────────────────────────

export interface TboInsuranceGetBookingDetailsRequest {
  EndUserIp: string;
  TokenId: string;
  BookingId: number;
}

// Response shape is identical to Book response

// ─── Cancel ───────────────────────────────────────────────────────────────────

export interface TboInsuranceCancelRequest {
  EndUserIp: string;
  TokenId: string;
  BookingId: number;
  RequestType: 3; // 3 = Refund
  Remarks: string;
}

export interface TboInsurancePassengerChangeRequest {
  CancellationCharge: number;
  ChangeRequestId: number;
  ChangeRequestStatus: number;
  CreditNoteCreatedOn: string;
  CreditNoteNo: string;
  KrishiKalyanCess: number;
  "Passenger Name": string;
  PolicyNo: string;
  RefundedAmount: number;
  Remarks: string;
  SwachhBharatCess: number;
}

export interface TboInsuranceCancelResponseBody {
  ResponseStatus: number;
  Error: TboError;
  TraceId: string;
  PassengerChangeRequest: TboInsurancePassengerChangeRequest[];
}

export interface TboInsuranceCancelResponse {
  Response: TboInsuranceCancelResponseBody;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface TboInsuranceSession {
  tokenId: string;
  memberId: number;
  agencyId: number;
  expiresAt: number; // epoch ms
}

// ─── Certification ────────────────────────────────────────────────────────────

export interface CertificationTestCase {
  caseNumber: number;
  caseName: string;
  tripType: string;
  planCategory: number;
  planType: number;
  planCoverage: number;
  adultCount: number;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  travellers: TravellerDetail[];
}

export interface TravellerDetail {
  Title?: string;
  FirstName: string;
  LastName: string;
  DateOfBirth: string;
  Gender?: string;
  Nationality?: string;
  Passport?: string;
  PhoneNumber: string;
  Email: string;
  BeneficiaryName?: string;
  RelationShipToInsured?: string;
  RelationToBeneficiary?: string;
  AddressLine1?: string;
  AddressLine2?: string;
  CityCode?: string;
  CountryCode?: string;
  PinCode?: string;
}

export interface CertificationResult {
  caseNumber: number;
  caseName: string;
  tripType: string;
  adultCount: number;
  travellerDetails: TravellerDetail[];
  searchRequest: InsuranceSearchRequest;
  searchResponse: InsuranceSearchResponse;
  bookRequest: InsuranceBookRequest;
  bookResponse: InsuranceBookResponse;
  confirmationNumber: string;
  bookingStatus: string;
  executionTimestamp: string;
  executionDurationMs: number;
  success: boolean;
  errorMessage?: string;
}

// ─── Request/Response Aliases ────────────────────────────────────────────────

export type InsuranceSearchRequest = TboInsuranceSearchRequest;
export type InsuranceSearchResponse = TboInsuranceSearchResponse;
export type InsuranceBookRequest = TboInsuranceBookRequest;
export type InsuranceBookResponse = TboInsuranceBookResponse;
