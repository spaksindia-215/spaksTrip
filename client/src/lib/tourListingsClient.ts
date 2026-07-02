import { api } from "@/lib/api";

// Typed client for the public tour-listings browse API.
// All calls are unauthenticated (read-only public surface).

export type TourCategory =
  | "sightseeing"
  | "adventure"
  | "cultural"
  | "religious"
  | "wildlife"
  | "cruise_day"
  | "honeymoon"
  | "group";

export type TourPricingTier = {
  label: string;
  price: number;
  currency: string;
  minAge?: number;
  maxAge?: number;
};

export type TourItineraryStop = {
  time?: string;
  title?: string;
  description?: string;
  location?: string;
};

export type TourImage = { url: string; caption?: string; isPrimary?: boolean };

export type TourOperator = {
  id?: string;
  name?: string;
  companyName?: string;
  phone?: string;
  email?: string;
};

export type TourListingSummary = {
  id: string;
  slug: string;
  status: string;
  title: string;
  category: TourCategory;
  basedIn: string;
  coversCities: string[];
  durationHours?: number;
  durationDays?: number;
  durationNights?: number;
  pricing: TourPricingTier[];
  images: TourImage[];
  highlights: string[];
  tags: string[];
  languages: string[];
  description?: string;
  partner?: TourOperator | null;
  privateAvailable: boolean;
  pickupIncluded: boolean;
  minGroupSize: number;
  operatingDays: string[];
};

export type TourListingDetail = TourListingSummary & {
  itinerary: TourItineraryStop[];
  inclusions: string[];
  exclusions: string[];
  videoUrl?: string;
  startTimes: string[];
  pickupIncluded: boolean;
  pickupPoints: { name?: string; time?: string }[];
  privatePrice?: number;
  maxGroupSize?: number;
  advanceBookingHrs: number;
};

export type TourDestination = {
  name: string;
  count: number;
  image: string | null;
  categories: TourCategory[];
  fromPrice: number | null;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== null) sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function listDestinations(): Promise<{ destinations: TourDestination[] }> {
  return api("/api/tour-listings/destinations");
}

export function listTourListings(filters: {
  destination?: string;
  category?: TourCategory;
  q?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ items: TourListingSummary[]; pagination: Pagination }> {
  return api(`/api/tour-listings${qs(filters)}`);
}

export function getTourListing(slug: string): Promise<{ item: TourListingDetail }> {
  return api(`/api/tour-listings/${encodeURIComponent(slug)}`);
}

export function categoryLabel(cat: TourCategory): string {
  const map: Record<TourCategory, string> = {
    sightseeing: "Sightseeing",
    adventure: "Adventure",
    cultural: "Cultural",
    religious: "Religious",
    wildlife: "Wildlife",
    cruise_day: "Day Cruise",
    honeymoon: "Honeymoon",
    group: "Group",
  };
  return map[cat] ?? cat;
}

export function operatorName(listing: TourListingSummary): string {
  const p = listing.partner;
  if (!p) return "Platform";
  return p.companyName || p.name || "Operator";
}

export function fromPrice(listing: TourListingSummary): number | null {
  if (!listing.pricing.length) return null;
  return Math.min(...listing.pricing.map((p) => p.price));
}

export function durationLabel(listing: TourListingSummary): string {
  const parts: string[] = [];
  if (listing.durationDays && listing.durationDays > 0) {
    parts.push(`${listing.durationNights ?? 0}N / ${listing.durationDays}D`);
  } else if (listing.durationHours && listing.durationHours > 0) {
    parts.push(`${listing.durationHours}h`);
  }
  return parts.join(", ");
}
