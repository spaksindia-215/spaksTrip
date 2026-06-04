import type { TaxiPackageApi } from "@/lib/partnerClient";

// Form-state shape + mappers for the dedicated TaxiPackage manager. Array fields
// are edited as comma/newline-separated strings and numbers as text inputs; the
// builder serializes a structured `payload` (the backend validator coerces and
// fully re-validates) plus the thumbnail/image files.

export type TaxiPackageItineraryRow = {
  day: string;
  title: string;
  description: string;
  activities: string;
  distance: string;
  overnight: string;
};

export type TaxiPackageFormState = {
  title: string;
  status: "draft" | "active";
  description: string;
  highlights: string;
  tags: string;
  // route
  origin: string;
  destinations: string;
  totalKm: string;
  durationDays: string;
  durationNights: string;
  // vehicle (TaxiListing id, or "")
  vehicle: string;
  // itinerary
  itinerary: TaxiPackageItineraryRow[];
  // pricing
  basePrice: string;
  currency: string;
  maxPersons: string;
  extraPersonCharge: string;
  tollsIncluded: boolean;
  driverAllowance: boolean;
  fuelIncluded: boolean;
  // inclusions
  inclusions: string;
  exclusions: string;
  // availability
  startDates: string;
  blackoutDates: string;
  advanceBookingDays: string;
};

export type TaxiPackageFiles = { thumbnail: File | null; images: File[] };

export function emptyItineraryRow(day: number): TaxiPackageItineraryRow {
  return { day: String(day), title: "", description: "", activities: "", distance: "", overnight: "" };
}

export function emptyTaxiPackageForm(): TaxiPackageFormState {
  return {
    title: "",
    status: "draft",
    description: "",
    highlights: "",
    tags: "",
    origin: "",
    destinations: "",
    totalKm: "",
    durationDays: "1",
    durationNights: "0",
    vehicle: "",
    itinerary: [emptyItineraryRow(1)],
    basePrice: "",
    currency: "INR",
    maxPersons: "",
    extraPersonCharge: "",
    tollsIncluded: false,
    driverAllowance: true,
    fuelIncluded: true,
    inclusions: "",
    exclusions: "",
    startDates: "",
    blackoutDates: "",
    advanceBookingDays: "3",
  };
}

function toCsv(arr: string[]): string {
  return arr.join(", ");
}

function isoDate(value: string): string {
  // Accept full ISO strings from the API; render as YYYY-MM-DD for date inputs.
  return value.length >= 10 ? value.slice(0, 10) : value;
}

export function taxiPackageFormFromApi(pkg: TaxiPackageApi): TaxiPackageFormState {
  return {
    title: pkg.title,
    status: pkg.status === "active" ? "active" : "draft",
    description: pkg.description ?? "",
    highlights: toCsv(pkg.highlights),
    tags: toCsv(pkg.tags),
    origin: pkg.route.origin,
    destinations: toCsv(pkg.route.destinations),
    totalKm: pkg.route.totalKm !== undefined ? String(pkg.route.totalKm) : "",
    durationDays: String(pkg.route.durationDays),
    durationNights: String(pkg.route.durationNights),
    vehicle: pkg.vehicle ?? "",
    itinerary:
      pkg.itinerary.length > 0
        ? pkg.itinerary.map((d) => ({
            day: String(d.day),
            title: d.title ?? "",
            description: d.description ?? "",
            activities: toCsv(d.activities),
            distance: d.distance !== undefined ? String(d.distance) : "",
            overnight: d.overnight ?? "",
          }))
        : [emptyItineraryRow(1)],
    basePrice: String(pkg.pricing.basePrice),
    currency: pkg.pricing.currency,
    maxPersons: pkg.pricing.maxPersons !== undefined ? String(pkg.pricing.maxPersons) : "",
    extraPersonCharge:
      pkg.pricing.extraPersonCharge !== undefined ? String(pkg.pricing.extraPersonCharge) : "",
    tollsIncluded: pkg.pricing.tollsIncluded,
    driverAllowance: pkg.pricing.driverAllowance,
    fuelIncluded: pkg.pricing.fuelIncluded,
    inclusions: toCsv(pkg.inclusions),
    exclusions: toCsv(pkg.exclusions),
    startDates: toCsv(pkg.startDates.map(isoDate)),
    blackoutDates: toCsv(pkg.blackoutDates.map(isoDate)),
    advanceBookingDays: String(pkg.advanceBookingDays),
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

// Light client-side validation; the server is the source of truth.
export function validateTaxiPackageForm(state: TaxiPackageFormState): string | null {
  if (!state.title.trim()) return "Title is required.";
  if (!state.origin.trim()) return "Route origin is required.";
  if (fromCsv(state.destinations).length === 0) return "Add at least one destination.";
  if (!(Number(state.durationDays) >= 1)) return "Duration (days) must be at least 1.";
  if (!(Number(state.basePrice) > 0)) return "Base price must be greater than 0.";
  return null;
}

export function buildTaxiPackageFormData(
  state: TaxiPackageFormState,
  files: TaxiPackageFiles,
): FormData {
  const payload = {
    title: state.title.trim(),
    status: state.status,
    description: state.description.trim() || undefined,
    highlights: fromCsv(state.highlights),
    tags: fromCsv(state.tags),
    route: {
      origin: state.origin.trim(),
      destinations: fromCsv(state.destinations),
      totalKm: numOrUndef(state.totalKm),
      durationDays: Number(state.durationDays),
      durationNights: Number(state.durationNights),
    },
    vehicle: state.vehicle || undefined,
    itinerary: state.itinerary
      .filter((r) => r.title.trim() || r.description.trim() || r.overnight.trim() || r.activities.trim())
      .map((r, i) => ({
        day: numOrUndef(r.day) ?? i + 1,
        title: r.title.trim() || undefined,
        description: r.description.trim() || undefined,
        activities: fromCsv(r.activities),
        distance: numOrUndef(r.distance),
        overnight: r.overnight.trim() || undefined,
      })),
    pricing: {
      basePrice: Number(state.basePrice),
      currency: state.currency,
      maxPersons: numOrUndef(state.maxPersons),
      extraPersonCharge: numOrUndef(state.extraPersonCharge),
      tollsIncluded: state.tollsIncluded,
      driverAllowance: state.driverAllowance,
      fuelIncluded: state.fuelIncluded,
    },
    inclusions: fromCsv(state.inclusions),
    exclusions: fromCsv(state.exclusions),
    startDates: fromCsv(state.startDates),
    blackoutDates: fromCsv(state.blackoutDates),
    advanceBookingDays: numOrUndef(state.advanceBookingDays) ?? 3,
  };

  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  if (files.thumbnail) form.append("thumbnail", files.thumbnail);
  files.images.forEach((file) => form.append("images", file));
  return form;
}
