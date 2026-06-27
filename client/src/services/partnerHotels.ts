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
  contact?: { phone?: string; email?: string };
  policies?: { checkIn?: string; checkOut?: string; cancellation?: string };
};

export type HotelEnquiryInput = {
  contact: { name: string; phone: string; email?: string };
  checkIn?: string;
  checkOut?: string;
  pax: { adults: number; children: number; infants: number };
  message?: string;
};

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
