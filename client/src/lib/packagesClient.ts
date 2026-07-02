import { api } from "@/lib/api";

// Typed client for the public marketplace packages API (mirrors the server's
// toJSON output). Browsing + detail + enquiry submission are all unauthenticated
// (guests allowed); the enquiry is attributed to the user when a session cookie
// is present.

export type PackageKind =
  | "taxi"
  | "taxi_package"
  | "tour"
  | "tour_package"
  | "holiday"
  | "cruise"
  | "sightseeing"
  | "transfer"
  | "self_drive"
  | "islandhopper"
  | "visa"
  | "bundle";
export type PackageScope = "domestic" | "international";

// Mongoose model names a bundle component may link to (mirrors server enums).
export type ListingRefModel =
  | "TaxiListing"
  | "TourListing"
  | "HotelListing"
  | "SightseeingListing"
  | "TransferListing"
  | "SelfDriveListing"
  | "IslandhopperListing"
  | "VisaListing"
  | "CruiseListing"
  | "EventListing";

// One piece of a composite bundle. `ref`/`refModel` link to a partner's real listing;
// free-form pieces omit both.
export type PackageComponent = {
  category: string;
  refModel?: ListingRefModel;
  ref?: string;
  title: string;
  description?: string;
  quantity: number;
  included: boolean;
};

export type PackageImage = { url: string; caption?: string; isPrimary?: boolean };

export type PackageItineraryDay = {
  day: number;
  title?: string;
  description?: string;
  meals: { breakfast: boolean; lunch: boolean; dinner: boolean };
  accommodation?: string;
  activities: string[];
};

export type PackageSummary = {
  id: string;
  kind: PackageKind;
  scope: PackageScope;
  origin: "platform" | "partner";
  status: string;
  title: string;
  slug: string;
  thumbnail?: string;
  images: PackageImage[];
  description?: string;
  highlights: string[];
  tags: string[];
  route: { origin?: string; destinations: string[]; durationDays: number; durationNights: number };
  referencePrice?: number;
  currency: string;
  // Added by the list/catalog endpoints:
  operatorCount?: number;
  fromPrice?: number | null;
};

export type PackageDetail = PackageSummary & {
  itinerary: PackageItineraryDay[];
  components: PackageComponent[]; // populated only for kind "bundle"
  inclusions: string[];
  exclusions: string[];
  specs: Record<string, unknown>;
};

export type OperatorContact = {
  name?: string;
  businessName?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
};

export type Operator = {
  id: string;
  name?: string;
  companyName?: string;
  slug?: string;
};

export type PackageOffer = {
  id: string;
  partner: Operator | string;
  price: number;
  currency: string;
  perPerson: boolean;
  pricingNote?: string;
  notes?: string;
  inclusionsOverride: string[];
  directContact?: OperatorContact; // present only when the operator chose to share it
  showDirectContact: boolean;
};

export type Pagination = { page: number; limit: number; total: number; totalPages: number };

export type EnquiryInput = {
  offerId: string;
  contact: { name: string; phone: string; email?: string };
  travelDate?: string;
  pax?: { adults: number; children: number; infants: number };
  message?: string;
};

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== null) sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function listPackages(filters: {
  kind?: PackageKind;
  scope?: PackageScope;
  q?: string;
  destination?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ items: PackageSummary[]; pagination: Pagination }> {
  return api(`/api/packages${qs(filters)}`);
}

export function getPackage(slug: string): Promise<{ item: PackageDetail; offers: PackageOffer[] }> {
  return api(`/api/packages/${encodeURIComponent(slug)}`);
}

export function submitEnquiry(slug: string, input: EnquiryInput): Promise<{ item: { id: string } }> {
  return api(`/api/packages/${encodeURIComponent(slug)}/enquire`, {
    method: "POST",
    body: input,
  });
}

// Human label for a kind+scope combination (used in headings/badges).
export function kindLabel(kind: PackageKind, scope?: PackageScope): string {
  const base: Record<PackageKind, string> = {
    taxi: "Taxi",
    taxi_package: "Taxi Package",
    tour: "Tour",
    tour_package: "Tour Package",
    holiday: scope === "international" ? "International Holiday" : "Holiday",
    cruise: "Cruise",
    sightseeing: "Sightseeing",
    transfer: "Transfer",
    self_drive: "Self-Drive",
    islandhopper: "Islandhopper",
    visa: "Visa Consultancy",
    bundle: "Bundle",
  };
  return base[kind];
}
