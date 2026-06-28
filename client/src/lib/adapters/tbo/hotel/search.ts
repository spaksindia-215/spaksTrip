import "server-only";
import { withRetry, tboBase, tboApiUrl } from "../auth";
import { assertTboSuccess, TboNoResultsError } from "../errors";
import { storeTrace } from "../traceCache";
import { getTboCityId } from "./cityMap";
import { logRequest, logResponse, logError } from "../log";
import type { TboHotelSearchResponse, TboHotelResult, TboRoomDetail } from "../types";
import type { Hotel, Room, HotelSearchInput, Amenity } from "@/lib/mock/hotels";

// NOTE: TBO has multiple hotel APIs:
//   1. Legacy HotelAPI (CityId-based, older B2B)
//   2. HotelAPI V10 / Affiliate Hotel API (HotelCodes + PaxRooms-based, newer)
// Per docs at apidoc.tektravels.com/hotelnew/, the response shape uses
// `HotelResult` (singular) with `Rooms[].BookingCode`. This adapter currently
// targets the legacy CityId schema; if you migrate to V10, the request body
// changes (CheckIn=YYYY-MM-DD, HotelCodes, PaxRooms[]) and response parsing
// must read `HotelResult` not `GetHotelResultResponse.HotelResults`.

// ─── Amenity mapping ──────────────────────────────────────────────────────────

const AMENITY_KEYWORDS: Array<[string[], Amenity]> = [
  [["wi-fi", "wifi", "internet", "wireless"], "wifi"],
  [["pool", "swimming"], "pool"],
  [["gym", "fitness", "health club"], "gym"],
  [["spa"], "spa"],
  [["restaurant", "dining"], "restaurant"],
  [["bar", "lounge"], "bar"],
  [["parking", "car park"], "parking"],
  [["air condition", "air-condition", "ac ", "hvac"], "ac"],
  [["breakfast"], "breakfast"],
  [["pet"], "pet_friendly"],
  [["business center", "business centre", "conference"], "business_center"],
  [["shuttle", "airport transfer", "airport transport"], "airport_shuttle"],
  [["beach"], "beach_access"],
  [["rooftop"], "rooftop"],
];

function mapAmenities(raw: string[]): Amenity[] {
  const found = new Set<Amenity>();
  for (const amenityStr of raw) {
    const lower = amenityStr.toLowerCase();
    for (const [keywords, amenity] of AMENITY_KEYWORDS) {
      if (keywords.some((kw) => lower.includes(kw))) {
        found.add(amenity);
        break;
      }
    }
  }
  return Array.from(found);
}

// ─── Room type mapping ────────────────────────────────────────────────────────

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

// ─── TBO date format ──────────────────────────────────────────────────────────

// TBO hotel search requires DD/MM/YYYY
function toTboDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-");
  return `${d}/${m}/${y}`;
}

// ─── Map one TboRoomDetail → Room ─────────────────────────────────────────────

function mapRoom(r: TboRoomDetail): Room {
  return {
    id: r.RoomTypeCode,
    name: r.RoomTypeName,
    type: mapRoomType(r.RoomTypeName),
    maxOccupancy: 2, // TBO does not always return this
    bedType: mapBedType(r.RoomTypeName),
    sizeSqm: 0,      // TBO does not return room size
    basePrice: r.Price.OfferedPrice,
    amenities: mapAmenities(r.Inclusion ?? []),
    refundable: r.IsRefundable,
    breakfast: r.WithBreakfast,
    seatsLeft: 5,    // TBO does not return availability count per room
  };
}

// ─── Map TboHotelResult → Hotel ───────────────────────────────────────────────

function mapHotel(h: TboHotelResult, city: string, country: string): Hotel {
  const rooms: Room[] = (h.RoomDetails ?? []).map(mapRoom);
  const lowestPrice =
    rooms.length > 0
      ? Math.min(...rooms.map((r) => r.basePrice))
      : h.Price.OfferedPriceRoundedOff;

  const starRating = Math.max(2, Math.min(5, h.HotelRating)) as Hotel["starRating"];

  return {
    id: h.HotelCode, // HotelCode is the chain key for detail/book calls
    name: h.HotelName,
    chain: undefined,
    starRating,
    reviewScore: 0,    // TBO search doesn't return review scores
    reviewCount: 0,
    reviewLabel: "",
    city,
    country,
    address: h.HotelAddress,
    images: h.Images ?? [],
    amenities: mapAmenities([...(h.Amenities ?? []), ...(h.HotelFacilities ?? [])]),
    rooms,
    reviews: [],
    lowestPrice,
    propertyType: "hotel",
  };
}

// ─── Public: search hotels ────────────────────────────────────────────────────

export async function tboSearchHotels(
  input: HotelSearchInput,
): Promise<{ hotels: Hotel[]; minPrice: number; maxPrice: number }> {
  if (!input.cityCode) {
    throw new Error("cityCode is required for hotel search");
  }

  const cityId = getTboCityId(input.cityCode);
  if (!cityId) {
    throw new Error(`TBO CityId not found for city code: ${input.cityCode}`);
  }

  return withRetry(async (token) => {
    const url = tboApiUrl("HotelAPI/Hotel/HotelSearch", "hotel");
    const reqBody = {
      ...tboBase(token),
      CityId: cityId,
      CheckInDate: toTboDate(input.checkIn),
      CheckOutDate: toTboDate(input.checkOut),
      GuestNationality: "IN",
      NoOfRooms: input.rooms,
      RoomGuests: Array.from({ length: input.rooms }, () => ({
        NoOfAdults: Math.ceil(input.adults / input.rooms),
        NoOfChild: 0,
        ChildAge: [],
      })),
      ResultCount: null,
      PreferredCurrencyCode: "INR",
      IsDetailedResponse: false,
    };
    logRequest("Hotel Search", url, { ...reqBody, TokenId: "***" });

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });
    } catch (err) {
      logError("Hotel Search", err);
      throw err;
    }

    const text = await res.text();
    let data: TboHotelSearchResponse;
    try { data = JSON.parse(text); }
    catch { throw new Error(`TBO HotelSearch non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`); }

    logResponse("Hotel Search", res.status, data);
    if (!res.ok) throw new Error(`TBO HotelSearch HTTP ${res.status}`);
    assertTboSuccess(data.GetHotelResultResponse?.Error);

    const traceId = data.GetHotelResultResponse?.TraceId ?? "";
    const rawHotels = data.GetHotelResultResponse?.HotelResults ?? [];

    // Derive city name/country from input (we only have the code)
    // The UI stores `City` objects with code/name/country in the search store
    const city = input.cityCode!;
    const country = ""; // frontend components use city code; country is display-only

    const hotels = rawHotels.map((h) => {
      storeTrace(h.HotelCode, traceId);
      return mapHotel(h, city, country);
    });

    if (hotels.length === 0) throw new TboNoResultsError();

    const prices = hotels.map((h) => h.lowestPrice).filter((p) => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    console.log(`[TBO] Hotel Search returned ${hotels.length} hotels (price range ${minPrice}–${maxPrice})`);
    return { hotels, minPrice, maxPrice };
  });
}
