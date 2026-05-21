import "server-only";
import { logRequest, logResponse, logError } from "../log";
import { assertTboSuccess, TboBookingFailedError } from "../errors";
import { basicAuthHeader } from "./hotelUtils";

// Endpoint: POST https://HotelBE.tektravels.com/hotelservice.svc/rest/book/
// BookingCode must come from the PreBook response.
// NetAmount must match the PreBook response NetAmount exactly.
// Auth: Basic Auth with agency credentials (same pair as Search/PreBook).

const TBO_BOOK_URL = (
  process.env.TBO_HOLIDAYS_BOOK_URL ??
  "https://HotelBE.tektravels.com/hotelservice.svc/rest/book"
).replace(/\/$/, "");

// ─── Input shapes ─────────────────────────────────────────────────────────────

export interface HotelBookPassenger {
  title: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  phoneNo?: string;
  paxType: 1 | 2;          // 1 = Adult, 2 = Child
  leadPassenger: boolean;
  age?: number;             // required when paxType = 2 (Child, age ≤ 12)
  passportNo?: string;
  passportIssueDate?: string;
  passportExpDate?: string;
  pan?: string;
  gstCompanyName?: string;
  gstNumber?: string;
  gstCompanyEmail?: string;
  gstCompanyAddress?: string;
  gstCompanyContactNumber?: string;
}

export interface HotelBookRoomDetails {
  passengers: HotelBookPassenger[];
}

export interface HotelBookInput {
  bookingCode: string;              // from PreBook response room.bookingCode
  netAmount: number;                // from PreBook response room.netAmount or totalFare
  isVoucherBooking: boolean;        // true = voucher immediately, false = hold
  guestNationality?: string;        // ISO-2, default "IN"
  endUserIp?: string;               // end-user IP, default from env
  clientReferenceId?: string;       // optional reference for reconciliation
  roomsDetails: HotelBookRoomDetails[];
  isPackageFare?: boolean;          // mirror PackageFare from PreBook
  isPackageDetailsMandatory?: boolean;
  arrivalTransportType?: 0 | 1;    // 0 = Flight, 1 = Surface
  arrivalTransportInfoId?: string;
  arrivalTransportTime?: string;
}

// ─── Output shapes ────────────────────────────────────────────────────────────

export type HotelBookStatus =
  | "Confirmed"
  | "BookFailed"
  | "VerifyPrice"
  | "Cancelled"
  | "Unknown";

export interface HotelBookOutput {
  bookingId: number | null;
  bookingRefNo: string | null;
  confirmationNo: string | null;
  invoiceNumber: string | null;
  status: number;                       // 0=BookFailed 1=Confirmed 3=VerifyPrice 6=Cancelled
  bookingStatus: HotelBookStatus;
  voucherStatus: boolean;
  isPriceChanged: boolean;
  isCancellationPolicyChanged: boolean;
  updatedNetAmount?: number;            // populated when status=3 (VerifyPrice)
}

// ─── Raw TBO response shape ───────────────────────────────────────────────────

interface TboBookResult {
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

interface TboBookResponse {
  BookResult?: TboBookResult;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

const STATUS_BY_NAME: Partial<Record<string, HotelBookStatus>> = {
  Confirmed: "Confirmed",
  BookFailed: "BookFailed",
  VerifyPrice: "VerifyPrice",
  Cancelled: "Cancelled",
};

const STATUS_BY_CODE: Partial<Record<number, HotelBookStatus>> = {
  1: "Confirmed",
  3: "VerifyPrice",
  6: "Cancelled",
};

function mapBookingStatus(raw: string | undefined, code: number | undefined): HotelBookStatus {
  return (raw && STATUS_BY_NAME[raw]) ?? (code !== undefined && STATUS_BY_CODE[code]) ?? "Unknown";
}

// ─── Public function ──────────────────────────────────────────────────────────

export async function tboBookHotel(input: HotelBookInput): Promise<HotelBookOutput> {
  const hotelPassengersByRoom = input.roomsDetails.map((room) => ({
    HotelPassenger: room.passengers.map((p) => ({
      Title: p.title,
      FirstName: p.firstName,
      MiddleName: p.middleName ?? "",
      LastName: p.lastName,
      Email: p.email ?? null,
      Phoneno: p.phoneNo ?? null,
      PaxType: p.paxType,
      LeadPassenger: p.leadPassenger,
      Age: p.age ?? 0,
      PassportNo: p.passportNo ?? null,
      PassportIssueDate: p.passportIssueDate ?? null,
      PassportExpDate: p.passportExpDate ?? null,
      PAN: p.pan ?? null,
      PaxId: 0,
      GSTCompanyName: p.gstCompanyName ?? null,
      GSTNumber: p.gstNumber ?? null,
      GSTCompanyEmail: p.gstCompanyEmail ?? null,
      GSTCompanyAddress: p.gstCompanyAddress ?? null,
      GSTCompanyContactNumber: p.gstCompanyContactNumber ?? null,
    })),
  }));

  const reqBody: Record<string, unknown> = {
    BookingCode: input.bookingCode,
    IsVoucherBooking: input.isVoucherBooking,
    GuestNationality: input.guestNationality ?? "IN",
    EndUserIp: input.endUserIp ?? process.env.TBO_END_USER_IP ?? "1.1.1.1",
    NetAmount: input.netAmount,
    RequestedBookingMode: 5,
    HotelRoomsDetails: hotelPassengersByRoom,
  };

  if (input.clientReferenceId) {
    reqBody.ClientReferenceId = input.clientReferenceId;
  }
  if (input.isPackageFare !== undefined) {
    reqBody.IsPackageFare = input.isPackageFare;
  }
  if (input.isPackageDetailsMandatory !== undefined) {
    reqBody.IsPackageDetailsMandatory = input.isPackageDetailsMandatory;
  }
  if (input.arrivalTransportType !== undefined) {
    reqBody.ArrivalTransport = {
      ArrivalTransportType: input.arrivalTransportType,
      TransportInfoId: input.arrivalTransportInfoId ?? "",
      Time: input.arrivalTransportTime ?? "0001-01-01T00:00:00",
    };
  }

  logRequest("Hotel Book", TBO_BOOK_URL, {
    ...reqBody,
    HotelRoomsDetails: `[${hotelPassengersByRoom.length} room(s), ${hotelPassengersByRoom.reduce((n, r) => n + r.HotelPassenger.length, 0)} passenger(s)]`,
  });

  let res: Response;
  try {
    res = await fetch(TBO_BOOK_URL, {
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
    logError("Hotel Book", err);
    throw err;
  }

  const text = await res.text();
  let data: TboBookResponse;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `TBO Book non-JSON (HTTP ${res.status}) from ${TBO_BOOK_URL}: ${text.slice(0, 200)}`,
    );
  }

  logResponse("Hotel Book", res.status, {
    Status: data.BookResult?.Status,
    HotelBookingStatus: data.BookResult?.HotelBookingStatus,
    BookingId: data.BookResult?.BookingId,
    IsPriceChanged: data.BookResult?.IsPriceChanged,
  });

  if (!res.ok) throw new Error(`TBO Book HTTP ${res.status}`);
  assertTboSuccess(data.BookResult?.Error);

  const r = data.BookResult;
  if (!r) throw new Error("TBO Book returned empty BookResult");

  const bookingStatus = mapBookingStatus(r.HotelBookingStatus, r.Status);

  // Status 3 = VerifyPrice — rate changed since PreBook; caller must re-prebook
  if (bookingStatus === "VerifyPrice") {
    throw new TboBookingFailedError(
      `Price or cancellation policy changed (VerifyPrice). Updated amount: ${r.NetAmount ?? "unknown"}. Please re-confirm with updated rate.`,
    );
  }

  if (bookingStatus === "BookFailed" || bookingStatus === "Unknown") {
    throw new TboBookingFailedError(
      `Booking returned status "${r.HotelBookingStatus ?? bookingStatus}"`,
    );
  }

  return {
    bookingId: r.BookingId ?? null,
    bookingRefNo: r.BookingRefNo ?? null,
    confirmationNo: r.ConfirmationNo ?? null,
    invoiceNumber: r.InvoiceNumber ?? null,
    status: r.Status ?? 0,
    bookingStatus,
    voucherStatus: r.VoucherStatus ?? false,
    isPriceChanged: r.IsPriceChanged ?? false,
    isCancellationPolicyChanged: r.IsCancellationPolicyChanged ?? false,
    updatedNetAmount: r.IsPriceChanged ? r.NetAmount : undefined,
  };
}
