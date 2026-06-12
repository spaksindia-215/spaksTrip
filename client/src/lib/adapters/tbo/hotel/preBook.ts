import "server-only";
import { logRequest, logResponse, logError } from "../log";
import { assertTboSuccess } from "../errors";
import { basicAuthHeader, mapCancelPolicies, mapSupplements, type TboSearchCancelPolicy, type TboSupplement, type DistributionType } from "./hotelUtils";
import type { CancelPolicy } from "@/lib/mock/hotels";

// Endpoint: POST {TBOHolidays}/PreBook (Basic Auth, agency creds).
// BookingCode comes from Search response Room.BookingCode.
// Must be called before Book to lock in the rate and retrieve validation rules.

const TBO_HOLIDAYS_URL = (
  process.env.TBO_HOLIDAYS_SEARCH_URL ??
  process.env.TBO_HOLIDAYS_HOTEL_API_URL ??
  "https://affiliate.tektravels.com/HotelAPI"
).replace(/\/$/, "");

// ─── Raw TBO response shapes ──────────────────────────────────────────────────

type TboPreBookCancelPolicy = TboSearchCancelPolicy;

interface TboPreBookTaxBreakup {
  TaxType: number;
  TaxableAmount: number;
  TaxPercentage: number;
  TaxAmount: number;
}

interface TboPreBookRoom {
  Name?: string[];
  BookingCode: string;
  Inclusion?: string;
  DayRates?: Array<Array<{ BasePrice: number }>>;
  TotalFare: number;
  TotalTax?: number;
  ExtraGuestCharges?: number;
  RecommendedSellingRate?: string;
  RoomPromotion?: string[] | string[][];
  CancelPolicies?: TboPreBookCancelPolicy[];
  MealType?: string;
  IsRefundable: boolean;
  WithTransfers?: boolean;
  Amenities?: string[];
  // Mandatory supplements (paid at hotel, may be in hotel's local currency)
  Supplements?: TboSupplement[];
  // Validation fields returned by PreBook (not in Search)
  PanMandatory?: boolean;
  PassportMandatory?: boolean;
  CorporateBookingAllowed?: boolean;
  PanCountRequired?: number;
  SamePaxNameAllowed?: boolean;
  SpaceAllowed?: boolean;
  SpecialCharAllowed?: boolean;
  PaxNameMinLength?: number;
  PaxNameMaxLength?: number;
  CharLimit?: boolean;
  PackageFare?: boolean;
  PackageDetailsMandatory?: boolean;
  DepartureDetailsMandatory?: boolean;
  GSTAllowed?: boolean;
  // Pricing detail
  RoomRate?: number;
  RoomTax?: number;
  RoomExtraGuestCharges?: number;
  RoomChildCharges?: number;
  ServiceFee?: number;
  AgentCommission?: number;
  TaxBreakup?: TboPreBookTaxBreakup[];
  NetAmount?: number;
  NetTax?: number;
}

interface TboPreBookHotel {
  HotelCode: string;
  Currency?: string;
  Rooms?: TboPreBookRoom[];
  RateConditions?: string[];
}

interface TboPreBookValidationInfo {
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

interface TboPreBookResponse {
  Status?: { Code: number; Description: string };
  HotelResult?: TboPreBookHotel[];
  ValidationInfo?: TboPreBookValidationInfo;
  Error?: { ErrorCode: number; ErrorMessage: string };
}

// ─── Public output shapes ─────────────────────────────────────────────────────

export interface PreBookValidationInfo {
  panMandatory: boolean;
  passportMandatory: boolean;
  corporateBookingAllowed: boolean;
  panCountRequired: number;
  samePaxNameAllowed: boolean;
  spaceAllowed: boolean;
  specialCharAllowed: boolean;
  paxNameMinLength: number;
  paxNameMaxLength: number;
  charLimit: boolean;
  packageFare: boolean;
  packageDetailsMandatory: boolean;
  departureDetailsMandatory: boolean;
  gstAllowed: boolean;
}

export interface PreBookRoom {
  name: string[];
  bookingCode: string;
  inclusion?: string;
  dayRates: Array<Array<{ basePrice: number }>>;
  totalFare: number;
  totalTax: number;
  extraGuestCharges?: number;
  recommendedSellingRate?: string;
  roomPromotion?: string[];
  cancelPolicies: CancelPolicy[];
  mealType?: string;
  isRefundable: boolean;
  withTransfers: boolean;
  amenities: string[];
  // Mandatory supplements (paid directly at hotel, may be in hotel's local currency)
  supplements?: Array<{ index: string; type: string; description: string; price: number; currency: string }>;
  // Per-room validation (subset that may differ per room)
  panMandatory: boolean;
  passportMandatory: boolean;
  corporateBookingAllowed: boolean;
  gstAllowed: boolean;
  packageFare: boolean;
  packageDetailsMandatory: boolean;
  departureDetailsMandatory: boolean;
  paxNameMinLength: number;
  paxNameMaxLength: number;
  samePaxNameAllowed: boolean;
  spaceAllowed: boolean;
  specialCharAllowed: boolean;
  // Pricing detail
  roomRate?: number;
  roomTax?: number;
  serviceFee?: number;
  agentCommission?: number;
  netAmount?: number;
  netTax?: number;
}

export interface HotelPreBookResult {
  hotelCode: string;
  currency: string;
  rooms: PreBookRoom[];
  rateConditions: string[];
  validationInfo: PreBookValidationInfo;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapDayRates(
  raw: Array<Array<{ BasePrice: number }>> | undefined,
): Array<Array<{ basePrice: number }>> {
  if (!raw) return [];
  return raw.map((day) => day.map((d) => ({ basePrice: d.BasePrice })));
}

function flattenPromotion(raw: string[] | string[][] | undefined): string[] {
  if (!raw) return [];
  if (raw.length === 0) return [];
  if (Array.isArray(raw[0])) return (raw as string[][]).flat().filter(Boolean);
  return (raw as string[]).filter(Boolean);
}

function mapRoom(r: TboPreBookRoom): PreBookRoom {
  return {
    name: r.Name ?? [],
    bookingCode: r.BookingCode,
    inclusion: r.Inclusion,
    dayRates: mapDayRates(r.DayRates),
    totalFare: r.TotalFare,
    totalTax: r.TotalTax ?? 0,
    extraGuestCharges: r.ExtraGuestCharges,
    recommendedSellingRate: r.RecommendedSellingRate,
    roomPromotion: flattenPromotion(r.RoomPromotion),
    cancelPolicies: mapCancelPolicies(r.CancelPolicies),
    mealType: r.MealType,
    isRefundable: r.IsRefundable,
    withTransfers: r.WithTransfers ?? false,
    amenities: r.Amenities ?? [],
    supplements: r.Supplements ? mapSupplements(r.Supplements) : undefined,
    panMandatory: r.PanMandatory ?? false,
    passportMandatory: r.PassportMandatory ?? false,
    corporateBookingAllowed: r.CorporateBookingAllowed ?? false,
    gstAllowed: r.GSTAllowed ?? false,
    packageFare: r.PackageFare ?? false,
    packageDetailsMandatory: r.PackageDetailsMandatory ?? false,
    departureDetailsMandatory: r.DepartureDetailsMandatory ?? false,
    paxNameMinLength: r.PaxNameMinLength ?? 0,
    paxNameMaxLength: r.PaxNameMaxLength ?? 50,
    samePaxNameAllowed: r.SamePaxNameAllowed ?? true,
    spaceAllowed: r.SpaceAllowed ?? true,
    specialCharAllowed: r.SpecialCharAllowed ?? false,
    roomRate: r.RoomRate,
    roomTax: r.RoomTax,
    serviceFee: r.ServiceFee,
    agentCommission: r.AgentCommission,
    netAmount: r.NetAmount,
    netTax: r.NetTax,
  };
}

function mapValidationInfo(raw: TboPreBookValidationInfo | undefined): PreBookValidationInfo {
  return {
    panMandatory: raw?.PanMandatory ?? false,
    passportMandatory: raw?.PassportMandatory ?? false,
    corporateBookingAllowed: raw?.CorporateBookingAllowed ?? false,
    panCountRequired: raw?.PanCountRequired ?? 0,
    samePaxNameAllowed: raw?.SamePaxNameAllowed ?? true,
    spaceAllowed: raw?.SpaceAllowed ?? true,
    specialCharAllowed: raw?.SpecialCharAllowed ?? false,
    paxNameMinLength: raw?.PaxNameMinLength ?? 0,
    paxNameMaxLength: raw?.PaxNameMaxLength ?? 50,
    charLimit: raw?.CharLimit ?? false,
    packageFare: raw?.PackageFare ?? false,
    packageDetailsMandatory: raw?.PackageDetailsMandatory ?? false,
    departureDetailsMandatory: raw?.DepartureDetailsMandatory ?? false,
    gstAllowed: raw?.GSTAllowed ?? false,
  };
}

// ─── Public function ──────────────────────────────────────────────────────────

export interface HotelPreBookInput {
  bookingCode: string;
  paymentMode?: string;
  distributionType?: DistributionType;
}

export async function tboPreBookHotel(
  input: HotelPreBookInput,
): Promise<HotelPreBookResult> {
  const url = `${TBO_HOLIDAYS_URL}/PreBook`;
  const reqBody = {
    BookingCode: input.bookingCode,
    PaymentMode: input.paymentMode ?? "Limit",
  };

  logRequest("Hotel PreBook", url, reqBody);

  const distributionType = input.distributionType ?? "b2c";
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: basicAuthHeader(distributionType),
      },
      body: JSON.stringify(reqBody),
      cache: "no-store",
    });
  } catch (err) {
    logError("Hotel PreBook", err);
    throw err;
  }

  const text = await res.text();
  let data: TboPreBookResponse;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `TBO PreBook non-JSON (HTTP ${res.status}) from ${url}: ${text.slice(0, 200)}`,
    );
  }

  logResponse("Hotel PreBook", res.status, {
    Status: data.Status,
    HotelCode: data.HotelResult?.[0]?.HotelCode,
    Rooms: data.HotelResult?.[0]?.Rooms?.length ?? 0,
  });

  if (!res.ok) throw new Error(`TBO PreBook HTTP ${res.status}`);
  assertTboSuccess(data.Error);

  if (data.Status && data.Status.Code !== 200) {
    throw new Error(
      `TBO PreBook status ${data.Status.Code}: ${data.Status.Description}`,
    );
  }

  const hotelResult = data.HotelResult?.[0];
  if (!hotelResult) {
    throw new Error("TBO PreBook returned no HotelResult");
  }

  const mappedRooms = (hotelResult.Rooms ?? []).map(mapRoom);

  // Refundable status audit — log every room returned from prebook
  for (const room of mappedRooms) {
    const lastCancellationDate = room.cancelPolicies?.[0]?.fromDate ?? null;
    console.log("[REFUNDABLE_AUDIT][PreBook]", {
      HotelCode: hotelResult.HotelCode,
      BookingCode: room.bookingCode,
      IsRefundable: room.isRefundable,
      LastCancellationDate: lastCancellationDate,
    });
  }

  return {
    hotelCode: hotelResult.HotelCode,
    currency: hotelResult.Currency ?? "INR",
    rooms: mappedRooms,
    rateConditions: hotelResult.RateConditions ?? [],
    validationInfo: mapValidationInfo(data.ValidationInfo),
  };
}
