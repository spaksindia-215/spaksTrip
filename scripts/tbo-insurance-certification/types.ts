// Certification Runner Types

export interface CertificationResult {
  caseId: string;
  status: "SUCCESS" | "FAILED" | "PARTIAL";
  startTime: string;
  endTime: string;
  duration: number; // ms
  authTokenId?: string;
  traceId?: string;
  bookingId?: number;
  policyNumber?: string;
  confirmationNumber?: string;
  error?: string;
  steps: StepResult[];
}

export interface StepResult {
  name: string;
  status: "SUCCESS" | "FAILED";
  httpStatus?: number;
  error?: string;
  duration: number; // ms
}

export interface CertificationReport {
  executedAt: string;
  totalCases: number;
  successfulCases: number;
  failedCases: number;
  results: CertificationResult[];
}

export interface TboInsuranceAuthRequest {
  ClientId: string;
  UserName: string;
  Password: string;
  EndUserIp: string;
}

export interface TboInsuranceAuthResponse {
  Status: number;
  TokenId: string;
  Error?: {
    ErrorCode: number;
    ErrorMessage: string;
  };
  Member?: {
    FirstName: string;
    LastName: string;
    Email: string;
    MemberId: number;
    AgencyId: number;
    LoginName: string;
    LoginDetails: string;
    isPrimaryAgent: boolean;
  };
}

export interface TboInsuranceSearchRequest {
  PlanCategory: number;
  PlanType: number;
  PlanCoverage: number;
  TravelStartDate: string;
  NoOfPax: number;
  PaxAge: number[];
  EndUserIp: string;
  TokenId: string;
}

export interface TboInsuranceSearchResult {
  PlanCode: string;
  ResultIndex: number;
  PlanType: number;
  PlanName: string;
  PlanDescription: string | null;
  PlanCoverage: number;
  CoverageDetails: Array<{
    SumCurrency: string;
    Coverage: string;
    SumInsured: string;
    Excess: string | null;
  }>;
  PlanCategory: number;
  PremiumList: Array<{
    Commission: number;
    CustomerPrice: number;
    Premium: number;
    PassengerCount: number;
    MinAge: number;
    MaxAge: number;
  }>;
  Price: {
    Currency: string;
    GrossFare: number;
    PublishedPrice: number;
    OfferedPrice: number;
  };
  PolicyStartDate: string;
  PolicyEndDate: string;
  PoweredBy: string;
  SumInsuredCurrency: string;
  SumInsured: string;
}

export interface TboInsuranceSearchResponse {
  Response: {
    ResponseStatus: number;
    Error?: {
      ErrorCode: number;
      ErrorMessage: string;
    };
    TraceId: string;
    Results: TboInsuranceSearchResult[];
  };
}

export interface TboInsurancePassengerInput {
  Title: string;
  FirstName: string;
  LastName: string;
  BeneficiaryName: string;
  RelationShipToInsured: string;
  RelationToBeneficiary: string;
  Gender: string;
  Sex: number;
  DOB: string;
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
  GenerateInsurancePolicy: string;
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
  Price: {
    Currency: string;
    GrossFare: number;
  };
  SupplierPrice?: {
    Currency: string;
    GrossFare: number;
  };
  OldPolicyNumber: string;
  PolicyStatus: number;
  ErrorMsg: string;
}

export interface TboInsuranceItinerary {
  BookingId: number;
  InsuranceId: number;
  PlanType: number;
  PlanName: string;
  PlanDescription: string;
  PlanCoverage: number;
  CoverageDetails: Array<{
    SumCurrency: string;
    Coverage: string;
    SumInsured: string;
    Excess: string | null;
  }> | null;
  PlanCategory: number;
  "Passenger Info": TboInsuranceBookedPassengerInfo[];
  PolicyStartDate: string;
  PolicyEndDate: string;
  CreatedOn: string;
  Source: string;
  IsDomestic: boolean;
  Status: number;
  BookingHistory: Array<{
    CreatedBy: number;
    CreatedByName: string;
    CreatedOn: string;
    EventCategory: number;
    LastModifiedBy: number;
    LastModifiedByName: string;
    LastModifiedOn: string;
    Remarks: string;
  }>;
  InvoiceNumber?: string;
  InvoiceCreatedOn?: string;
  InvoiceCreatedBy?: number;
  InvoiceCreatedByName?: string;
  InvoiceLastModifiedBy?: number;
  InvoiceLastModifiedByName?: string;
  SupplierName?: string;
}

export interface TboInsuranceBookResponse {
  Response: {
    ResponseStatus: number;
    Error?: {
      ErrorCode: number;
      ErrorMessage: string;
    };
    TraceId: string;
    Itinerary: TboInsuranceItinerary;
  };
}

export interface TboInsuranceGeneratePolicyRequest {
  EndUserIp: string;
  TokenId: string;
  BookingId: number;
}

export interface TboInsuranceGetBookingDetailsRequest {
  EndUserIp: string;
  TokenId: string;
  BookingId: number;
}
