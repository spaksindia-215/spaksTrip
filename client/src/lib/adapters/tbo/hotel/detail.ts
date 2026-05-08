import "server-only";
import { withRetry, tboBase, tboApiUrl } from "../auth";
import { assertTboSuccess } from "../errors";
import { getTrace, storeTrace } from "../traceCache";
import { logRequest, logResponse, logError } from "../log";
import type { TboHotelDetailResponse, TboRoomDetail, TboStaticHotelDetail } from "../types";
import type { Hotel, Room, Amenity } from "@/lib/mock/hotels";
import {
  tboGetStaticHotelDetails,
  parseLatLong,
  parseAttractions,
} from "./staticHotelDetails";

// ─── Shared helpers (mirrors hotel/search.ts) ─────────────────────────────────

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
  for (const str of raw) {
    const lower = str.toLowerCase();
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

function toTboDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-");
  return `${d}/${m}/${y}`;
}

function mapRoom(r: TboRoomDetail): Room {
  return {
    id: r.RoomTypeCode,
    name: r.RoomTypeName,
    type: mapRoomType(r.RoomTypeName),
    maxOccupancy: 2,
    bedType: mapBedType(r.RoomTypeName),
    sizeSqm: 0,
    basePrice: r.Price.OfferedPrice,
    amenities: mapAmenities(r.Inclusion ?? []),
    refundable: r.IsRefundable,
    breakfast: r.WithBreakfast,
    seatsLeft: 5,
  };
}

// ─── Public ───────────────────────────────────────────────────────────────────

function mergeStaticDetails(hotel: Hotel, s: TboStaticHotelDetail): Hotel {
  const merged: Hotel = { ...hotel };

  if (s.Description && !merged.description) merged.description = s.Description;

  const attractions = parseAttractions(s.Attractions);
  if (attractions.length > 0) merged.attractions = attractions;

  if (s.Images && s.Images.length > 0) {
    const seen = new Set(merged.images);
    for (const img of s.Images) {
      if (img && !seen.has(img)) {
        merged.images.push(img);
        seen.add(img);
      }
    }
  }

  if (s.PhoneNumber) merged.phoneNumber = s.PhoneNumber;
  if (s.FaxNumber) merged.faxNumber = s.FaxNumber;
  if (s.CheckInTime) merged.checkInTime = s.CheckInTime;
  if (s.CheckOutTime) merged.checkOutTime = s.CheckOutTime;

  const coords = parseLatLong(s.Map);
  if (coords) {
    merged.latitude = coords.lat;
    merged.longitude = coords.lng;
  }

  if (s.Address && (!merged.address || merged.address.length < s.Address.length)) {
    merged.address = s.Address;
  }
  if (s.CityName && !merged.city) merged.city = s.CityName;
  if (s.CountryName && !merged.country) merged.country = s.CountryName;

  if (s.HotelFacilities && s.HotelFacilities.length > 0) {
    const extra = mapAmenities(s.HotelFacilities);
    merged.amenities = Array.from(new Set([...merged.amenities, ...extra]));
  }

  if (
    typeof s.HotelRating === "number" &&
    s.HotelRating >= 2 &&
    s.HotelRating <= 5
  ) {
    merged.starRating = s.HotelRating as Hotel["starRating"];
  }

  return merged;
}

export async function tboGetHotelDetail(
  hotelCode: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  children: number,
  rooms: number,
): Promise<Hotel | null> {
  // TraceId may be present from search; if not, detail call still works without it
  const traceId = getTrace(hotelCode) ?? "";

  return withRetry(async (token) => {
    const url = tboApiUrl("HotelAPI/Hotel/GetHotelInfo");
    const reqBody = {
      ...tboBase(token),
      ...(traceId ? { TraceId: traceId } : {}),
      HotelCode: hotelCode,
      CheckInDate: toTboDate(checkIn),
      CheckOutDate: toTboDate(checkOut),
      GuestNationality: "IN",
      NoOfRooms: rooms,
      RoomGuests: Array.from({ length: rooms }, () => ({
        NoOfAdults: Math.ceil(adults / rooms),
        NoOfChild: Math.ceil(children / rooms),
        ChildAge: [],
      })),
      PreferredCurrencyCode: "INR",
      IsDetailedResponse: true,
    };
    logRequest("Hotel Detail", url, { ...reqBody, TokenId: "***" });

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });
    } catch (err) {
      logError("Hotel Detail", err);
      throw err;
    }

    const text = await res.text();
    let data: TboHotelDetailResponse;
    try { data = JSON.parse(text); }
    catch { throw new Error(`TBO HotelDetail non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`); }

    logResponse("Hotel Detail", res.status, data);
    if (!res.ok) throw new Error(`TBO HotelDetails HTTP ${res.status}`);
    assertTboSuccess(data.GetHotelDetailsResponse?.Error);

    const h = data.GetHotelDetailsResponse?.HotelDetails;
    if (!h) return null;

    const newTraceId = data.GetHotelDetailsResponse?.TraceId;
    if (newTraceId) storeTrace(hotelCode, newTraceId);

    const roomList: Room[] = (h.RoomDetails ?? []).map(mapRoom);
    const lowestPrice =
      roomList.length > 0
        ? Math.min(...roomList.map((r) => r.basePrice))
        : h.Price.OfferedPriceRoundedOff;

    const starRating = Math.max(2, Math.min(5, h.HotelRating)) as Hotel["starRating"];

    const baseHotel: Hotel = {
      id: h.HotelCode,
      name: h.HotelName,
      chain: undefined,
      starRating,
      reviewScore: 0,
      reviewCount: 0,
      reviewLabel: "",
      city: h.CityId ?? "",
      country: "",
      address: h.HotelAddress,
      images: [...(h.Images ?? [])],
      amenities: mapAmenities([
        ...(h.Amenities ?? []),
        ...(h.HotelFacilities ?? []),
      ]),
      rooms: roomList,
      reviews: [],
      lowestPrice,
      propertyType: "hotel",
    };

    // Best-effort enrichment from TBOHolidays static Hoteldetails. Failures
    // here must not break the pricing-bearing detail response — log + return
    // the unmerged hotel.
    let staticDetail: TboStaticHotelDetail | null = null;
    try {
      staticDetail = await tboGetStaticHotelDetails(h.HotelCode);
    } catch (err) {
      logError("Static Hoteldetails (enrichment)", err);
    }

    return staticDetail ? mergeStaticDetails(baseHotel, staticDetail) : baseHotel;
  });
}
