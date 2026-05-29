import "server-only";
import { logRequest, logResponse, logError } from "../log";
import { assertTboSuccess } from "../errors";
import { fetchWithTimeout, isTimeoutError } from "../timeout";

// Endpoint: POST https://HotelBE.tektravels.com/hotelservice.svc/rest/SendChangeRequest
// Endpoint: POST https://HotelBE.tektravels.com/hotelservice.svc/rest/GetChangeRequestStatus
// Auth: Basic Auth — same agency credentials as Book / GenerateVoucher / GetBookingDetail.
// SendChangeRequest initiates a cancel or change on a hold/vouchered booking.
// GetChangeRequestStatus request takes only ChangeRequestId + EndUserIp (no BookingId per doc).
// Response fields: RefundAmount / CancellationCharge — available once ChangeRequestStatus=Processed(3).
// Note: TBO's method-structure doc uses "RefundAmount"; JSON sample uses "RefundedAmount" — both handled.

const BASE = (
  process.env.TBO_HOLIDAYS_BOOK_URL
    ? process.env.TBO_HOLIDAYS_BOOK_URL.replace(/\/[^/]+$/, "")
    : "https://HotelBE.tektravels.com/hotelservice.svc/rest"
).replace(/\/$/, "");

const TBO_SEND_CHANGE_URL = `${BASE}/SendChangeRequest`;
const TBO_GET_CHANGE_STATUS_URL = `${BASE}/GetChangeRequestStatus`;

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

// ─── RequestType enum ─────────────────────────────────────────────────────────

export const ChangeRequestType = {
  HotelCancel: 4,
} as const;
export type ChangeRequestType = (typeof ChangeRequestType)[keyof typeof ChangeRequestType];

// ─── ChangeRequestStatus enum ─────────────────────────────────────────────────

export type ChangeRequestStatus = "NotSet" | "Pending" | "InProgress" | "Processed" | "Rejected";

function mapChangeRequestStatus(code: number | undefined): ChangeRequestStatus {
  if (code === 1) return "Pending";
  if (code === 2) return "InProgress";
  if (code === 3) return "Processed";
  if (code === 4) return "Rejected";
  return "NotSet";
}

// ─── Raw TBO shapes ───────────────────────────────────────────────────────────

interface TboChangeRequestError {
  ErrorCode: number;
  ErrorMessage: string;
}

interface TboHotelChangeRequestResult {
  ChangeRequestStatus?: number;
  ResponseStatus?: number;
  Error?: TboChangeRequestError;
  TraceId?: string;
  ChangeRequestId?: number | null;
}

interface TboSendChangeRequestResponse {
  HotelChangeRequestResult?: TboHotelChangeRequestResult;
}

interface TboGetChangeRequestStatusResult {
  ChangeRequestStatus?: number;
  ResponseStatus?: number;
  Error?: TboChangeRequestError;
  TraceId?: string;
  ChangeRequestId?: number | null;
  // Method-structure doc says "RefundAmount"; JSON sample says "RefundedAmount" — accept both
  RefundAmount?: number;
  RefundedAmount?: number;
  CancellationCharge?: number;
}

interface TboGetChangeRequestStatusResponse {
  GetChangeRequestStatusResponse?: TboGetChangeRequestStatusResult;
}

// ─── Public input / output shapes ────────────────────────────────────────────

export interface SendChangeRequestInput {
  bookingId: number;
  requestType: ChangeRequestType;
  remarks?: string;
  endUserIp?: string;
}

export interface SendChangeRequestResult {
  changeRequestId: number | null;
  changeRequestStatus: ChangeRequestStatus;
  responseStatus: number;
  traceId?: string;
}

export interface GetChangeRequestStatusInput {
  changeRequestId: number;
  endUserIp?: string;
}

export interface GetChangeRequestStatusResult {
  changeRequestId: number | null;
  changeRequestStatus: ChangeRequestStatus;
  responseStatus: number;
  refundAmount?: number;
  cancellationCharge?: number;
  traceId?: string;
}

// ─── Public functions ─────────────────────────────────────────────────────────

export async function tboSendChangeRequest(
  input: SendChangeRequestInput,
): Promise<SendChangeRequestResult> {
  const reqBody = {
    BookingMode: 5,
    RequestType: input.requestType,
    Remarks: input.remarks ?? "",
    BookingId: input.bookingId,
    EndUserIp: input.endUserIp ?? process.env.TBO_END_USER_IP ?? "1.1.1.1",
  };

  logRequest("Hotel SendChangeRequest", TBO_SEND_CHANGE_URL, reqBody);

  let res: Response;
  try {
    // Use 120 second timeout for cancel request per TBO recommendation
    res = await fetchWithTimeout(TBO_SEND_CHANGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: basicAuthHeader(),
      },
      body: JSON.stringify(reqBody),
      cache: "no-store",
      timeoutMs: 120000, // TBO cancel cutoff: 120 seconds
    });
  } catch (err) {
    if (isTimeoutError(err)) {
      logError(
        "Hotel SendChangeRequest",
        new Error(
          `Cancel request timed out (120 seconds). Booking may or may not be cancelled. ` +
          `Recommend verifying via BookingDetail API with bookingId: ${input.bookingId}`
        )
      );
    }
    logError("Hotel SendChangeRequest", err);
    throw err;
  }

  const text = await res.text();
  let data: TboSendChangeRequestResponse;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `TBO SendChangeRequest non-JSON (HTTP ${res.status}) from ${TBO_SEND_CHANGE_URL}: ${text.slice(0, 200)}`,
    );
  }

  const r = data.HotelChangeRequestResult;

  logResponse("Hotel SendChangeRequest", res.status, {
    ChangeRequestStatus: r?.ChangeRequestStatus,
    ResponseStatus: r?.ResponseStatus,
    ChangeRequestId: r?.ChangeRequestId,
  });

  if (!res.ok) throw new Error(`TBO SendChangeRequest HTTP ${res.status}`);
  assertTboSuccess(r?.Error);

  if (!r) throw new Error("TBO SendChangeRequest returned empty result");

  return {
    changeRequestId: r.ChangeRequestId ?? null,
    changeRequestStatus: mapChangeRequestStatus(r.ChangeRequestStatus),
    responseStatus: r.ResponseStatus ?? 0,
    traceId: r.TraceId,
  };
}

export async function tboGetChangeRequestStatus(
  input: GetChangeRequestStatusInput,
): Promise<GetChangeRequestStatusResult> {
  const reqBody = {
    ChangeRequestId: input.changeRequestId,
    EndUserIp: input.endUserIp ?? process.env.TBO_END_USER_IP ?? "1.1.1.1",
  };

  logRequest("Hotel GetChangeRequestStatus", TBO_GET_CHANGE_STATUS_URL, reqBody);

  let res: Response;
  try {
    res = await fetch(TBO_GET_CHANGE_STATUS_URL, {
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
    logError("Hotel GetChangeRequestStatus", err);
    throw err;
  }

  const text = await res.text();
  let data: TboGetChangeRequestStatusResponse;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `TBO GetChangeRequestStatus non-JSON (HTTP ${res.status}) from ${TBO_GET_CHANGE_STATUS_URL}: ${text.slice(0, 200)}`,
    );
  }

  const r = data.GetChangeRequestStatusResponse;

  logResponse("Hotel GetChangeRequestStatus", res.status, {
    ChangeRequestStatus: r?.ChangeRequestStatus,
    ResponseStatus: r?.ResponseStatus,
    RefundAmount: r?.RefundAmount ?? r?.RefundedAmount,
    CancellationCharge: r?.CancellationCharge,
  });

  if (!res.ok) throw new Error(`TBO GetChangeRequestStatus HTTP ${res.status}`);
  assertTboSuccess(r?.Error);

  if (!r) throw new Error("TBO GetChangeRequestStatus returned empty result");

  return {
    changeRequestId: r.ChangeRequestId ?? null,
    changeRequestStatus: mapChangeRequestStatus(r.ChangeRequestStatus),
    responseStatus: r.ResponseStatus ?? 0,
    refundAmount: r.RefundAmount ?? r.RefundedAmount,
    cancellationCharge: r.CancellationCharge,
    traceId: r.TraceId,
  };
}
