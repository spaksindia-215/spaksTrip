import "server-only";
import { logRequest, logResponse, logError } from "../log";
import { assertTboSuccess } from "../errors";
import { basicAuthHeader } from "./hotelUtils";

// Endpoint: POST https://hotelbe.tektravels.com/hotelservice.svc/rest/Getbookingdetail
// Auth: Basic Auth — same agency credentials as Search / PreBook / Book.
// Three lookup modes (use exactly one):
//   1. bookingId alone          — fastest, recommended
//   2. confirmationNo + firstName + lastName
//   3. traceId alone

const TBO_BOOKING_URL = (
  process.env.TBO_HOLIDAYS_BOOKING_URL ??
  "https://hotelbe.tektravels.com/hotelservice.svc/rest/Getbookingdetail"
).replace(/\/$/, "");

// ─── Raw TBO shapes ───────────────────────────────────────────────────────────

interface TboTaxBreakup {
  TaxType: string;
  TaxAmount: number;
}

interface TboPriceBreakUp {
  CurrencyCode?: string;
  RoomRate?: number;
  RoomTax?: number;
  RoomExtraGuestCharges?: number;
  RoomChildCharges?: number;
  ServiceFee?: number;
  AgentCommission?: number;
  TaxBreakup?: TboTaxBreakup[];
}

interface TboBaseCurrencyPrice {
  CurrencyCode?: string;
  RoomPrice?: number;
  Tax?: number;
  PublishedPrice?: number;
  OfferedPrice?: number;
  OfferedPriceRoundedOff?: number;
  AgentCommission?: number;
  TotalGSTAmount?: number;
}

interface TboCancelPolicy {
  Charge?: number;
  CancellationCharge?: number;
  ChargeType?: number;
  Currency?: string;
  FromDate?: string;
  ToDate?: string;
}

interface TboPassenger {
  PaxId?: number;
  Age?: number;
  Email?: string | null;
  Title?: string;
  FirstName?: string;
  MiddleName?: string | null;
  LastName?: string;
  PaxType?: number;
  LeadPassenger?: boolean;
  Phoneno?: string | null;
  PassportNo?: string | null;
  PassportIssueDate?: string | null;
  PassportExpDate?: string | null;
  PAN?: string | null;
  GSTCompanyName?: string | null;
  GSTNumber?: string | null;
  GSTCompanyEmail?: string | null;
  GSTCompanyAddress?: string | null;
  GSTCompanyContactNumber?: string | null;
}

interface TboBookingRoom {
  AdultCount?: number;
  ChildCount?: number;
  RoomId?: number;
  RoomIndex?: number;
  RoomTypeCode?: string;
  RoomTypeName?: string;
  RatePlanCode?: string;
  RoomDescription?: string;
  SmokingPreference?: string;
  RoomStatus?: number;
  AvailabilityType?: string;
  RequireAllPaxDetails?: boolean;
  IsPerStay?: boolean;
  HotelPassenger?: TboPassenger[];
  DayRates?: Array<{ Amount: number; Date: string }>;
  PriceBreakUp?: TboPriceBreakUp;
  BaseCurrencyPrice?: TboBaseCurrencyPrice;
  CancelPolicies?: TboCancelPolicy[];
  CancellationPolicy?: string;
  LastCancellationDate?: string;
  LastVoucherDate?: string;
  RoomPromotion?: string[];
  Amenities?: string[];
  Amenity?: string[];
  Supplements?: unknown;
  Inclusion?: string;
}

interface TboBookingHistory {
  BookingId?: number;
  CreatedBy?: number;
  CreatedByName?: string;
  CreatedOn?: string;
  EventCategory?: number;
  LastModifiedBy?: number;
  LastModifiedByName?: string;
  LastModifiedOn?: string;
  Remarks?: string;
}

interface TboGetBookingDetailResult {
  VoucherStatus?: boolean;
  ResponseStatus?: number;
  Error?: { ErrorCode: number; ErrorMessage: string };
  TraceId?: string;
  Status?: number;
  HotelBookingStatus?: string;
  ConfirmationNo?: string;
  BookingRefNo?: string;
  BookingId?: number | null;
  IsPriceChanged?: boolean;
  IsCancellationPolicyChanged?: boolean;
  Rooms?: TboBookingRoom[];
  NetAmount?: number;
  NetTax?: number;
  InvoiceAmount?: number;
  InvoiceNo?: string;
  InvoiceCreatedOn?: string;
  HotelConfirmationNo?: string | null;
  HotelCode?: string;
  TBOHotelCode?: string;
  HotelId?: number;
  HotelName?: string;
  StarRating?: number;
  AddressLine1?: string;
  AddressLine2?: string;
  City?: string;
  CityId?: number;
  CountryCode?: string;
  Latitude?: string;
  Longitude?: string;
  CheckInDate?: string;
  CheckOutDate?: string;
  BookingDate?: string;
  NoOfRooms?: number;
  IsDomestic?: boolean;
  BookingSource?: string;
  GuestNationality?: string;
  AgentRemarks?: string;
  LastCancellationDeadline?: string;
  LastVoucherDate?: string;
  BookingHistory?: TboBookingHistory[];
  BookingAllowedForRoamer?: boolean;
}

interface TboGetBookingDetailResponse {
  GetBookingDetailResult?: TboGetBookingDetailResult;
}

// ─── Public output shapes ─────────────────────────────────────────────────────

export interface BookingPassenger {
  paxId?: number;
  title?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  phoneNo?: string;
  paxType: number;
  leadPassenger: boolean;
  age?: number;
  passportNo?: string;
  passportIssueDate?: string;
  passportExpDate?: string;
  pan?: string;
}

export interface BookingRoomDayRate {
  amount: number;
  date: string;
}

export interface BookingRoomCancelPolicy {
  charge?: number;
  chargeType?: number;
  currency?: string;
  fromDate?: string;
  toDate?: string;
}

export interface BookingRoomPriceBreakUp {
  currencyCode?: string;
  roomRate?: number;
  roomTax?: number;
  serviceFee?: number;
  agentCommission?: number;
  taxBreakup?: Array<{ taxType: string; taxAmount: number }>;
}

export interface BookingRoom {
  roomId?: number;
  roomIndex?: number;
  roomTypeCode?: string;
  roomTypeName?: string;
  ratePlanCode?: string;
  adultCount: number;
  childCount: number;
  passengers: BookingPassenger[];
  dayRates: BookingRoomDayRate[];
  priceBreakUp?: BookingRoomPriceBreakUp;
  cancelPolicies: BookingRoomCancelPolicy[];
  cancellationPolicy?: string;
  lastCancellationDate?: string;
  roomPromotion?: string[];
  amenities: string[];
  inclusion?: string;
  isPerStay?: boolean;
}

export interface BookingHistoryEntry {
  bookingId?: number;
  createdByName?: string;
  createdOn?: string;
  eventCategory?: number;
  remarks?: string;
}

export type BookingDetailStatus = "Confirmed" | "BookFailed" | "VerifyPrice" | "Cancelled" | "Unknown";

export interface HotelBookingDetailResult {
  // Status
  bookingId: number | null;
  confirmationNo: string;
  bookingRefNo: string;
  invoiceNo: string;
  invoiceAmount?: number;
  invoiceCreatedOn?: string;
  hotelConfirmationNo?: string;
  status: number;
  bookingStatus: BookingDetailStatus;
  voucherStatus: boolean;
  isPriceChanged: boolean;
  isCancellationPolicyChanged: boolean;
  // Hotel info
  hotelCode?: string;
  tboHotelCode?: string;
  hotelName?: string;
  starRating?: number;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  countryCode?: string;
  latitude?: string;
  longitude?: string;
  checkInDate?: string;
  checkOutDate?: string;
  bookingDate?: string;
  noOfRooms?: number;
  isDomestic?: boolean;
  guestNationality?: string;
  // Financials
  netAmount?: number;
  netTax?: number;
  // Rooms
  rooms: BookingRoom[];
  // Metadata
  lastCancellationDeadline?: string;
  bookingSource?: string;
  agentRemarks?: string;
  bookingHistory: BookingHistoryEntry[];
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

const DETAIL_STATUS_BY_NAME: Partial<Record<string, BookingDetailStatus>> = {
  Confirmed: "Confirmed",
  BookFailed: "BookFailed",
  VerifyPrice: "VerifyPrice",
  Cancelled: "Cancelled",
};

const DETAIL_STATUS_BY_CODE: Partial<Record<number, BookingDetailStatus>> = {
  1: "Confirmed",
  0: "BookFailed",
  3: "VerifyPrice",
  6: "Cancelled",
};

function mapStatus(raw: string | undefined, code: number | undefined): BookingDetailStatus {
  return (raw && DETAIL_STATUS_BY_NAME[raw]) ?? (code !== undefined && DETAIL_STATUS_BY_CODE[code]) ?? "Unknown";
}

function mapPassengers(raw: TboPassenger[] | undefined): BookingPassenger[] {
  if (!raw) return [];
  return raw.map((p) => ({
    paxId: p.PaxId,
    title: p.Title,
    firstName: p.FirstName ?? "",
    middleName: p.MiddleName ?? undefined,
    lastName: p.LastName ?? "",
    email: p.Email ?? undefined,
    phoneNo: p.Phoneno ?? undefined,
    paxType: p.PaxType ?? 1,
    leadPassenger: p.LeadPassenger ?? false,
    age: p.Age,
    passportNo: p.PassportNo ?? undefined,
    passportIssueDate: p.PassportIssueDate ?? undefined,
    passportExpDate: p.PassportExpDate ?? undefined,
    pan: p.PAN ?? undefined,
  }));
}

function mapRoom(r: TboBookingRoom): BookingRoom {
  // Merge Amenities (inclusions string) and Amenity (detailed array)
  const amenities: string[] = [];
  if (r.Amenity && r.Amenity.length > 0) amenities.push(...r.Amenity);
  else if (r.Amenities && r.Amenities.length > 0) amenities.push(...r.Amenities);

  return {
    roomId: r.RoomId,
    roomIndex: r.RoomIndex,
    roomTypeCode: r.RoomTypeCode,
    roomTypeName: r.RoomTypeName,
    ratePlanCode: r.RatePlanCode,
    adultCount: r.AdultCount ?? 0,
    childCount: r.ChildCount ?? 0,
    passengers: mapPassengers(r.HotelPassenger),
    dayRates: (r.DayRates ?? []).map((d) => ({ amount: d.Amount, date: d.Date })),
    priceBreakUp: r.PriceBreakUp
      ? {
          currencyCode: r.PriceBreakUp.CurrencyCode,
          roomRate: r.PriceBreakUp.RoomRate,
          roomTax: r.PriceBreakUp.RoomTax,
          serviceFee: r.PriceBreakUp.ServiceFee,
          agentCommission: r.PriceBreakUp.AgentCommission,
          taxBreakup: r.PriceBreakUp.TaxBreakup?.map((t) => ({
            taxType: t.TaxType,
            taxAmount: t.TaxAmount,
          })),
        }
      : undefined,
    cancelPolicies: (r.CancelPolicies ?? []).map((p) => ({
      charge: p.Charge,
      chargeType: p.ChargeType,
      currency: p.Currency,
      fromDate: p.FromDate,
      toDate: p.ToDate,
    })),
    cancellationPolicy: r.CancellationPolicy,
    lastCancellationDate: r.LastCancellationDate,
    roomPromotion: (r.RoomPromotion ?? []).filter(Boolean),
    amenities,
    inclusion: r.Inclusion,
    isPerStay: r.IsPerStay,
  };
}

function mapHistory(raw: TboBookingHistory[] | undefined): BookingHistoryEntry[] {
  if (!raw) return [];
  return raw.map((h) => ({
    bookingId: h.BookingId,
    createdByName: h.CreatedByName,
    createdOn: h.CreatedOn,
    eventCategory: h.EventCategory,
    remarks: h.Remarks,
  }));
}

// ─── Input ────────────────────────────────────────────────────────────────────

export interface GetBookingDetailInput {
  // Option 1: by BookingId (fastest, recommended)
  bookingId?: number | string;
  // Option 2: by ConfirmationNo + guest name
  confirmationNo?: string;
  firstName?: string;
  lastName?: string;
  // Option 3: by TraceId
  traceId?: string;
  // Optional
  clientReferenceNo?: string;
  endUserIp?: string;
}

// ─── Public function ──────────────────────────────────────────────────────────

export async function tboGetHotelBookingDetail(
  input: GetBookingDetailInput,
): Promise<HotelBookingDetailResult> {
  if (!input.bookingId && !input.confirmationNo && !input.traceId) {
    throw new Error("Provide at least one of: bookingId, confirmationNo, or traceId.");
  }
  if (input.confirmationNo && (!input.firstName || !input.lastName)) {
    throw new Error("firstName and lastName are required when looking up by confirmationNo.");
  }

  const reqBody: Record<string, unknown> = {
    EndUserIp: input.endUserIp ?? process.env.TBO_END_USER_IP ?? "1.1.1.1",
  };
  if (input.bookingId !== undefined) reqBody.BookingId = input.bookingId;
  if (input.confirmationNo) {
    reqBody.ConfirmationNo = input.confirmationNo;
    reqBody.FirstName = input.firstName;
    reqBody.LastName = input.lastName;
  }
  if (input.traceId) reqBody.TraceId = input.traceId;
  if (input.clientReferenceNo) reqBody.ClientReferenceNo = input.clientReferenceNo;

  logRequest("Hotel GetBookingDetail", TBO_BOOKING_URL, reqBody);

  let res: Response;
  try {
    res = await fetch(TBO_BOOKING_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: basicAuthHeader(),
      },
      body: JSON.stringify(reqBody),
      cache: "no-store",
    });
  } catch (err) {
    logError("Hotel GetBookingDetail", err);
    throw err;
  }

  const text = await res.text();
  let data: TboGetBookingDetailResponse;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `TBO GetBookingDetail non-JSON (HTTP ${res.status}) from ${TBO_BOOKING_URL}: ${text.slice(0, 200)}`,
    );
  }

  logResponse("Hotel GetBookingDetail", res.status, {
    Status: data.GetBookingDetailResult?.Status,
    HotelBookingStatus: data.GetBookingDetailResult?.HotelBookingStatus,
    BookingId: data.GetBookingDetailResult?.BookingId,
  });

  if (!res.ok) throw new Error(`TBO GetBookingDetail HTTP ${res.status}`);
  assertTboSuccess(data.GetBookingDetailResult?.Error);

  const r = data.GetBookingDetailResult;
  if (!r) throw new Error("TBO GetBookingDetail returned empty result");

  return {
    bookingId: r.BookingId ?? null,
    confirmationNo: r.ConfirmationNo ?? "",
    bookingRefNo: r.BookingRefNo ?? "",
    invoiceNo: r.InvoiceNo ?? "",
    invoiceAmount: r.InvoiceAmount,
    invoiceCreatedOn: r.InvoiceCreatedOn,
    hotelConfirmationNo: r.HotelConfirmationNo ?? undefined,
    status: r.Status ?? 0,
    bookingStatus: mapStatus(r.HotelBookingStatus, r.Status),
    voucherStatus: r.VoucherStatus ?? false,
    isPriceChanged: r.IsPriceChanged ?? false,
    isCancellationPolicyChanged: r.IsCancellationPolicyChanged ?? false,
    hotelCode: r.HotelCode,
    tboHotelCode: r.TBOHotelCode,
    hotelName: r.HotelName,
    starRating: r.StarRating,
    addressLine1: r.AddressLine1,
    addressLine2: r.AddressLine2,
    city: r.City,
    countryCode: r.CountryCode,
    latitude: r.Latitude,
    longitude: r.Longitude,
    checkInDate: r.CheckInDate,
    checkOutDate: r.CheckOutDate,
    bookingDate: r.BookingDate,
    noOfRooms: r.NoOfRooms,
    isDomestic: r.IsDomestic,
    guestNationality: r.GuestNationality,
    netAmount: r.NetAmount,
    netTax: r.NetTax,
    rooms: (r.Rooms ?? []).map(mapRoom),
    lastCancellationDeadline: r.LastCancellationDeadline,
    bookingSource: r.BookingSource,
    agentRemarks: r.AgentRemarks,
    bookingHistory: mapHistory(r.BookingHistory),
  };
}
