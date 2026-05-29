import "server-only";
import { logRequest, logResponse, logError } from "../log";
import { assertTboSuccess } from "../errors";
import {
  tboGetStaticHotelDetails,
  parseLatLong,
  parseAttractions,
} from "./staticHotelDetails";
import {
  basicAuthHeader,
  mapAmenities,
  mapRoomType,
  mapBedType,
  mapCancelPolicies,
  type TboSearchCancelPolicy,
  type DistributionType,
} from "./hotelUtils";
import type { TboStaticHotelDetail } from "../types";
import type { Hotel, Room } from "@/lib/mock/hotels";

const TBO_HOLIDAYS_URL = (
  process.env.TBO_HOLIDAYS_SEARCH_URL ??
  process.env.TBO_HOLIDAYS_HOTEL_API_URL ??
  "https://affiliate.tektravels.com/HotelAPI"
).replace(/\/$/, "");

// ─── Raw TBO search shapes ────────────────────────────────────────────────────

type TboDetailCancelPolicy = TboSearchCancelPolicy;

interface TboDetailSearchRoom {
  BookingCode: string;
  Name?: string[];
  DayRates?: Array<Array<{ BasePrice: number }>>;
  TotalFare: number;
  TotalTax?: number;
  ExtraGuestCharges?: number;
  RecommendedSellingRate?: string;
  Inclusion?: string;
  RoomPromotion?: string[][];
  CancelPolicies?: TboDetailCancelPolicy[];
  MealType?: string;
  IsRefundable: boolean;
  RoomID?: string[];
}

interface TboDetailSearchHotel {
  HotelCode: string;
  Rooms: TboDetailSearchRoom[];
}

interface TboDetailSearchResponse {
  Status?: { Code: number; Description: string };
  HotelResult?: TboDetailSearchHotel[];
  Error?: { ErrorCode: number; ErrorMessage: string };
}

function mapRoom(r: TboDetailSearchRoom): Room {
  const name = r.Name?.[0] ?? "Room";
  const nightlyRate = r.DayRates?.[0]?.[0]?.BasePrice;
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

// ─── Static enrichment ────────────────────────────────────────────────────────

function mergeStaticDetails(hotel: Hotel, s: TboStaticHotelDetail): Hotel {
  const merged: Hotel = { ...hotel };

  // Name: static details is authoritative when the base name is the raw code
  if (s.HotelName && (!merged.name || merged.name === hotel.id)) {
    merged.name = s.HotelName;
  }

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

  if (typeof s.HotelRating === "number" && s.HotelRating >= 2 && s.HotelRating <= 5) {
    merged.starRating = s.HotelRating as Hotel["starRating"];
  }

  return merged;
}

// ─── Public ───────────────────────────────────────────────────────────────────

export async function tboGetHotelDetail(
  hotelCode: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  children: number,
  rooms: number,
  distributionType: DistributionType = "b2c",
): Promise<Hotel | null> {
  const roomCount = Math.max(1, rooms);
  const paxRooms = Array.from({ length: roomCount }, () => ({
    Adults: Math.max(1, Math.ceil(adults / roomCount)),
    Children: Math.max(0, Math.ceil(children / roomCount)),
    ChildrenAges: [] as number[],
  }));

  const url = `${TBO_HOLIDAYS_URL}/Search`;
  const reqBody = {
    CheckIn: checkIn,
    CheckOut: checkOut,
    HotelCodes: hotelCode,
    GuestNationality: "IN",
    PaxRooms: paxRooms,
    IsDetailedResponse: false,
    ResponseTime: 23,
  };

  logRequest("Hotel Detail (Search)", url, reqBody);

  const fetchSearch = fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: basicAuthHeader(distributionType),
    },
    body: JSON.stringify(reqBody),
    cache: "no-store",
  }).catch((err) => {
    logError("Hotel Detail (Search)", err);
    throw err;
  });

  const fetchStatic = tboGetStaticHotelDetails(hotelCode).catch((err) => {
    logError("Static Hoteldetails (enrichment)", err);
    return null;
  });

  const [res, staticDetail] = await Promise.all([fetchSearch, fetchStatic]);

  const text = await res.text();
  let data: TboDetailSearchResponse;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `TBO Hotel Detail non-JSON (HTTP ${res.status}) from ${url}: ${text.slice(0, 200)}`,
    );
  }

  logResponse("Hotel Detail (Search)", res.status, {
    Status: data.Status,
    HotelResultCount: data.HotelResult?.length ?? 0,
  });

  if (!res.ok) throw new Error(`TBO Hotel Detail HTTP ${res.status}`);
  assertTboSuccess(data.Error);

  // Status 201 means no results for this hotel/date combination
  if (data.Status && data.Status.Code !== 200) {
    return null;
  }

  const hotelResult = data.HotelResult?.find((h) => h.HotelCode === hotelCode);
  if (!hotelResult || hotelResult.Rooms.length === 0) return null;

  const roomList = hotelResult.Rooms.map(mapRoom);
  const lowestPrice =
    roomList.length > 0 ? Math.min(...roomList.map((r) => r.basePrice)) : 0;

  const baseHotel: Hotel = {
    id: hotelCode,
    name: hotelCode,
    chain: undefined,
    starRating: 3,
    reviewScore: 0,
    reviewCount: 0,
    reviewLabel: "",
    city: "",
    country: "",
    address: "",
    images: [],
    amenities: [],
    rooms: roomList,
    reviews: [],
    lowestPrice,
    propertyType: "hotel",
  };

  return staticDetail ? mergeStaticDetails(baseHotel, staticDetail) : baseHotel;
}
