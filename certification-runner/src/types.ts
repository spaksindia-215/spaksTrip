// ─── TBO API Request Types ────────────────────────────────────────────────────

export interface TboSearchPaxRoom {
  Adults: number;
  Children: number;
  ChildrenAges: number[];
}

export interface TboSearchRequest {
  CheckIn: string;
  CheckOut: string;
  HotelCodes: string;
  GuestNationality: string;
  PaxRooms: TboSearchPaxRoom[];
  IsDetailedResponse: boolean;
  ResponseTime: number;
  Filters?: {
    Refundable?: boolean;
    NoOfRooms?: number;
    MealType?: number | null;
    StarRating?: number | null;
  };
}

export interface TboPreBookRequest {
  BookingCode: string;
  PaymentMode: string;
}

export interface TboPassenger {
  Title: string;
  FirstName: string;
  MiddleName: string;
  LastName: string;
  Email: string | null;
  Phoneno: string | null;
  PaxType: 1 | 2;
  LeadPassenger: boolean;
  Age: number;
  PassportNo: string | null;
  PassportIssueDate: string | null;
  PassportExpDate: string | null;
  PAN: string | null;
  PaxId: number;
  GSTCompanyName: string | null;
  GSTNumber: string | null;
  GSTCompanyEmail: string | null;
  GSTCompanyAddress: string | null;
  GSTCompanyContactNumber: string | null;
}

export interface TboRoomDetail {
  HotelPassenger: TboPassenger[];
}

export interface TboBookRequest {
  BookingCode: string;
  IsVoucherBooking: boolean;
  GuestNationality: string;
  EndUserIp: string;
  NetAmount: number;
  RequestedBookingMode: 5;
  HotelRoomsDetails: TboRoomDetail[];
  ClientReferenceId?: string;
}

export interface TboVoucherRequest {
  BookingId: number;
  EndUserIp: string;
  IsCorporate?: string;
  HotelRoomsDetails?: Array<{
    HotelPassenger: Array<{ PaxId: string; PAN: string }>;
  }>;
}

export interface TboGetBookingDetailRequest {
  BookingId: number;
  EndUserIp: string;
}

// ─── TBO API Response Types ───────────────────────────────────────────────────

export interface TboCancelPolicy {
  Index: number;
  FromDate: string;
  ChargeType: string;
  CancellationCharge: number;
}

export interface TboSearchRoom {
  BookingCode: string;
  Name?: string[];
  DayRates?: Array<Array<{ BasePrice: number }>>;
  TotalFare: number;
  TotalTax?: number;
  MealType?: string;
  IsRefundable: boolean;
  CancelPolicies?: TboCancelPolicy[];
  Inclusion?: string;
}

export interface TboSearchHotel {
  HotelCode: string;
  Currency?: string;
  Rooms: TboSearchRoom[];
}

export interface TboSearchResponse {
  Status?: { Code: number; Description: string };
  HotelResult?: TboSearchHotel[];
  Error?: { ErrorCode: number; ErrorMessage: string };
}

export interface TboPreBookRoom {
  BookingCode: string;
  Name?: string[];
  TotalFare: number;
  TotalTax?: number;
  IsRefundable: boolean;
  NetAmount?: number;
  PanMandatory?: boolean;
  PassportMandatory?: boolean;
  PaxNameMinLength?: number;
  PaxNameMaxLength?: number;
  SamePaxNameAllowed?: boolean;
  SpaceAllowed?: boolean;
  CancelPolicies?: TboCancelPolicy[];
  MealType?: string;
  PackageFare?: boolean;
  GSTAllowed?: boolean;
}

export interface TboPreBookHotel {
  HotelCode: string;
  Currency?: string;
  Rooms?: TboPreBookRoom[];
  RateConditions?: string[];
}

export interface TboPreBookValidationInfo {
  PanMandatory: boolean;
  PassportMandatory: boolean;
  CorporateBookingAllowed: boolean;
  PanCountRequired: number;
  SamePaxNameAllowed: boolean;
  SpaceAllowed: boolean;
  SpecialCharAllowed: boolean;
  PaxNameMinLength: number;
  PaxNameMaxLength: number;
  CharLimit: boolean;
  PackageFare: boolean;
  PackageDetailsMandatory: boolean;
  DepartureDetailsMandatory: boolean;
  GSTAllowed: boolean;
}

export interface TboPreBookResponse {
  Status?: { Code: number; Description: string };
  HotelResult?: TboPreBookHotel[];
  ValidationInfo?: TboPreBookValidationInfo;
  Error?: { ErrorCode: number; ErrorMessage: string };
}

export interface TboBookResult {
  VoucherStatus?: boolean;
  ResponseStatus?: number;
  Error?: { ErrorCode: number; ErrorMessage: string };
  TraceId?: string;
  Status?: number;
  HotelBookingStatus?: string;
  InvoiceNumber?: string;
  ConfirmationNo?: string;
  BookingRefNo?: string;
  BookingId?: number | null;
  IsPriceChanged?: boolean;
  IsCancellationPolicyChanged?: boolean;
  NetAmount?: number;
}

export interface TboBookResponse {
  BookResult?: TboBookResult;
}

export interface TboVoucherResult {
  VoucherStatus?: boolean;
  ResponseStatus?: number;
  Error?: { ErrorCode: number; ErrorMessage: string };
  Status?: number;
  HotelBookingStatus?: string;
  InvoiceNumber?: string;
  ConfirmationNo?: string;
  BookingRefNo?: string;
  BookingId?: number | null;
}

export interface TboVoucherResponse {
  GenerateVoucherResult?: TboVoucherResult;
}

export interface TboGetBookingDetailResult {
  ResponseStatus?: number;
  Error?: { ErrorCode: number; ErrorMessage: string };
  BookingId?: number;
  BookingRefNo?: string;
  ConfirmationNo?: string;
  HotelBookingStatus?: string;
  InvoiceNumber?: string;
  HotelName?: string;
  CheckIn?: string;
  CheckOut?: string;
  TotalRooms?: number;
  NetAmount?: number;
  Currency?: string;
}

export interface TboGetBookingDetailResponse {
  GetBookingDetailResult?: TboGetBookingDetailResult;
}

export interface TboHotelCodeItem {
  TBOHotelCode?: string;
  HotelCode?: string;
  HotelName?: string;
  CityName?: string;
  CountryName?: string;
  HotelRating?: string;
}

export interface TboHotelCodeListResponse {
  Status?: { Code: number; Description: string };
  Hotels?: TboHotelCodeItem[];         // actual field name in TBO response
  HotelCodeList?: TboHotelCodeItem[];  // fallback alias (some TBO environments)
  Error?: { ErrorCode: number; ErrorMessage: string };
}

// ─── Internal Certification Types ─────────────────────────────────────────────

export interface PassengerSpec {
  title: string;
  firstName: string;
  lastName: string;
  paxType: 1 | 2;
  leadPassenger: boolean;
  age?: number;
  passportNo?: string;
  passportExpDate?: string;
}

export interface RoomSpec {
  adults: number;
  children: number;
  childAges: number[];
  passengers: PassengerSpec[];
}

export interface CaseConfig {
  caseNumber: number;
  name: string;
  description: string;
  cityCode: string;
  guestNationality: string;
  rooms: RoomSpec[];
  isInternational: boolean;
}

export interface SelectedHotel {
  hotelCode: string;
  bookingCode: string;
  totalFare: number;
  isRefundable: boolean;
  currency: string;
}

export interface PreBookData {
  bookingCode: string;
  netAmount: number;
  totalFare: number;
  panMandatory: boolean;
  passportMandatory: boolean;
  isRefundable: boolean;
  currency: string;
}

export interface BookingFlowResult {
  caseNumber: number;
  caseName: string;
  hotelCode: string;
  searchRequest: TboSearchRequest;
  searchResponse: TboSearchResponse;
  preBookRequest: TboPreBookRequest;
  preBookResponse: TboPreBookResponse;
  bookRequest: TboBookRequest;
  bookResponse: TboBookResponse;
  voucherRequest: TboVoucherRequest;
  voucherResponse: TboVoucherResponse;
  bookingDetailResponse: TboGetBookingDetailResponse;
  bookingId: number | null;
  confirmationNo: string | null;
  bookingRefNo: string | null;
  hotelName: string | null;
  bookingStatus: string;
  voucherStatus: boolean;
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface CaseRunResult {
  caseNumber: number;
  caseName: string;
  success: boolean;
  bookingId: number | null;
  confirmationNo: string | null;
  error?: string;
  outputDir: string;
  duration: number;
}
