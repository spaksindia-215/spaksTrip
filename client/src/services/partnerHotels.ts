import { api } from "@/lib/api";

// Public partner-hotel surface — listings shown alongside TBO results on the
// hotel search page, plus the guest/customer enquiry call. All requests go
// through the Next.js /api/partner-hotels proxy to the Express backend.

export type PartnerHotelImage = { url: string; caption?: string };

export type PartnerHotelRoom = {
  name: string;
  description?: string;
  maxAdults?: number;
  maxChildren?: number;
  bedType?: string;
  roomSize?: string;
  amenities?: string[];
  images?: string[];
};

export type PartnerHotel = {
  id: string;
  name: string;
  slug?: string;
  type?: string;
  starRating?: number;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  amenities?: string[];
  images?: PartnerHotelImage[];
  rooms?: PartnerHotelRoom[];
  pricing?: {
    basePricePerNight?: number;
    taxPercentage?: number;
    currency?: string;
  };
  // GeoJSON point as stored: coordinates are [longitude, latitude].
  coordinates?: { type?: string; coordinates?: [number, number] };
  promotions?: PartnerHotelPromotion[];
  contact?: { phone?: string; email?: string };
  policies?: {
    checkIn?: string;
    checkOut?: string;
    cancellation?: string;
    child?: string;
    pet?: string;
    smoking?: string;
  };
};

export type PartnerHotelPromotion = {
  key?: string;
  name?: string;
  discountType?: "Percentage" | "Fixed Amount" | string;
  discountValue?: number;
  startDate?: string;
  endDate?: string;
};

export type HotelEnquiryInput = {
  contact: { name: string; phone: string; email?: string };
  checkIn?: string;
  checkOut?: string;
  pax: { adults: number; children: number; infants: number };
  message?: string;
};

export const ACCOMMODATION_TYPES = [
  "hotel",
  "resort",
  "villa",
  "homestay",
  "apartment",
  "guest_house",
  "airbnb",
  "houseboat",
  "hostel",
] as const;
export type AccommodationType = (typeof ACCOMMODATION_TYPES)[number];

export const ACCOMMODATION_TYPE_LABELS: Record<AccommodationType, string> = {
  hotel: "Hotels",
  resort: "Resorts",
  villa: "Villas",
  homestay: "Homestays",
  apartment: "Apartments",
  guest_house: "Guest Houses",
  airbnb: "Airbnb",
  houseboat: "Houseboats",
  hostel: "Hostels",
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };

// Browse active partner accommodations (the navbar "Accommodation" surface),
// optionally filtered by type / city / free-text. Separate from TBO /hotel search.
export async function browseAccommodation(params: {
  type?: AccommodationType;
  city?: string;
  q?: string;
  page?: number;
} = {}): Promise<{ items: PartnerHotel[]; pagination: Pagination }> {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, String(v));
  const qs = sp.toString();
  const res = await fetch(`/api/accommodation${qs ? `?${qs}` : ""}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load accommodations");
  return (await res.json()) as { items: PartnerHotel[]; pagination: Pagination };
}

// Single active accommodation listing by slug (full detail).
export async function getAccommodation(slug: string): Promise<PartnerHotel> {
  const res = await fetch(`/api/accommodation/${encodeURIComponent(slug)}`, { credentials: "include" });
  if (!res.ok) throw new Error("Accommodation not found");
  return (await res.json() as { item: PartnerHotel }).item;
}

// Active-listing counts per accommodation type (for tab badges).
export async function listAccommodationTypes(): Promise<{ type: string; count: number }[]> {
  const res = await fetch(`/api/accommodation/types`, { credentials: "include" });
  if (!res.ok) return [];
  return (await res.json() as { items: { type: string; count: number }[] }).items ?? [];
}

// ── Partner lead inbox (accommodation) ──────────────────────────────────────
export type AccommodationLeadStatus = "new" | "contacted" | "quoted" | "converted" | "closed" | "spam";

export type AccommodationLead = {
  id: string;
  hotel: { id: string; name: string; slug: string; type?: string } | string;
  contact: { name: string; phone: string; email?: string };
  checkIn?: string;
  checkOut?: string;
  pax: { adults: number; children: number; infants: number };
  message?: string;
  status: AccommodationLeadStatus;
  createdAt: string;
};

// The partner's accommodation leads (HotelEnquiry). Authenticated → uses the api
// helper so an expired access token is refreshed transparently.
export async function listAccommodationLeads(status?: AccommodationLeadStatus): Promise<AccommodationLead[]> {
  const qs = status ? `?status=${status}` : "";
  const res = await api<{ items: AccommodationLead[] }>(`/api/partner/accommodation/enquiries${qs}`);
  return res.items;
}

export async function updateAccommodationLead(id: string, status: AccommodationLeadStatus): Promise<AccommodationLead> {
  const res = await api<{ item: AccommodationLead }>(`/api/partner/accommodation/enquiries/${id}`, {
    method: "PATCH",
    body: { status },
  });
  return res.item;
}

// Active partner hotels for a city (matched by city name, not TBO code).
export async function searchPartnerHotels(city: string): Promise<PartnerHotel[]> {
  const res = await fetch(`/api/partner-hotels?city=${encodeURIComponent(city)}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load partner hotels");
  const data = (await res.json()) as { items: PartnerHotel[] };
  return data.items ?? [];
}

// Create an enquiry lead for a partner hotel. Guests allowed; if the customer is
// logged in the backend attributes the enquiry to them via the session cookie.
export async function createHotelEnquiry(
  hotelId: string,
  input: HotelEnquiryInput,
): Promise<void> {
  const res = await fetch(`/api/partner-hotels/${encodeURIComponent(hotelId)}/enquire`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    credentials: "include",
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error((payload && payload.error) || "Failed to send enquiry");
  }
}
