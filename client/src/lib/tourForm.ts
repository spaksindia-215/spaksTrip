import type { TourListingApi } from "@/lib/partnerClient";

// Form-state shape + mappers for the dedicated Tour manager. Array fields are
// edited as comma/newline-separated strings; itinerary, pricing tiers, and
// pickup points are dynamic rows. The builder serializes a structured `payload`
// (the backend re-validates) plus image files.

export const TOUR_CATEGORIES = [
  "sightseeing",
  "adventure",
  "cultural",
  "religious",
  "wildlife",
  "cruise_day",
  "honeymoon",
  "group",
] as const;

export const TOUR_OPERATING_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const TOUR_CURRENCIES = ["INR", "USD", "EUR", "AED", "GBP"] as const;

export type TourItineraryRow = { time: string; title: string; description: string; location: string };
export type TourPricingRow = { label: string; price: string; minAge: string; maxAge: string };
export type TourPickupRow = { name: string; time: string };

export type TourFormState = {
  title: string;
  status: "draft" | "active";
  category: string;
  description: string;
  highlights: string;
  tags: string;
  languages: string;
  // location
  basedIn: string;
  coversCities: string;
  latitude: string;
  longitude: string;
  // duration
  durationHours: string;
  durationDays: string;
  durationNights: string;
  // dynamic
  itinerary: TourItineraryRow[];
  pricing: TourPricingRow[];
  pickupPoints: TourPickupRow[];
  // group
  minGroupSize: string;
  maxGroupSize: string;
  privateAvailable: boolean;
  privatePrice: string;
  currency: string;
  // inclusions / pickup
  inclusions: string;
  exclusions: string;
  pickupIncluded: boolean;
  // availability
  operatingDays: string[];
  startTimes: string;
  advanceBookingHrs: string;
  blackoutDates: string;
  videoUrl: string;
};

export type TourFiles = { images: File[] };

export function emptyPricingRow(): TourPricingRow {
  return { label: "Adult", price: "", minAge: "", maxAge: "" };
}

export function emptyTourForm(): TourFormState {
  return {
    title: "",
    status: "draft",
    category: "sightseeing",
    description: "",
    highlights: "",
    tags: "",
    languages: "",
    basedIn: "",
    coversCities: "",
    latitude: "",
    longitude: "",
    durationHours: "",
    durationDays: "",
    durationNights: "",
    itinerary: [{ time: "", title: "", description: "", location: "" }],
    pricing: [emptyPricingRow()],
    pickupPoints: [],
    minGroupSize: "1",
    maxGroupSize: "",
    privateAvailable: false,
    privatePrice: "",
    currency: "INR",
    inclusions: "",
    exclusions: "",
    pickupIncluded: false,
    operatingDays: [],
    startTimes: "",
    advanceBookingHrs: "12",
    blackoutDates: "",
    videoUrl: "",
  };
}

function toCsv(arr: string[]): string {
  return arr.join(", ");
}

function isoDate(value: string): string {
  return value.length >= 10 ? value.slice(0, 10) : value;
}

export function tourFormFromApi(tour: TourListingApi): TourFormState {
  return {
    title: tour.title,
    status: tour.status === "active" ? "active" : "draft",
    category: tour.category,
    description: tour.description ?? "",
    highlights: toCsv(tour.highlights),
    tags: toCsv(tour.tags),
    languages: toCsv(tour.languages),
    basedIn: tour.basedIn,
    coversCities: toCsv(tour.coversCities),
    latitude: tour.coordinates ? String(tour.coordinates.coordinates[1]) : "",
    longitude: tour.coordinates ? String(tour.coordinates.coordinates[0]) : "",
    durationHours: tour.durationHours !== undefined ? String(tour.durationHours) : "",
    durationDays: tour.durationDays !== undefined ? String(tour.durationDays) : "",
    durationNights: tour.durationNights !== undefined ? String(tour.durationNights) : "",
    itinerary:
      tour.itinerary.length > 0
        ? tour.itinerary.map((s) => ({
            time: s.time ?? "",
            title: s.title ?? "",
            description: s.description ?? "",
            location: s.location ?? "",
          }))
        : [{ time: "", title: "", description: "", location: "" }],
    pricing:
      tour.pricing.length > 0
        ? tour.pricing.map((t) => ({
            label: t.label,
            price: String(t.price),
            minAge: t.minAge !== undefined ? String(t.minAge) : "",
            maxAge: t.maxAge !== undefined ? String(t.maxAge) : "",
          }))
        : [emptyPricingRow()],
    pickupPoints: tour.pickupPoints.map((p) => ({ name: p.name ?? "", time: p.time ?? "" })),
    minGroupSize: String(tour.minGroupSize),
    maxGroupSize: tour.maxGroupSize !== undefined ? String(tour.maxGroupSize) : "",
    privateAvailable: tour.privateAvailable,
    privatePrice: tour.privatePrice !== undefined ? String(tour.privatePrice) : "",
    currency: tour.pricing[0]?.currency ?? "INR",
    inclusions: toCsv(tour.inclusions),
    exclusions: toCsv(tour.exclusions),
    pickupIncluded: tour.pickupIncluded,
    operatingDays: tour.operatingDays,
    startTimes: toCsv(tour.startTimes),
    advanceBookingHrs: String(tour.advanceBookingHrs),
    blackoutDates: toCsv(tour.blackoutDates.map(isoDate)),
    videoUrl: tour.videoUrl ?? "",
  };
}

function fromCsv(value: string): string[] {
  return Array.from(new Set(value.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)));
}

function numOrUndef(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function validateTourForm(state: TourFormState): string | null {
  if (!state.title.trim()) return "Title is required.";
  if (!state.basedIn.trim()) return "Based-in city is required.";
  const tiers = state.pricing.filter((t) => t.label.trim() && t.price.trim());
  if (tiers.length === 0) return "Add at least one pricing tier (label + price).";
  if (tiers.some((t) => !(Number(t.price) >= 0))) return "Pricing tier prices must be valid numbers.";
  return null;
}

export function buildTourFormData(state: TourFormState, files: TourFiles): FormData {
  const payload = {
    title: state.title.trim(),
    status: state.status,
    category: state.category,
    description: state.description.trim() || undefined,
    highlights: fromCsv(state.highlights),
    tags: fromCsv(state.tags),
    languages: fromCsv(state.languages),
    basedIn: state.basedIn.trim(),
    coversCities: fromCsv(state.coversCities),
    latitude: numOrUndef(state.latitude),
    longitude: numOrUndef(state.longitude),
    durationHours: numOrUndef(state.durationHours),
    durationDays: numOrUndef(state.durationDays),
    durationNights: numOrUndef(state.durationNights),
    itinerary: state.itinerary
      .filter((r) => r.time.trim() || r.title.trim() || r.description.trim() || r.location.trim())
      .map((r) => ({
        time: r.time.trim() || undefined,
        title: r.title.trim() || undefined,
        description: r.description.trim() || undefined,
        location: r.location.trim() || undefined,
      })),
    pricing: state.pricing
      .filter((t) => t.label.trim() && t.price.trim())
      .map((t) => ({
        label: t.label.trim(),
        price: Number(t.price),
        currency: state.currency,
        minAge: numOrUndef(t.minAge),
        maxAge: numOrUndef(t.maxAge),
      })),
    minGroupSize: numOrUndef(state.minGroupSize) ?? 1,
    maxGroupSize: numOrUndef(state.maxGroupSize),
    privateAvailable: state.privateAvailable,
    privatePrice: numOrUndef(state.privatePrice),
    inclusions: fromCsv(state.inclusions),
    exclusions: fromCsv(state.exclusions),
    pickupIncluded: state.pickupIncluded,
    pickupPoints: state.pickupPoints
      .filter((p) => p.name.trim() || p.time.trim())
      .map((p) => ({ name: p.name.trim() || undefined, time: p.time.trim() || undefined })),
    operatingDays: state.operatingDays,
    startTimes: fromCsv(state.startTimes),
    advanceBookingHrs: numOrUndef(state.advanceBookingHrs) ?? 12,
    blackoutDates: fromCsv(state.blackoutDates),
    videoUrl: state.videoUrl.trim() || undefined,
  };

  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  files.images.forEach((file) => form.append("images", file));
  return form;
}
