import {
  CaseConfig,
  RoomSpec,
  TboSearchRequest,
  TboSearchResponse,
  TboPreBookRequest,
  TboPreBookResponse,
  TboBookRequest,
  TboBookResponse,
  TboVoucherRequest,
  TboVoucherResponse,
  TboGetBookingDetailResponse,
  TboHotelCodeListResponse,
  TboHotelCodeItem,
  TboPassenger,
  TboRoomDetail,
  BookingFlowResult,
} from "./types";
import { config } from "./config";
import { tboPost, sleep } from "./tboClient";
import { CaseLogger } from "./logger";
import {
  ValidationError,
  validateSearchResponse,
  validatePreBookResponse,
  validateBookResponse,
  validateVoucherResponse,
  validateGetBookingDetailResponse,
  validateCaseConfig,
} from "./validator";

// ─── Candidate hotel for booking ──────────────────────────────────────────────

type Candidate = {
  hotelCode: string;
  bookingCode: string;
  totalFare: number;
  isRefundable: boolean;
  currency: string;
};

// ─── Hotel Code List ──────────────────────────────────────────────────────────

async function fetchAllHotelCodes(
  cityCode: string,
  logger: CaseLogger
): Promise<TboHotelCodeItem[]> {
  logger.log(`Fetching hotel codes for city: ${cityCode}`);

  const res = await tboPost<{ CityCode: string }, TboHotelCodeListResponse>(
    config.hotelCodeListUrl,
    { CityCode: cityCode },
    "HotelCodeList",
    true
  );

  const list = res.Hotels ?? res.HotelCodeList ?? [];

  if (list.length === 0) {
    throw new Error(
      `No hotel codes found for city ${cityCode}. Check DOMESTIC_CITY_CODE / INTERNATIONAL_CITY_CODE.`
    );
  }

  logger.log(`Found ${list.length} hotel(s) for city ${cityCode}`);
  return list;
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

function getTestDates(daysAhead = 7): { checkIn: string; checkOut: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const now = new Date();
  const ci = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead);
  const co = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead + 1);
  return { checkIn: fmt(ci), checkOut: fmt(co) };
}

// ─── Passenger Builder ────────────────────────────────────────────────────────

function buildTboPassengers(
  room: RoomSpec,
  passportMandatory: boolean,
  panMandatory: boolean
): TboPassenger[] {
  // PAN format: 5 uppercase letters + 4 digits + 1 uppercase letter (e.g. ABCDE1234F)
  // Only adults need PAN; children don't have PANs.
  let panSeq = 1;
  return room.passengers.map((p, idx) => {
    // When PAN is mandatory, TBO requires it for all passengers (including children).
    // 4th char must be a valid taxpayer type — P = Individual (person).
    const pan = panMandatory ? `AAAPA${String(panSeq++).padStart(4, "0")}B` : null;
    return {
      Title: p.title,
      FirstName: p.firstName,
      MiddleName: "",
      LastName: p.lastName,
      Email: p.leadPassenger ? "test@spakstrip.com" : null,
      Phoneno: p.leadPassenger ? "9999999999" : null,
      PaxType: p.paxType,
      LeadPassenger: p.leadPassenger,
      Age: p.age ?? (p.paxType === 1 ? 30 : 8),
      PassportNo: passportMandatory ? `TEST${String(idx + 1).padStart(7, "0")}` : null,
      PassportIssueDate: null,
      PassportExpDate: passportMandatory ? "2030-12-31" : null,
      PAN: pan,
      PaxId: 0,
      GSTCompanyName: null,
      GSTNumber: null,
      GSTCompanyEmail: null,
      GSTCompanyAddress: null,
      GSTCompanyContactNumber: null,
    };
  });
}

// ─── Candidate selection ──────────────────────────────────────────────────────

function getAllCandidates(res: TboSearchResponse): Candidate[] {
  const hotels = res.HotelResult ?? [];
  const candidates: Candidate[] = [];

  for (const hotel of hotels) {
    if (!hotel.Rooms?.length) continue;
    const refRoom = hotel.Rooms.find((r) => r.IsRefundable);
    const room =
      refRoom ??
      hotel.Rooms.reduce(
        (min, r) => (r.TotalFare < min.TotalFare ? r : min),
        hotel.Rooms[0]
      );
    candidates.push({
      hotelCode: hotel.HotelCode,
      bookingCode: room.BookingCode,
      totalFare: room.TotalFare,
      isRefundable: room.IsRefundable,
      currency: hotel.Currency ?? "INR",
    });
  }

  // Refundable first, then cheapest
  return candidates.sort((a, b) => {
    if (a.isRefundable && !b.isRefundable) return -1;
    if (!a.isRefundable && b.isRefundable) return 1;
    return a.totalFare - b.totalFare;
  });
}

// ─── Hotel-level error detection ──────────────────────────────────────────────
// These errors mean "this particular hotel can't be booked, try the next one".
// They are distinct from fatal errors (bad credentials, invalid pax config, etc.)

function isHotelLevelError(err: unknown): boolean {
  if (!(err instanceof ValidationError)) return false;
  const msg = err.message;
  // PreBook 500 — supplier/TBO internal error for this property
  if (msg.includes("status 500")) return true;
  // PreBook 201 — no available rooms for this hotel/date/pax combination
  if (msg.includes("status 201")) return true;
  // Book: EAN/supplier NullReferenceException
  if (msg.includes("Error in Supplier Response")) return true;
  // Book: "Booking Under Cancellation can only be vouchered" — stale booking
  if (msg.includes("Booking Under Cancellation")) return true;
  return false;
}

// ─── Single-batch search ──────────────────────────────────────────────────────

async function searchBatch(
  codes: string[],
  caseConfig: CaseConfig,
  checkIn: string,
  checkOut: string,
  batchNum: number,
  logger: CaseLogger
): Promise<{
  searchRequest: TboSearchRequest;
  searchResponse: TboSearchResponse;
  candidates: Candidate[];
}> {
  const paxRooms = caseConfig.rooms.map((r) => ({
    Adults: r.adults,
    Children: r.children,
    ChildrenAges: r.childAges,
  }));

  const searchRequest: TboSearchRequest = {
    CheckIn: checkIn,
    CheckOut: checkOut,
    HotelCodes: codes.join(","),
    GuestNationality: caseConfig.guestNationality,
    PaxRooms: paxRooms,
    IsDetailedResponse: false,
    ResponseTime: 23,
  };

  const searchResponse = await tboPost<TboSearchRequest, TboSearchResponse>(
    config.searchUrl,
    searchRequest,
    `HotelSearch-batch${batchNum}`
  );

  const candidates = getAllCandidates(searchResponse);
  return { searchRequest, searchResponse, candidates };
}

// ─── Single hotel booking attempt ─────────────────────────────────────────────

async function attemptBookingForHotel(
  candidate: Candidate,
  caseConfig: CaseConfig,
  logger: CaseLogger
): Promise<{
  preBookRequest: TboPreBookRequest;
  preBookResponse: TboPreBookResponse;
  bookRequest: TboBookRequest;
  bookResponse: TboBookResponse;
  voucherRequest: TboVoucherRequest;
  voucherResponse: TboVoucherResponse;
  bookingDetailResponse: TboGetBookingDetailResponse;
  bookingId: number;
  confirmationNo: string | null;
  bookingRefNo: string | null;
  bookingStatus: string;
  voucherStatus: boolean;
  hotelName: string | null;
}> {
  // ── PreBook ────────────────────────────────────────────────────────────────
  logger.log(`Step 3: Hotel PreBook (hotel ${candidate.hotelCode})...`);

  const preBookRequest: TboPreBookRequest = {
    BookingCode: candidate.bookingCode,
    PaymentMode: "Limit",
  };
  logger.saveJson("prebook-request.json", preBookRequest);

  const preBookResponse = await tboPost<TboPreBookRequest, TboPreBookResponse>(
    config.preBookUrl,
    preBookRequest,
    "HotelPreBook"
  );
  logger.saveJson("prebook-response.json", preBookResponse);

  validatePreBookResponse(preBookResponse);

  const preBookRoom = preBookResponse.HotelResult![0].Rooms![0];
  const finalBookingCode = preBookRoom.BookingCode;
  const netAmount = preBookRoom.NetAmount ?? preBookRoom.TotalFare;
  const passportMandatory = preBookRoom.PassportMandatory ?? false;
  // Check both room-level and ValidationInfo-level PAN mandatory
  const panMandatory =
    (preBookRoom.PanMandatory ?? false) ||
    (preBookResponse.ValidationInfo?.PanMandatory ?? false);

  logger.log(
    `PreBook OK | NetAmount: ${netAmount} | PassportRequired: ${passportMandatory} | PANRequired: ${panMandatory}`
  );

  await sleep(config.stepDelay);

  // ── Book ───────────────────────────────────────────────────────────────────
  logger.log("Step 4: Hotel Book...");

  const hotelRoomsDetails: TboRoomDetail[] = caseConfig.rooms.map((room) => ({
    HotelPassenger: buildTboPassengers(room, passportMandatory, panMandatory),
  }));

  const bookRequest: TboBookRequest = {
    BookingCode: finalBookingCode,
    IsVoucherBooking: true,
    GuestNationality: caseConfig.guestNationality,
    EndUserIp: config.endUserIp,
    NetAmount: netAmount,
    RequestedBookingMode: 5,
    HotelRoomsDetails: hotelRoomsDetails,
    ClientReferenceId: `CERT-CASE-${caseConfig.caseNumber}-${Date.now()}`,
  };
  logger.saveJson("booking-request.json", bookRequest);

  const bookResponse = await tboPost<TboBookRequest, TboBookResponse>(
    config.bookUrl,
    bookRequest,
    "HotelBook"
  );
  logger.saveJson("booking-response.json", bookResponse);

  validateBookResponse(bookResponse);

  const bookingId = bookResponse.BookResult!.BookingId!;
  const confirmationNo = bookResponse.BookResult!.ConfirmationNo ?? null;
  const bookingRefNo = bookResponse.BookResult!.BookingRefNo ?? null;
  const bookingStatus = bookResponse.BookResult!.HotelBookingStatus ?? "Unknown";

  logger.log(
    `Booking Confirmed | ID: ${bookingId} | Conf: ${confirmationNo} | Status: ${bookingStatus}`
  );

  await sleep(config.stepDelay);

  // ── Generate Voucher ───────────────────────────────────────────────────────
  logger.log("Step 5: Generate Voucher...");

  const voucherRequest: TboVoucherRequest = {
    BookingId: bookingId,
    EndUserIp: config.endUserIp,
  };
  logger.saveJson("voucher-request.json", voucherRequest);

  const voucherResponse = await tboPost<TboVoucherRequest, TboVoucherResponse>(
    config.voucherUrl,
    voucherRequest,
    "GenerateVoucher"
  );
  logger.saveJson("voucher-response.json", voucherResponse);

  validateVoucherResponse(voucherResponse); // Error 2 = already vouchered = OK

  const voucherStatus = voucherResponse.GenerateVoucherResult?.VoucherStatus ?? false;
  logger.log(`Voucher Status: ${voucherStatus ? "Generated" : "Already generated (status refresh)"}`);

  await sleep(config.stepDelay);

  // ── Get Booking Details ────────────────────────────────────────────────────
  logger.log("Step 6: Get Booking Details...");

  const bookingDetailResponse = await tboPost<
    { BookingId: number; EndUserIp: string },
    TboGetBookingDetailResponse
  >(
    config.bookingDetailUrl,
    { BookingId: bookingId, EndUserIp: config.endUserIp },
    "GetBookingDetail"
  );
  logger.saveJson("booking-detail-response.json", bookingDetailResponse);

  validateGetBookingDetailResponse(bookingDetailResponse, bookingId);

  const hotelName =
    bookingDetailResponse.GetBookingDetailResult?.HotelName ?? null;
  logger.log(`Hotel Name: ${hotelName ?? "N/A"}`);

  return {
    preBookRequest,
    preBookResponse,
    bookRequest,
    bookResponse,
    voucherRequest,
    voucherResponse,
    bookingDetailResponse,
    bookingId,
    confirmationNo,
    bookingRefNo,
    bookingStatus,
    voucherStatus,
    hotelName,
  };
}

// ─── Main Booking Flow ────────────────────────────────────────────────────────

export async function runBookingFlow(
  caseConfig: CaseConfig,
  logger: CaseLogger
): Promise<BookingFlowResult> {
  const timestamp = new Date().toISOString();

  validateCaseConfig(caseConfig);

  // Cases with children need a longer lead time: EAN rejects same-week child
  // rates with "Error in Supplier Response". Use 30 days ahead and search all
  // available hotel codes (not capped at 600) to find a non-EAN supplier.
  const hasChildren = caseConfig.rooms.some((r) => r.children > 0);
  const daysAhead = hasChildren ? 30 : 7;

  const { checkIn, checkOut } = getTestDates(daysAhead);
  logger.log(`Check-in: ${checkIn} | Check-out: ${checkOut}${hasChildren ? " (30-day lead for child rates)" : ""}`);

  // ── Step 1: Fetch Hotel Codes ───────────────────────────────────────────────
  logger.log("Step 1: Fetching hotel codes...");
  const allCodes = await fetchAllHotelCodes(caseConfig.cityCode, logger);
  await sleep(config.stepDelay);

  // ── Steps 2–6: Search batches + hotel-level retry in one combined loop ─────
  // When all hotels in a search batch fail with hotel-level errors (e.g. EAN
  // supplier NullReferenceException), we don't give up — we search the next
  // batch of hotel codes and keep trying.

  const batchSize = config.maxHotelCodesPerSearch;
  // For child cases, search every code available — don't cap at 600.
  // Child-rate failures are supplier-specific (EAN), so we need to find
  // a hotel from a different supplier, which may be further in the list.
  const maxTotal = hasChildren
    ? allCodes.length
    : Math.min(config.maxHotelCodesTotal, allCodes.length);

  const allSkipped: string[] = [];
  let firstSearchRequest: TboSearchRequest | null = null;
  let firstSearchResponse: TboSearchResponse | null = null;
  let totalBatches = 0;

  for (let offset = 0; offset < maxTotal; offset += batchSize) {
    const batch = allCodes
      .slice(offset, offset + batchSize)
      .map((h) => h.TBOHotelCode ?? h.HotelCode ?? "")
      .filter(Boolean);

    if (batch.length === 0) break;

    const batchNum = Math.floor(offset / batchSize) + 1;
    totalBatches = batchNum;

    logger.log(
      `Step 2 (batch ${batchNum}): Searching codes ${offset + 1}–${offset + batch.length} of ${Math.min(maxTotal, allCodes.length)}...`
    );

    const { searchRequest, searchResponse, candidates } = await searchBatch(
      batch,
      caseConfig,
      checkIn,
      checkOut,
      batchNum,
      logger
    );

    // Persist first batch's search request/response for the certification log
    if (!firstSearchRequest) {
      firstSearchRequest = searchRequest;
      firstSearchResponse = searchResponse;
      logger.saveJson("search-request.json", searchRequest);
      logger.saveJson("search-response.json", searchResponse);
    }

    if (candidates.length === 0) {
      logger.log(`Batch ${batchNum}: no hotels with available rooms — trying next batch...`);
      await sleep(config.stepDelay);
      continue;
    }

    logger.log(
      `Batch ${batchNum}: ${candidates.length} candidate hotel(s). ` +
        `Top: ${candidates[0].hotelCode} | Refundable: ${candidates[0].isRefundable} | ` +
        `Rate: ${candidates[0].currency} ${candidates[0].totalFare}`
    );

    await sleep(config.stepDelay);

    // ── Try each candidate hotel in this batch ────────────────────────────────
    const batchSkipped: string[] = [];

    for (const candidate of candidates) {
      try {
        const result = await attemptBookingForHotel(candidate, caseConfig, logger);

        return {
          caseNumber: caseConfig.caseNumber,
          caseName: caseConfig.name,
          hotelCode: candidate.hotelCode,
          searchRequest: firstSearchRequest!,
          searchResponse: firstSearchResponse!,
          preBookRequest: result.preBookRequest,
          preBookResponse: result.preBookResponse,
          bookRequest: result.bookRequest,
          bookResponse: result.bookResponse,
          voucherRequest: result.voucherRequest,
          voucherResponse: result.voucherResponse,
          bookingDetailResponse: result.bookingDetailResponse,
          bookingId: result.bookingId,
          confirmationNo: result.confirmationNo,
          bookingRefNo: result.bookingRefNo,
          hotelName: result.hotelName,
          bookingStatus: result.bookingStatus,
          voucherStatus: result.voucherStatus,
          success: true,
          timestamp,
        };
      } catch (err) {
        if (isHotelLevelError(err)) {
          const reason = err instanceof Error ? err.message.slice(0, 80) : String(err);
          logger.log(`Hotel ${candidate.hotelCode} skipped: ${reason}. Trying next...`);
          batchSkipped.push(candidate.hotelCode);
          allSkipped.push(candidate.hotelCode);
          await sleep(config.stepDelay);
          continue;
        }
        // Fatal error — propagate immediately
        throw err;
      }
    }

    // All hotels in this batch failed — search next batch
    logger.log(
      `Batch ${batchNum}: all ${batchSkipped.length} hotel(s) skipped [${batchSkipped.join(", ")}]. ` +
        `Searching next batch...`
    );
    await sleep(config.stepDelay);
  }

  throw new Error(
    `All candidate hotels exhausted across ${totalBatches} search batch(es) for city ${caseConfig.cityCode}. ` +
      `Total skipped: ${allSkipped.length} hotel(s) [${allSkipped.join(", ")}]. ` +
      `Try a different city code or check account limits.`
  );
}
