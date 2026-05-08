import "server-only";
import { logRequest, logResponse, logError } from "../log";
import { assertTboSuccess, TboNoResultsError } from "../errors";
import { tboGetHotelCodeListByCity } from "./tboHotelCodeList";
import type { Hotel, Room, HotelSearchInput, Amenity } from "@/lib/mock/hotels";
import type { TboHotelCodeListItem, TboHotelRatingEnum } from "../types";

// TBOHolidays HotelSearch — POST {base}/HotelSearch (Basic Auth, agency creds).
// Replaces the legacy CityId-based HotelAPI search. The TBOHolidays product
// is HotelCodes-based, so the flow is:
//   1. tboGetHotelCodeListByCity(cityCode)  — cached 15d, gives metadata + codes
//   2. POST /HotelSearch with HotelCodes batches  — live pricing
// Search/PreBook/Book require the AGENCY credential pair, NOT the
// public test creds used for static-data endpoints.

const TBO_HOLIDAYS_URL =
  process.env.TBO_HOLIDAYS_HOTEL_API_URL?.replace(/\/$/, "") ??
  "http://api.tbotechnology.in/TBOHolidays_HotelAPI";

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

// TBO won't accept arbitrarily large code lists in one HotelSearch call.
// 200 per batch is a safe ceiling; first page of results is also capped to
// keep dev-mode latency reasonable.
const HOTEL_CODES_PER_BATCH = 200;
const MAX_HOTELS_PER_SEARCH = 200;

interface TboHolidaysSearchRoom {
  BookingCode: string;
  Name?: string[];
  TotalFare: number;
  TotalTax?: number;
  Inclusion?: string;
  MealType?: string;
  IsRefundable: boolean;
  WithTransfers?: boolean;
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

const AMENITY_KEYWORDS: Array<[string[], Amenity]> = [
  [["wi-fi", "wifi", "internet", "wireless"], "wifi"],
  [["pool", "swimming"], "pool"],
  [["gym", "fitness", "health club"], "gym"],
  [["spa"], "spa"],
  [["restaurant", "dining"], "restaurant"],
  [["bar", "lounge"], "bar"],
  [["parking", "car park"], "parking"],
  [["air condition", "air-condition"], "ac"],
  [["breakfast"], "breakfast"],
  [["pet"], "pet_friendly"],
  [["business center", "business centre"], "business_center"],
  [["shuttle", "airport transfer"], "airport_shuttle"],
];

function mapAmenities(raw: string[]): Amenity[] {
  const found = new Set<Amenity>();
  for (const s of raw) {
    const lower = s.toLowerCase();
    for (const [kws, amenity] of AMENITY_KEYWORDS) {
      if (kws.some((kw) => lower.includes(kw))) {
        found.add(amenity);
        break;
      }
    }
  }
  return Array.from(found);
}

function mapRoomType(name: string): Room["type"] {
  const lower = name.toLowerCase();
  if (lower.includes("suite")) return "suite";
  if (lower.includes("villa")) return "villa";
  if (lower.includes("deluxe") || lower.includes("superior") || lower.includes("premium"))
    return "deluxe";
  return "standard";
}

function mapBedType(name: string): Room["bedType"] {
  const lower = name.toLowerCase();
  if (lower.includes("king")) return "king";
  if (lower.includes("queen")) return "queen";
  if (lower.includes("twin") || lower.includes("double")) return "double";
  if (lower.includes("single")) return "single";
  return "double";
}

function mapSearchRoom(r: TboHolidaysSearchRoom): Room {
  const name = r.Name?.[0] ?? "Room";
  return {
    id: r.BookingCode,
    name,
    type: mapRoomType(name),
    maxOccupancy: 2,
    bedType: mapBedType(name),
    sizeSqm: 0,
    basePrice: r.TotalFare,
    amenities: r.Inclusion ? mapAmenities([r.Inclusion]) : [],
    refundable: r.IsRefundable,
    breakfast: (r.MealType ?? "").toLowerCase().includes("breakfast"),
    seatsLeft: 5,
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

export async function tboSearchHotelsHolidays(
  input: HotelSearchInput,
): Promise<{ hotels: Hotel[]; minPrice: number; maxPrice: number }> {
  // Step 1: Hotel codes for the city (cached 15 days). Detailed=true so we get
  // hotel name/address/rating in the same call — search response itself only
  // returns prices keyed by HotelCode.
  const codeList = await tboGetHotelCodeListByCity(input.cityCode);
  if (codeList.length === 0) throw new TboNoResultsError();

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

  const url = `${TBO_HOLIDAYS_URL}/HotelSearch`;
  const auth = basicAuthHeader();
  const batchResults: TboHolidaysSearchHotel[] = [];

  // Step 3: One or more batches against /HotelSearch.
  for (let i = 0; i < candidateCodes.length; i += HOTEL_CODES_PER_BATCH) {
    const batch = candidateCodes.slice(i, i + HOTEL_CODES_PER_BATCH);
    const batchNum = Math.floor(i / HOTEL_CODES_PER_BATCH) + 1;
    const reqBody = {
      CheckIn: input.checkIn,
      CheckOut: input.checkOut,
      HotelCodes: batch.join(","),
      GuestNationality: "IN",
      PreferredCurrencyCode: "INR",
      PaxRooms: paxRooms,
      IsDetailedResponse: false,
      ResponseTime: 23,
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

  if (batchResults.length === 0) throw new TboNoResultsError();

  // Step 4: Merge prices with metadata.
  const cityName = codeList[0]?.CityName ?? "";
  const countryName = codeList[0]?.CountryName ?? "";
  const hotels = batchResults
    .map((h) => buildHotel(h, metaByCode.get(h.HotelCode), cityName, countryName))
    .filter((h) => h.rooms.length > 0);

  if (hotels.length === 0) throw new TboNoResultsError();

  const prices = hotels.map((h) => h.lowestPrice).filter((p) => p > 0);
  return {
    hotels,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
  };
}
