import type { TourPackageApi } from "@/lib/partnerClient";

// Form-state shape + mappers for the dedicated TourPackage manager. Itinerary
// (with meal checkboxes), discounts, and departures are dynamic rows; includes
// are id selections. The builder serializes a structured `payload` plus media.

export const PACKAGE_TYPES = ["fit", "group", "honeymoon", "family", "corporate", "pilgrimage"] as const;
export const DEPARTURE_STATUS = ["open", "filling_fast", "closed", "cancelled"] as const;
export const DIFFICULTY_LEVELS = ["easy", "moderate", "challenging"] as const;
export const PACKAGE_CURRENCIES = ["INR", "USD", "EUR", "AED", "GBP"] as const;

export type PackageItineraryRow = {
  day: string;
  title: string;
  description: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  accommodation: string;
  activities: string;
};
export type PackageDiscountRow = { label: string; percent: string; validUntil: string };
export type PackageDepartureRow = { date: string; seatsTotal: string; status: string };

export type TourPackageFormState = {
  title: string;
  status: "draft" | "active";
  packageType: string;
  difficultyLevel: string;
  description: string;
  highlights: string;
  tags: string;
  // route
  origin: string;
  destinations: string;
  durationDays: string;
  durationNights: string;
  // includes
  includeTaxi: string;
  includeHotels: string[];
  includeTours: string[];
  customInclusions: string;
  exclusions: string;
  // dynamic
  itinerary: PackageItineraryRow[];
  discounts: PackageDiscountRow[];
  departures: PackageDepartureRow[];
  // pricing
  basePrice: string;
  currency: string;
  perPerson: boolean;
  maxPersons: string;
  childPrice: string;
  infantPrice: string;
  extraPersonCharge: string;
  singleSupplement: string;
  // media
  videoUrl: string;
};

export type TourPackageFiles = { thumbnail: File | null; images: File[] };

export function emptyItineraryRow(day: number): PackageItineraryRow {
  return { day: String(day), title: "", description: "", breakfast: false, lunch: false, dinner: false, accommodation: "", activities: "" };
}

export function emptyTourPackageForm(): TourPackageFormState {
  return {
    title: "",
    status: "draft",
    packageType: "group",
    difficultyLevel: "",
    description: "",
    highlights: "",
    tags: "",
    origin: "",
    destinations: "",
    durationDays: "1",
    durationNights: "0",
    includeTaxi: "",
    includeHotels: [],
    includeTours: [],
    customInclusions: "",
    exclusions: "",
    itinerary: [emptyItineraryRow(1)],
    discounts: [],
    departures: [],
    basePrice: "",
    currency: "INR",
    perPerson: true,
    maxPersons: "",
    childPrice: "",
    infantPrice: "0",
    extraPersonCharge: "",
    singleSupplement: "",
    videoUrl: "",
  };
}

function toCsv(arr: string[]): string {
  return arr.join(", ");
}
function isoDate(value: string): string {
  return value.length >= 10 ? value.slice(0, 10) : value;
}

export function tourPackageFormFromApi(pkg: TourPackageApi): TourPackageFormState {
  return {
    title: pkg.title,
    status: pkg.status === "active" ? "active" : "draft",
    packageType: pkg.packageType,
    difficultyLevel: pkg.difficultyLevel ?? "",
    description: pkg.description ?? "",
    highlights: toCsv(pkg.highlights),
    tags: toCsv(pkg.tags),
    origin: pkg.route.origin ?? "",
    destinations: toCsv(pkg.route.destinations),
    durationDays: String(pkg.route.durationDays),
    durationNights: String(pkg.route.durationNights),
    includeTaxi: pkg.includes.taxi ?? "",
    includeHotels: pkg.includes.hotels,
    includeTours: pkg.includes.tours,
    customInclusions: toCsv(pkg.customInclusions),
    exclusions: toCsv(pkg.exclusions),
    itinerary:
      pkg.itinerary.length > 0
        ? pkg.itinerary.map((d) => ({
            day: String(d.day),
            title: d.title ?? "",
            description: d.description ?? "",
            breakfast: d.meals.breakfast,
            lunch: d.meals.lunch,
            dinner: d.meals.dinner,
            accommodation: d.accommodation ?? "",
            activities: toCsv(d.activities),
          }))
        : [emptyItineraryRow(1)],
    discounts: pkg.pricing.discounts.map((d) => ({
      label: d.label,
      percent: String(d.percent),
      validUntil: d.validUntil ? isoDate(d.validUntil) : "",
    })),
    departures: pkg.departures.map((d) => ({
      date: isoDate(d.date),
      seatsTotal: d.seatsTotal !== undefined ? String(d.seatsTotal) : "",
      status: d.status,
    })),
    basePrice: String(pkg.pricing.basePrice),
    currency: pkg.pricing.currency,
    perPerson: pkg.pricing.perPerson,
    maxPersons: pkg.pricing.maxPersons !== undefined ? String(pkg.pricing.maxPersons) : "",
    childPrice: pkg.pricing.childPrice !== undefined ? String(pkg.pricing.childPrice) : "",
    infantPrice: String(pkg.pricing.infantPrice),
    extraPersonCharge: pkg.pricing.extraPersonCharge !== undefined ? String(pkg.pricing.extraPersonCharge) : "",
    singleSupplement: pkg.pricing.singleSupplement !== undefined ? String(pkg.pricing.singleSupplement) : "",
    videoUrl: pkg.videoUrl ?? "",
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

export function validateTourPackageForm(state: TourPackageFormState): string | null {
  if (!state.title.trim()) return "Title is required.";
  if (fromCsv(state.destinations).length === 0) return "Add at least one destination.";
  if (!(Number(state.durationDays) >= 1)) return "Duration (days) must be at least 1.";
  if (!(Number(state.basePrice) > 0)) return "Base price must be greater than 0.";
  return null;
}

export function buildTourPackageFormData(
  state: TourPackageFormState,
  files: TourPackageFiles,
): FormData {
  const payload = {
    title: state.title.trim(),
    status: state.status,
    packageType: state.packageType,
    difficultyLevel: state.difficultyLevel || undefined,
    description: state.description.trim() || undefined,
    highlights: fromCsv(state.highlights),
    tags: fromCsv(state.tags),
    route: {
      origin: state.origin.trim() || undefined,
      destinations: fromCsv(state.destinations),
      durationDays: Number(state.durationDays),
      durationNights: Number(state.durationNights),
    },
    includes: {
      taxi: state.includeTaxi || undefined,
      hotels: state.includeHotels,
      tours: state.includeTours,
    },
    customInclusions: fromCsv(state.customInclusions),
    exclusions: fromCsv(state.exclusions),
    itinerary: state.itinerary
      .filter((r) => r.title.trim() || r.description.trim() || r.accommodation.trim() || r.activities.trim())
      .map((r, i) => ({
        day: numOrUndef(r.day) ?? i + 1,
        title: r.title.trim() || undefined,
        description: r.description.trim() || undefined,
        meals: { breakfast: r.breakfast, lunch: r.lunch, dinner: r.dinner },
        accommodation: r.accommodation.trim() || undefined,
        activities: fromCsv(r.activities),
      })),
    pricing: {
      basePrice: Number(state.basePrice),
      currency: state.currency,
      perPerson: state.perPerson,
      maxPersons: numOrUndef(state.maxPersons),
      childPrice: numOrUndef(state.childPrice),
      infantPrice: numOrUndef(state.infantPrice) ?? 0,
      extraPersonCharge: numOrUndef(state.extraPersonCharge),
      singleSupplement: numOrUndef(state.singleSupplement),
      discounts: state.discounts
        .filter((d) => d.label.trim() && d.percent.trim())
        .map((d) => ({
          label: d.label.trim(),
          percent: Number(d.percent),
          validUntil: d.validUntil || undefined,
        })),
    },
    departures: state.departures
      .filter((d) => d.date.trim())
      .map((d) => ({
        date: d.date,
        seatsTotal: numOrUndef(d.seatsTotal),
        status: d.status,
      })),
    videoUrl: state.videoUrl.trim() || undefined,
  };

  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  if (files.thumbnail) form.append("thumbnail", files.thumbnail);
  files.images.forEach((file) => form.append("images", file));
  return form;
}
