import {
  TboSearchResponse,
  TboPreBookResponse,
  TboBookResponse,
  TboVoucherResponse,
  TboGetBookingDetailResponse,
  CaseConfig,
} from "./types";

export class ValidationError extends Error {
  constructor(
    public step: string,
    message: string
  ) {
    super(`[${step}] ${message}`);
    this.name = "ValidationError";
  }
}

// ─── Search Validation ────────────────────────────────────────────────────────

export function validateSearchResponse(
  res: TboSearchResponse,
  caseConfig: CaseConfig
): void {
  if (res.Error?.ErrorCode && res.Error.ErrorCode !== 0) {
    throw new ValidationError(
      "Search",
      `TBO error ${res.Error.ErrorCode}: ${res.Error.ErrorMessage}`
    );
  }

  if (res.Status && res.Status.Code !== 200 && res.Status.Code !== 201) {
    throw new ValidationError(
      "Search",
      `Unexpected status code ${res.Status.Code}: ${res.Status.Description}`
    );
  }

  if (!res.HotelResult || res.HotelResult.length === 0) {
    throw new ValidationError(
      "Search",
      `No hotels found for city ${caseConfig.cityCode}. Try a different city code or date.`
    );
  }

  const hotelsWithRooms = res.HotelResult.filter((h) => h.Rooms?.length > 0);
  if (hotelsWithRooms.length === 0) {
    throw new ValidationError(
      "Search",
      "Hotels found but none have available rooms."
    );
  }
}

// ─── PreBook Validation ───────────────────────────────────────────────────────

export function validatePreBookResponse(res: TboPreBookResponse): void {
  if (res.Error?.ErrorCode && res.Error.ErrorCode !== 0) {
    throw new ValidationError(
      "PreBook",
      `TBO error ${res.Error.ErrorCode}: ${res.Error.ErrorMessage}`
    );
  }

  if (res.Status && res.Status.Code !== 200) {
    throw new ValidationError(
      "PreBook",
      `Unexpected status ${res.Status.Code}: ${res.Status.Description ?? ""}`
    );
  }

  const hotel = res.HotelResult?.[0];
  if (!hotel) {
    throw new ValidationError("PreBook", "No HotelResult in PreBook response.");
  }

  const rooms = hotel.Rooms;
  if (!rooms || rooms.length === 0) {
    throw new ValidationError("PreBook", "No rooms in PreBook HotelResult.");
  }

  const firstRoom = rooms[0];
  if (!firstRoom.BookingCode) {
    throw new ValidationError("PreBook", "PreBook room missing BookingCode.");
  }

  const netAmount = firstRoom.NetAmount ?? firstRoom.TotalFare;
  if (!netAmount || netAmount <= 0) {
    throw new ValidationError(
      "PreBook",
      `Invalid net amount: ${netAmount}. Cannot proceed to Book.`
    );
  }
}

// ─── Book Validation ──────────────────────────────────────────────────────────

export function validateBookResponse(res: TboBookResponse): void {
  const result = res.BookResult;
  if (!result) {
    throw new ValidationError("Book", "No BookResult in response.");
  }

  if (result.Error?.ErrorCode && result.Error.ErrorCode !== 0) {
    throw new ValidationError(
      "Book",
      `TBO error ${result.Error.ErrorCode}: ${result.Error.ErrorMessage}`
    );
  }

  const status = result.HotelBookingStatus ?? "";
  if (status === "BookFailed") {
    throw new ValidationError("Book", "Booking failed — status: BookFailed.");
  }

  if (status === "VerifyPrice") {
    throw new ValidationError(
      "Book",
      `Price changed since PreBook. Updated amount: ${result.NetAmount ?? "unknown"}. Re-run PreBook.`
    );
  }

  if (!result.BookingId) {
    throw new ValidationError("Book", "No BookingId returned in Book response.");
  }
}

// ─── Voucher Validation ───────────────────────────────────────────────────────

export function validateVoucherResponse(res: TboVoucherResponse): void {
  const result = res.GenerateVoucherResult;
  if (!result) {
    throw new ValidationError("Voucher", "No GenerateVoucherResult in response.");
  }

  const errCode = result.Error?.ErrorCode;
  if (errCode !== undefined && errCode !== null && Number(errCode) !== 0) {
    // Error 2 = "HotelVoucher already generated" — expected when IsVoucherBooking=true
    // was passed to Book. TBO already created the voucher; this call is a status check.
    if (Number(errCode) === 2) return;

    throw new ValidationError(
      "Voucher",
      `TBO error ${errCode}: ${result.Error?.ErrorMessage ?? "unknown"}`
    );
  }

  if (result.HotelBookingStatus === "BookFailed") {
    throw new ValidationError("Voucher", "Voucher generation failed.");
  }
}

// ─── Booking Detail Validation ────────────────────────────────────────────────

export function validateGetBookingDetailResponse(
  res: TboGetBookingDetailResponse,
  expectedBookingId: number
): void {
  const result = res.GetBookingDetailResult;
  if (!result) {
    throw new ValidationError(
      "GetBookingDetail",
      "No GetBookingDetailResult in response."
    );
  }

  if (result.Error?.ErrorCode && result.Error.ErrorCode !== 0) {
    throw new ValidationError(
      "GetBookingDetail",
      `TBO error ${result.Error.ErrorCode}: ${result.Error.ErrorMessage}`
    );
  }

  if (result.BookingId !== expectedBookingId) {
    throw new ValidationError(
      "GetBookingDetail",
      `BookingId mismatch: expected ${expectedBookingId}, got ${result.BookingId}`
    );
  }
}

// ─── Pax Configuration Validation ────────────────────────────────────────────

export function validateCaseConfig(caseConfig: CaseConfig): void {
  if (caseConfig.rooms.length === 0) {
    throw new ValidationError(
      "Config",
      `Case ${caseConfig.caseNumber}: No rooms defined.`
    );
  }

  for (const [i, room] of caseConfig.rooms.entries()) {
    const roomLabel = `Room ${i + 1}`;

    if (room.adults < 1) {
      throw new ValidationError(
        "Config",
        `${roomLabel}: At least 1 adult required.`
      );
    }

    if (room.children !== room.childAges.length) {
      throw new ValidationError(
        "Config",
        `${roomLabel}: children count (${room.children}) must match childAges length (${room.childAges.length}).`
      );
    }

    for (const age of room.childAges) {
      if (age < 0 || age > 17) {
        throw new ValidationError(
          "Config",
          `${roomLabel}: child age ${age} is out of range (0–17).`
        );
      }
    }

    const leads = room.passengers.filter((p) => p.leadPassenger).length;
    if (leads !== 1) {
      throw new ValidationError(
        "Config",
        `${roomLabel}: exactly 1 lead passenger required, found ${leads}.`
      );
    }

    const adultPax = room.passengers.filter((p) => p.paxType === 1).length;
    if (adultPax !== room.adults) {
      throw new ValidationError(
        "Config",
        `${roomLabel}: adults declared (${room.adults}) != adult passengers (${adultPax}).`
      );
    }

    const childPax = room.passengers.filter((p) => p.paxType === 2).length;
    if (childPax !== room.children) {
      throw new ValidationError(
        "Config",
        `${roomLabel}: children declared (${room.children}) != child passengers (${childPax}).`
      );
    }
  }
}
