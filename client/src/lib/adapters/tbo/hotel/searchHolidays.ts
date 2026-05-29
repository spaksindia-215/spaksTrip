import "server-only";
import { logRequest, logResponse, logError } from "../log";
import { assertTboSuccess, TboNoResultsError } from "../errors";
import { tboGetHotelCodeListByCity } from "./tboHotelCodeList";
import {
  basicAuthHeader,
  mapAmenities,
  mapRoomType,
  mapBedType,
  mapCancelPolicies,
  mapSupplements,
  type TboSearchCancelPolicy,
  type TboSupplement,
  type DistributionType,
} from "./hotelUtils";
import type { Hotel, Room, HotelSearchInput, Supplement } from "@/lib/mock/hotels";
import type { TboHotelCodeListItem, TboHotelRatingEnum } from "../types";

// TBOHolidays HotelSearch — POST {base}/HotelSearch (Basic Auth, agency creds).
// Replaces the legacy CityId-based HotelAPI search. The TBOHolidays product
// is HotelCodes-based, so the flow supports two search modes:
//   MODE 1 - City-based (default):
//     1. tboGetHotelCodeListByCity(cityCode)  — cached 15d, gives metadata + codes
//     2. POST /HotelSearch with HotelCodes batches  — live pricing
//   MODE 2 - Hotel code-based (direct):
//     1. Use provided hotelCodes directly (single or multiple)
//     2. POST /HotelSearch with HotelCodes batches  — live pricing
// Search/PreBook/Book require the AGENCY credential pair, NOT the
// public test creds used for static-data endpoints.

const TBO_HOLIDAYS_URL =
  (process.env.TBO_HOLIDAYS_SEARCH_URL ?? process.env.TBO_HOLIDAYS_HOTEL_API_URL ?? "https://affiliate.tektravels.com/HotelAPI").replace(/\/$/, "");

// TBO won't accept arbitrarily large code lists in one HotelSearch call.
// TBO recommends max 100 codes per request for optimal latency and reliability.
// Multiple parallel requests are preferred over larger batches.
// Filters (StarRating, MealType, Refundable, NoOfRooms) are always sent to TBO
// for server-side filtering to reduce response payload and improve performance.
// NoOfRooms: restricts the number of room types returned per hotel (e.g., 2 = show only top 2 rooms per hotel).
const HOTEL_CODES_PER_BATCH = 100;
const MAX_HOTELS_PER_SEARCH = 200;

type TboCancelPolicy = TboSearchCancelPolicy;

// TboSupplement is now imported from hotelUtils to avoid duplication

interface TboHolidaysSearchRoom {
  BookingCode: string;
  Name?: string[];
  // DayRates: outer array = rooms, inner array = days, each with BasePrice
  DayRates?: Array<Array<{ BasePrice: number }>>;
  TotalFare: number;
  TotalTax?: number;
  ExtraGuestCharges?: number;
  RecommendedSellingRate?: string;
  Inclusion?: string;
  RoomPromotion?: string[][];
  CancelPolicies?: TboCancelPolicy[];
  MealType?: string;
  IsRefundable: boolean;
  WithTransfers?: boolean;
  Supplements?: TboSupplement[][];
  RoomID?: string[];
}

interface TboHolidaysSearchHotel {
  HotelCode: string;
  Currency?: string;
  Rooms: TboHolidaysSearchRoom[];
}

interface TboHolidaysHotelSearchResponse {
  Status?: { Code: number; Description: string };
  HotelResult?: TboHolidaysSearchHotel[];
  Error?: { ErrorCode: number; ErrorMessage: string };
}

type TboHotelSearchResult = {
  hotels: Hotel[];
  minPrice: number;
  maxPrice: number;
};

function mapSearchRoom(r: TboHolidaysSearchRoom): Room {
  const name = r.Name?.[0] ?? "Room";
  // Per-night base rate: first day of DayRates for the first room dimension
  const nightlyRate = r.DayRates?.[0]?.[0]?.BasePrice;
  // Flatten all room-promotion strings from the nested array
  const roomPromotion = r.RoomPromotion?.flat().filter(Boolean);
  const rsp = r.RecommendedSellingRate ? Number(r.RecommendedSellingRate) : undefined;
  // B2C rule: display price = RSP when present; never expose TotalFare (net/wholesale) directly
  const displayPrice = (rsp && rsp > 0) ? rsp : r.TotalFare;
  return {
    id: r.BookingCode,
    name,
    type: mapRoomType(name),
    maxOccupancy: 2,
    bedType: mapBedType(name),
    sizeSqm: 0,
    basePrice: displayPrice,
    amenities: r.Inclusion ? mapAmenities([r.Inclusion]) : [],
    refundable: r.IsRefundable,
    breakfast: (r.MealType ?? "").toLowerCase().includes("breakfast"),
    seatsLeft: 5,
    // TBO-specific enrichments
    totalFare: r.TotalFare,
    totalTax: r.TotalTax,
    nightlyRate: Number.isFinite(nightlyRate) ? nightlyRate : undefined,
    recommendedSellingRate: (rsp && rsp > 0) ? rsp : undefined,
    cancelPolicies: mapCancelPolicies(r.CancelPolicies),
    // Mandatory supplements (paid at hotel, may be in hotel's local currency)
    supplements: r.Supplements && r.Supplements.length > 0
      ? mapSupplements(r.Supplements.flat())
      : undefined,
    roomPromotion: roomPromotion && roomPromotion.length > 0 ? roomPromotion : undefined,
    roomId: r.RoomID,
    mealType: r.MealType,
  };
}

function parseStarRating(rating: TboHotelRatingEnum | undefined): Hotel["starRating"] {
  switch (rating) {
    case "FiveStar": return 5;
    case "FourStar": return 4;
    case "ThreeStar": return 3;
    case "TwoStar": return 2;
    case "OneStar": return 2; // Hotel.starRating min is 2
    default: return 3;
  }
}

function buildHotel(
  searchHotel: TboHolidaysSearchHotel,
  meta: TboHotelCodeListItem | undefined,
  cityName: string,
  countryName: string,
  noOfRoomsFilter?: number,
): Hotel {
  let rooms = (searchHotel.Rooms ?? []).map(mapSearchRoom);
  // Restrict room types per hotel if NoOfRooms filter is set
  if (noOfRoomsFilter && noOfRoomsFilter > 0) {
    rooms = rooms.slice(0, noOfRoomsFilter);
  }
  const lowestPrice =
    rooms.length > 0 ? Math.min(...rooms.map((r) => r.basePrice)) : 0;
  const stars = parseStarRating(meta?.HotelRating);
  const lat = meta?.Latitude ? Number(meta.Latitude) : undefined;
  const lng = meta?.Longitude ? Number(meta.Longitude) : undefined;
  return {
    id: searchHotel.HotelCode,
    name: meta?.HotelName ?? "Hotel",
    chain: undefined,
    starRating: stars,
    reviewScore: 0,
    reviewCount: 0,
    reviewLabel: "",
    city: meta?.CityName ?? cityName,
    country: meta?.CountryName ?? countryName,
    address: meta?.Address ?? "",
    images: meta?.Images ?? [],
    amenities: meta?.HotelFacilities
      ? mapAmenities(meta.HotelFacilities.split(/[,;|]/))
      : [],
    rooms,
    reviews: [],
    lowestPrice,
    propertyType: "hotel",
    latitude: Number.isFinite(lat) ? lat : undefined,
    longitude: Number.isFinite(lng) ? lng : undefined,
    description: meta?.Description,
  };
}

function emptyHotelSearchResult(): TboHotelSearchResult {
  return {
    hotels: [],
    minPrice: 0,
    maxPrice: 0,
  };
}

export async function tboSearchHotelsHolidays(
  input: HotelSearchInput,
): Promise<TboHotelSearchResult> {
  // Step 1: Get hotel codes — either from city or from explicit hotelCodes array
  let codeList: TboHotelCodeListItem[];
  let candidateCodes: string[];
  const isHotelCodeSearch = !!(input.hotelCodes && input.hotelCodes.length > 0);

  if (isHotelCodeSearch) {
    // Hotel code-based search: use provided codes directly (single or multiple)
    candidateCodes = input.hotelCodes!.slice(0, MAX_HOTELS_PER_SEARCH);
    console.log(`[TBO HotelSearch] MODE: Hotel codes (${candidateCodes.length} codes)`);

    // Minimal metadata stubs for direct hotel code searches
    // TBO will return full details in the search response
    codeList = candidateCodes.map((code) => ({
      HotelCode: code,
      HotelName: code, // Fallback to code if name not available
    } as TboHotelCodeListItem));
  } else if (input.cityCode) {
    // City-based search: fetch all codes for the city (cached 15 days)
    console.log(`[TBO HotelSearch] MODE: City-based (${input.cityCode})`);
    try {
      codeList = await tboGetHotelCodeListByCity(input.cityCode);
    } catch (error) {
      if (error instanceof TboNoResultsError) {
        return emptyHotelSearchResult();
      }
      throw error;
    }
    candidateCodes = codeList
      .slice(0, MAX_HOTELS_PER_SEARCH)
      .map((h) => h.HotelCode);
  } else {
    throw new Error("Either cityCode or hotelCodes must be provided");
  }

  const metaByCode = new Map<string, TboHotelCodeListItem>();
  for (const item of codeList) metaByCode.set(item.HotelCode, item);

  // Step 2: PaxRooms split.
  const rooms = Math.max(1, input.rooms);
  const adultsPerRoom = Math.max(1, Math.ceil(input.adults / rooms));
  const childrenPerRoom = Math.max(0, Math.ceil(input.children / rooms));

  // Distribute children ages across rooms (TBO requires actual ages 0-17 for pricing)
  const childrenAges = input.childrenAges ?? [];
  const paxRooms = Array.from({ length: rooms }, (_, roomIdx) => {
    const startIdx = roomIdx * childrenPerRoom;
    const endIdx = Math.min(startIdx + childrenPerRoom, childrenAges.length);
    const roomChildrenAges = childrenAges.slice(startIdx, endIdx);

    return {
      Adults: adultsPerRoom,
      Children: childrenPerRoom,
      ChildrenAges: roomChildrenAges, // Actual ages for each child (0-17)
    };
  });

  const url = `${TBO_HOLIDAYS_URL}/Search`;
  const distributionType: DistributionType = input.distributionType ?? "b2c";
  const auth = basicAuthHeader(distributionType);

  // Step 3: Build batches (max 100 codes per batch, as per TBO recommendation).
  const batches: Array<{ batchNum: number; codes: string[] }> = [];
  for (let i = 0; i < candidateCodes.length; i += HOTEL_CODES_PER_BATCH) {
    batches.push({
      batchNum: Math.floor(i / HOTEL_CODES_PER_BATCH) + 1,
      codes: candidateCodes.slice(i, i + HOTEL_CODES_PER_BATCH),
    });
  }

  // Step 3b: Send all batches in parallel (TBO recommends parallel requests).
  // IsDetailedResponse=true ensures guests see complete hotel info before PreBook.
  // PreBook is final, so search must include all guest-critical details (facilities, policies, etc.)
  const batchResponses = await Promise.all(
    batches.map(async (batch) => {
      const f = input.filters;
      const reqBody = {
        CheckIn: input.checkIn,
        CheckOut: input.checkOut,
        HotelCodes: batch.codes.join(","),
        GuestNationality: input.guestNationality ?? "IN",
        PaxRooms: paxRooms,
        IsDetailedResponse: input.isDetailedResponse ?? true,
        ResponseTime: 23,
        Filters: {
          Refundable: f?.refundable ?? false,
          NoOfRooms: f?.noOfRooms ?? 0,
          MealType: f?.mealType ?? null,
          StarRating: f?.starRating ?? null,
        },
      };

      logRequest(`HotelSearch (batch ${batch.batchNum})`, url, {
        ...reqBody,
        HotelCodes: `[${batch.codes.length} codes]`,
      });

      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: auth,
          },
          body: JSON.stringify(reqBody),
          cache: "no-store",
        });
      } catch (err) {
        logError("HotelSearch", err);
        throw err;
      }

      const text = await res.text();
      let data: TboHolidaysHotelSearchResponse;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `TBO HotelSearch non-JSON (HTTP ${res.status}) from ${url}: ${text.slice(0, 200)}`,
        );
      }

      logResponse("HotelSearch", res.status, {
        Status: data.Status,
        Count: data.HotelResult?.length ?? 0,
      });

      if (!res.ok) throw new Error(`TBO HotelSearch HTTP ${res.status}`);
      assertTboSuccess(data.Error);

      // Status 201 = "no result" per TBO docs. Treat as empty batch, not error.
      if (data.Status && data.Status.Code !== 200) {
        console.warn(
          `[TBO] HotelSearch batch ${batch.batchNum} status ${data.Status.Code}: ${data.Status.Description}`,
        );
        return [];
      }

      return data.HotelResult ?? [];
    }),
  );

  const batchResults = batchResponses.flat();

  if (batchResults.length === 0) return emptyHotelSearchResult();

  // Step 4: Merge prices with metadata.
  const cityName = codeList[0]?.CityName ?? "";
  const countryName = codeList[0]?.CountryName ?? "";
  const hotels = batchResults
    .map((h) => buildHotel(h, metaByCode.get(h.HotelCode), cityName, countryName, input.filters?.noOfRooms))
    .filter((h) => h.rooms.length > 0);

  if (hotels.length === 0) return emptyHotelSearchResult();

  const prices = hotels.map((h) => h.lowestPrice).filter((p) => p > 0);
  return {
    hotels,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
  };
}
