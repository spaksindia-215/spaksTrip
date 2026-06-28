import type { SightseeingListingApi } from "@/lib/partnerClient";

// Form-state shape + mappers for the SightSeeing partner manager. Array fields are
// edited as comma/newline-separated strings. The builder serializes a structured
// `data` JSON field (the backend re-validates) plus image files. Mirrors tourForm.ts.

export const SIGHTSEEING_CATEGORIES = [
  "tour",
  "water_activity",
  "adventure",
  "cultural",
  "nature",
  "nightlife",
  "family",
  "attraction",
  "other",
] as const;

export const SIGHTSEEING_DIFFICULTY = ["easy", "moderate", "challenging"] as const;
export const SIGHTSEEING_PRICING_MODELS = ["per_person", "per_group", "tiered"] as const;
export const SIGHTSEEING_DURATION_UNITS = ["hours", "half_day", "full_day"] as const;
export const SIGHTSEEING_CANCELLATION_POLICIES = [
  "free_24h",
  "free_48h",
  "free_72h",
  "non_refundable",
  "custom",
] as const;
export const SIGHTSEEING_OPERATING_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const SIGHTSEEING_CURRENCIES = ["INR", "USD", "EUR", "AED", "GBP"] as const;

// Human labels for category/duration/policy values (used in selects & cards).
export const CATEGORY_LABELS: Record<string, string> = {
  tour: "Tour",
  water_activity: "Water Activity",
  adventure: "Adventure",
  cultural: "Cultural",
  nature: "Nature",
  nightlife: "Nightlife",
  family: "Family",
  attraction: "Attraction",
  other: "Other",
};

export const POLICY_LABELS: Record<string, string> = {
  free_24h: "Free cancellation up to 24h before",
  free_48h: "Free cancellation up to 48h before",
  free_72h: "Free cancellation up to 72h before",
  non_refundable: "Non-refundable",
  custom: "Custom (see terms)",
};

export type SightseeingFormState = {
  title: string;
  status: "draft" | "active";
  category: string;
  address: string;
  island: string;
  meetingInstructions: string;
  description: string;
  highlights: string;
  tags: string;
  languages: string;
  accessibility: string;
  durationValue: string;
  durationUnit: string;
  difficulty: string;
  minAge: string;
  maxAge: string;
  minGroupSize: string;
  maxGroupSize: string;
  pricingModel: string;
  currency: string;
  priceAdult: string;
  priceChild: string;
  priceInfant: string;
  priceGroup: string;
  inclusions: string;
  exclusions: string;
  whatToBring: string;
  availableDays: string[];
  timeSlots: string;
  blackoutDates: string;
  cancellationPolicy: string;
  bookingCutoffHours: string;
  termsAndConditions: string;
  videoUrl: string;
};

export type SightseeingFiles = { images: File[] };

export function emptySightseeingForm(): SightseeingFormState {
  return {
    title: "",
    status: "draft",
    category: "tour",
    address: "",
    island: "",
    meetingInstructions: "",
    description: "",
    highlights: "",
    tags: "",
    languages: "",
    accessibility: "",
    durationValue: "",
    durationUnit: "hours",
    difficulty: "",
    minAge: "",
    maxAge: "",
    minGroupSize: "1",
    maxGroupSize: "",
    pricingModel: "per_person",
    currency: "INR",
    priceAdult: "",
    priceChild: "",
    priceInfant: "",
    priceGroup: "",
    inclusions: "",
    exclusions: "",
    whatToBring: "",
    availableDays: [],
    timeSlots: "",
    blackoutDates: "",
    cancellationPolicy: "free_24h",
    bookingCutoffHours: "6",
    termsAndConditions: "",
    videoUrl: "",
  };
}

function toCsv(arr: string[]): string {
  return arr.join(", ");
}
function isoDate(value: string): string {
  return value.length >= 10 ? value.slice(0, 10) : value;
}
function fromCsv(value: string): string[] {
  return Array.from(new Set(value.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)));
}
function numOrUndef(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function sightseeingFormFromApi(a: SightseeingListingApi): SightseeingFormState {
  return {
    title: a.title,
    status: a.status === "active" ? "active" : "draft",
    category: a.category,
    address: a.location?.address ?? "",
    island: a.location?.island ?? "",
    meetingInstructions: a.meetingPoint?.instructions ?? "",
    description: a.description ?? "",
    highlights: toCsv(a.highlights),
    tags: toCsv(a.tags),
    languages: toCsv(a.languages),
    accessibility: toCsv(a.accessibility),
    durationValue: a.duration?.value !== undefined ? String(a.duration.value) : "",
    durationUnit: a.duration?.unit ?? "hours",
    difficulty: a.difficulty ?? "",
    minAge: a.ageRestriction?.min !== undefined ? String(a.ageRestriction.min) : "",
    maxAge: a.ageRestriction?.max !== undefined ? String(a.ageRestriction.max) : "",
    minGroupSize: String(a.groupSize?.min ?? 1),
    maxGroupSize: a.groupSize?.max !== undefined ? String(a.groupSize.max) : "",
    pricingModel: a.pricingModel,
    currency: a.currency,
    priceAdult: a.pricing?.adult !== undefined ? String(a.pricing.adult) : "",
    priceChild: a.pricing?.child !== undefined ? String(a.pricing.child) : "",
    priceInfant: a.pricing?.infant !== undefined ? String(a.pricing.infant) : "",
    priceGroup: a.pricing?.groupPrice !== undefined ? String(a.pricing.groupPrice) : "",
    inclusions: toCsv(a.inclusions),
    exclusions: toCsv(a.exclusions),
    whatToBring: toCsv(a.whatToBring),
    availableDays: a.availableDays,
    timeSlots: toCsv(a.timeSlots),
    blackoutDates: "",
    cancellationPolicy: a.cancellationPolicy,
    bookingCutoffHours: String(a.bookingCutoffHours),
    termsAndConditions: a.termsAndConditions ?? "",
    videoUrl: a.videoUrl ?? "",
  };
}

export function validateSightseeingForm(state: SightseeingFormState): string | null {
  if (!state.title.trim()) return "Title is required.";
  if (!state.category) return "Category is required.";
  if (state.pricingModel === "per_group") {
    if (!(Number(state.priceGroup) >= 0)) return "Group price is required for per-group pricing.";
  } else if (!(Number(state.priceAdult) >= 0)) {
    return "Adult price is required.";
  }
  return null;
}

export function buildSightseeingFormData(state: SightseeingFormState, files: SightseeingFiles): FormData {
  const data = {
    title: state.title.trim(),
    status: state.status,
    category: state.category,
    location: {
      address: state.address.trim() || undefined,
      island: state.island.trim() || undefined,
    },
    meetingPoint: { instructions: state.meetingInstructions.trim() || undefined },
    description: state.description.trim() || undefined,
    highlights: fromCsv(state.highlights),
    tags: fromCsv(state.tags),
    languages: fromCsv(state.languages),
    accessibility: fromCsv(state.accessibility),
    duration: { value: numOrUndef(state.durationValue), unit: state.durationUnit },
    difficulty: state.difficulty || undefined,
    ageRestriction: { min: numOrUndef(state.minAge), max: numOrUndef(state.maxAge) },
    groupSize: { min: numOrUndef(state.minGroupSize) ?? 1, max: numOrUndef(state.maxGroupSize) },
    pricingModel: state.pricingModel,
    currency: state.currency,
    pricing: {
      adult: numOrUndef(state.priceAdult),
      child: numOrUndef(state.priceChild),
      infant: numOrUndef(state.priceInfant),
      groupPrice: numOrUndef(state.priceGroup),
    },
    inclusions: fromCsv(state.inclusions),
    exclusions: fromCsv(state.exclusions),
    whatToBring: fromCsv(state.whatToBring),
    availableDays: state.availableDays,
    timeSlots: fromCsv(state.timeSlots),
    blackoutDates: fromCsv(state.blackoutDates).map(isoDate),
    cancellationPolicy: state.cancellationPolicy,
    bookingCutoffHours: numOrUndef(state.bookingCutoffHours) ?? 6,
    termsAndConditions: state.termsAndConditions.trim() || undefined,
    videoUrl: state.videoUrl.trim() || undefined,
  };

  const form = new FormData();
  form.append("data", JSON.stringify(data));
  files.images.forEach((file) => form.append("images", file));
  return form;
}
