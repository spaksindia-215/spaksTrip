import "server-only";
import { logRequest, logResponse, logError } from "../log";
import { assertTboSuccess, TboBookingFailedError } from "../errors";

// Endpoint: POST https://HotelBE.tektravels.com/hotelservice.svc/rest/GenerateVoucher
// Auth: Basic Auth — same agency credentials as Search / PreBook / Book.
// Called after a successful Book to voucher (confirm) the booking.
// If IsVoucherBooking=true was passed to Book the voucher is already generated
// and this call is a no-op / status refresh. Use it when IsVoucherBooking=false.
// PAN-based variant is needed when PreBook.PanMandatory=true and PAN was not
// supplied at booking time (some properties require PAN at the vouchering stage).

const TBO_VOUCHER_URL = (
  process.env.TBO_HOLIDAYS_BOOK_URL
    ? process.env.TBO_HOLIDAYS_BOOK_URL.replace(/\/[^/]+$/, "/GenerateVoucher")
    : "https://HotelBE.tektravels.com/hotelservice.svc/rest/GenerateVoucher"
).replace(/\/$/, "");

function basicAuthHeader(): string {
  const user = process.env.TBO_HOLIDAYS_USER_NAME;
  const pass = process.env.TBO_HOLIDAYS_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      "TBO Holidays agency credentials missing. Set TBO_HOLIDAYS_USER_NAME and TBO_HOLIDAYS_PASSWORD in .env.local",
    );
  }
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

// ─── Raw TBO response shape ───────────────────────────────────────────────────

interface TboGenerateVoucherResult {
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
}

interface TboGenerateVoucherResponse {
  GenerateVoucherResult?: TboGenerateVoucherResult;
}

// ─── Input / Output shapes ────────────────────────────────────────────────────

export interface VoucherPassenger {
  paxId: number;
  pan: string;
}

export interface VoucherRoomDetails {
  passengers: VoucherPassenger[];
}

export interface GenerateVoucherInput {
  bookingId: number;
  endUserIp?: string;
  isCorporate?: boolean;
  // Only required when PreBook.panMandatory=true and PAN was deferred to voucher
  roomsDetails?: VoucherRoomDetails[];
}

export type VoucherBookingStatus = "Confirmed" | "BookFailed" | "VerifyPrice" | "Cancelled" | "Unknown";

export interface GenerateVoucherResult {
  bookingId: number | null;
  bookingRefNo: string;
  confirmationNo: string;
  invoiceNumber: string;
  status: number;
  bookingStatus: VoucherBookingStatus;
  voucherStatus: boolean;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapStatus(raw: string | undefined, code: number | undefined): VoucherBookingStatus {
  if (raw === "Confirmed" || code === 1) return "Confirmed";
  if (raw === "BookFailed" || code === 0) return "BookFailed";
  if (raw === "VerifyPrice" || code === 3) return "VerifyPrice";
  if (raw === "Cancelled" || code === 6) return "Cancelled";
  return "Unknown";
}

// ─── Public function ──────────────────────────────────────────────────────────

export async function tboGenerateVoucher(
  input: GenerateVoucherInput,
): Promise<GenerateVoucherResult> {
  const reqBody: Record<string, unknown> = {
    BookingId: input.bookingId,
    EndUserIp: input.endUserIp ?? process.env.TBO_END_USER_IP ?? "1.1.1.1",
  };

  if (input.isCorporate !== undefined) {
    reqBody.IsCorporate = String(input.isCorporate);
  }

  if (input.roomsDetails && input.roomsDetails.length > 0) {
    reqBody.HotelRoomsDetails = input.roomsDetails.map((room) => ({
      HotelPassenger: room.passengers.map((p) => ({
        PaxId: String(p.paxId),
        PAN: p.pan,
      })),
    }));
  }

  logRequest("Hotel GenerateVoucher", TBO_VOUCHER_URL, reqBody);

  let res: Response;
  try {
    res = await fetch(TBO_VOUCHER_URL, {
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
    logError("Hotel GenerateVoucher", err);
    throw err;
  }

  const text = await res.text();
  let data: TboGenerateVoucherResponse;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `TBO GenerateVoucher non-JSON (HTTP ${res.status}) from ${TBO_VOUCHER_URL}: ${text.slice(0, 200)}`,
    );
  }

  logResponse("Hotel GenerateVoucher", res.status, {
    Status: data.GenerateVoucherResult?.Status,
    HotelBookingStatus: data.GenerateVoucherResult?.HotelBookingStatus,
    VoucherStatus: data.GenerateVoucherResult?.VoucherStatus,
    BookingId: data.GenerateVoucherResult?.BookingId,
  });

  if (!res.ok) throw new Error(`TBO GenerateVoucher HTTP ${res.status}`);
  assertTboSuccess(data.GenerateVoucherResult?.Error);

  const r = data.GenerateVoucherResult;
  if (!r) throw new Error("TBO GenerateVoucher returned empty result");

  const bookingStatus = mapStatus(r.HotelBookingStatus, r.Status);

  if (bookingStatus === "BookFailed" || bookingStatus === "Unknown") {
    throw new TboBookingFailedError(
      `GenerateVoucher returned status "${r.HotelBookingStatus ?? bookingStatus}"`,
    );
  }

  return {
    bookingId: r.BookingId ?? null,
    bookingRefNo: r.BookingRefNo ?? "",
    confirmationNo: r.ConfirmationNo ?? "",
    invoiceNumber: r.InvoiceNumber ?? "",
    status: r.Status ?? 0,
    bookingStatus,
    voucherStatus: r.VoucherStatus ?? false,
  };
}
