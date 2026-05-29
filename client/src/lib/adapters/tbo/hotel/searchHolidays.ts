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
  type TboSearchCancelPolicy,
} from "./hotelUtils";
import type { Hotel, Room, HotelSearchInput } from "@/lib/mock/hotels";
import type { TboHotelCodeListItem, TboHotelRatingEnum } from "../types";

// TBOHolidays HotelSearch — POST {base}/HotelSearch (Basic Auth, agency creds).
// Replaces the legacy CityId-based HotelAPI search. The TBOHolidays product
// is HotelCodes-based, so the flow is:
//   1. tboGetHotelCodeListByCity(cityCode)  — cached 15d, gives metadata + codes
//   2. POST /HotelSearch with HotelCodes batches  — live pricing
// Search/PreBook/Book require the AGENCY credential pair, NOT the
// public test creds used for static-data endpoints.

const TBO_HOLIDAYS_URL =
  (process.env.TBO_HOLIDAYS_SEARCH_URL ?? process.env.TBO_HOLIDAYS_HOTEL_API_URL ?? "https://affiliate.tektravels.com/HotelAPI").replace(/\/$/, "");

// TBO won't accept arbitrarily large code lists in one HotelSearch call.
// TBO recommends max 100 codes per request for optimal latency and reliability.
// Multiple parallel requests are preferred over larger batches.
const HOTEL_CODES_PER_BATCH = 100;
const MAX_HOTELS_PER_SEARCH = 200;

type TboCancelPolicy = TboSearchCancelPolicy;

interface TboSupplement {
  Index: number;
  Type: string;
  Description: string;
  Price: number;
  Currency: string;
}

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
): Hotel {
  const rooms = (searchHotel.Rooms ?? []).map(mapSearchRoom);
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
  // Step 1: Hotel codes for the city (cached 15 days). Detailed=true so we get
  // hotel name/address/rating in the same call — search response itself only
  // returns prices keyed by HotelCode.
  let codeList: TboHotelCodeListItem[];
  try {
    codeList = await tboGetHotelCodeListByCity(input.cityCode);
  } catch (error) {
    if (error instanceof TboNoResultsError) {
      return emptyHotelSearchResult();
    }
    throw error;
  }

  const metaByCode = new Map<string, TboHotelCodeListItem>();
  for (const item of codeList) metaByCode.set(item.HotelCode, item);

  const candidateCodes = codeList
    .slice(0, MAX_HOTELS_PER_SEARCH)
    .map((h) => h.HotelCode);

  // Step 2: PaxRooms split.
  const rooms = Math.max(1, input.rooms);
  const adultsPerRoom = Math.max(1, Math.ceil(input.adults / rooms));
  const childrenPerRoom = Math.max(0, Math.ceil(input.children / rooms));
  const paxRooms = Array.from({ length: rooms }, () => ({
    Adults: adultsPerRoom,
    Children: childrenPerRoom,
    ChildrenAges: [] as number[],
  }));

  const url = `${TBO_HOLIDAYS_URL}/Search`;
  const auth = basicAuthHeader();
  const batchResults: TboHolidaysSearchHotel[] = [];

  // Step 3: One or more batches against /HotelSearch.
  for (let i = 0; i < candidateCodes.length; i += HOTEL_CODES_PER_BATCH) {
    const batch = candidateCodes.slice(i, i + HOTEL_CODES_PER_BATCH);
    const batchNum = Math.floor(i / HOTEL_CODES_PER_BATCH) + 1;
    const f = input.filters;
    const reqBody = {
      CheckIn: input.checkIn,
      CheckOut: input.checkOut,
      HotelCodes: batch.join(","),
      GuestNationality: input.guestNationality ?? "IN",
      PaxRooms: paxRooms,
      IsDetailedResponse: input.isDetailedResponse ?? false,
      ResponseTime: 23,
      ...(f && {
        Filters: {
          Refundable: f.refundable ?? false,
          NoOfRooms: f.noOfRooms ?? 0,
          MealType: f.mealType ?? null,
          StarRating: f.starRating ?? null,
        },
      }),
    };

    logRequest(`HotelSearch (batch ${batchNum})`, url, {
      ...reqBody,
      HotelCodes: `[${batch.length} codes]`,
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
        `[TBO] HotelSearch batch ${batchNum} status ${data.Status.Code}: ${data.Status.Description}`,
      );
      continue;
    }

    if (data.HotelResult) batchResults.push(...data.HotelResult);
  }

  if (batchResults.length === 0) return emptyHotelSearchResult();

  // Step 4: Merge prices with metadata.
  const cityName = codeList[0]?.CityName ?? "";
  const countryName = codeList[0]?.CountryName ?? "";
  const hotels = batchResults
    .map((h) => buildHotel(h, metaByCode.get(h.HotelCode), cityName, countryName))
    .filter((h) => h.rooms.length > 0);

  if (hotels.length === 0) return emptyHotelSearchResult();

  const prices = hotels.map((h) => h.lowestPrice).filter((p) => p > 0);
  return {
    hotels,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
  };
}
