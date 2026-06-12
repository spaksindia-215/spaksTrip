import {
  searchCities,
  type Amenity,
  type Hotel,
  type HotelSearchInput,
} from "@/lib/mock/hotels";
import { sleep } from "./delay";

// TBO is the only data source for hotels. Fallback inventory has been removed.
// All calls go through Next.js /api/hotels/* routes which proxy to the TBO B2B API.

export type { Amenity, Hotel, HotelSearchInput };
export type { Room, HotelReview, City, HotelSearchInput as HotelInput } from "@/lib/mock/hotels";

export type HotelSortBy = "price" | "rating" | "stars" | "popularity";

export type HotelFilters = {
  stars?: number[];
  maxPrice?: number;
  amenities?: Amenity[];
  propertyTypes?: string[];
  refundableOnly?: boolean;
};

export function applyHotelFilters(hotels: Hotel[], f: HotelFilters): Hotel[] {
  return hotels.filter((h) => {
    if (f.stars?.length && !f.stars.includes(h.starRating)) return false;
    if (f.maxPrice && h.lowestPrice > f.maxPrice) return false;
    if (f.amenities?.length && !f.amenities.every((a) => h.amenities.includes(a))) return false;
    if (f.propertyTypes?.length && !f.propertyTypes.includes(h.propertyType)) return false;
    if (f.refundableOnly && !h.rooms.some((r) => r.refundable)) return false;
    return true;
  });
}

export function sortHotels(hotels: Hotel[], by: HotelSortBy): Hotel[] {
  return [...hotels].sort((a, b) => {
    if (by === "price") return a.lowestPrice - b.lowestPrice;
    if (by === "rating") return b.reviewScore - a.reviewScore;
    if (by === "stars") return b.starRating - a.starRating;
    return b.reviewCount - a.reviewCount;
  });
}

export async function searchHotels(
  input: HotelSearchInput,
  filters?: HotelFilters,
): Promise<{ hotels: Hotel[]; minPrice: number; maxPrice: number }> {
  const searchInput = { ...input, filters };
  const res = await fetch("/api/hotels/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(searchInput),
  });

  let json: { success: boolean; data?: { hotels: Hotel[]; minPrice: number; maxPrice: number }; error?: string };
  try {
    json = await res.json();
  } catch {
    throw new Error(`Hotel search failed: HTTP ${res.status} (non-JSON response)`);
  }

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `Hotel search failed (HTTP ${res.status})`);
  }
  return json.data!;
}

export async function getHotel(
  id: string,
  searchParams?: {
    checkIn?: string;
    checkOut?: string;
    rooms?: number;
    adults?: number;
    children?: number;
    childrenAges?: number[];
  },
): Promise<Hotel | null> {
  const qs = new URLSearchParams({
    checkIn: searchParams?.checkIn ?? "",
    checkOut: searchParams?.checkOut ?? "",
    rooms: String(searchParams?.rooms ?? 1),
    adults: String(searchParams?.adults ?? 2),
    children: String(searchParams?.children ?? 0),
  });
  if (searchParams?.childrenAges?.length) {
    qs.set("childrenAges", searchParams.childrenAges.join(","));
  }
  const res = await fetch(`/api/hotels/${encodeURIComponent(id)}?${qs}`); // → /api/hotels/[id]
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return json?.success ? json.data : null;
}

export async function searchCityOptions(q: string) {
  // City autocomplete uses the local CITIES list — TBO city IDs are resolved
  // server-side via cityMap.ts; the UI only needs display names + codes.
  await sleep(100);
  return searchCities(q);
}
