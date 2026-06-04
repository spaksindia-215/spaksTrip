import type { CruiseListingApi } from "@/lib/partnerClient";

// Form-state shape + mappers for the dedicated Cruise manager. Stops, cabins,
// and departures are dynamic rows. Per-departure cabin availability is kept on
// the model for API consumers but omitted from this form for simplicity.

export const CRUISE_TYPES = ["river", "sea", "backwater", "luxury", "budget"] as const;
export const CABIN_TYPES = ["interior", "ocean_view", "balcony", "suite"] as const;
export const CRUISE_DEPARTURE_STATUS = ["open", "filling_fast", "closed"] as const;
export const CRUISE_CURRENCIES = ["INR", "USD", "EUR", "AED", "GBP"] as const;

export type CruiseStopRow = { port: string; arrivalTime: string; departureTime: string };
export type CruiseCabinRow = {
  type: string;
  label: string;
  maxOccupancy: string;
  pricePerPerson: string;
  totalCabins: string;
  amenities: string;
  isRefundable: boolean;
};
export type CruiseDepartureRow = { date: string; status: string };

export type CruiseFormState = {
  cruiseName: string;
  status: "draft" | "active";
  cruiseType: string;
  description: string;
  highlights: string;
  tags: string;
  // vessel
  vesselName: string;
  vesselOperator: string;
  vesselTotalDecks: string;
  vesselBuiltYear: string;
  // route
  departurePort: string;
  arrivalPort: string;
  durationDays: string;
  durationNights: string;
  stops: CruiseStopRow[];
  // cabins
  currency: string;
  cabins: CruiseCabinRow[];
  // amenities / dining
  shipAmenities: string;
  diningOptions: string;
  mealBreakfast: boolean;
  mealLunch: boolean;
  mealDinner: boolean;
  // departures
  departures: CruiseDepartureRow[];
  // policies
  freeCancelDays: string;
  chargePercent: string;
  minAge: string;
  maxAge: string;
};

export type CruiseFiles = { vesselImages: File[] };

export function emptyCabinRow(): CruiseCabinRow {
  return { type: "balcony", label: "", maxOccupancy: "", pricePerPerson: "", totalCabins: "", amenities: "", isRefundable: true };
}

export function emptyCruiseForm(): CruiseFormState {
  return {
    cruiseName: "",
    status: "draft",
    cruiseType: "river",
    description: "",
    highlights: "",
    tags: "",
    vesselName: "",
    vesselOperator: "",
    vesselTotalDecks: "",
    vesselBuiltYear: "",
    departurePort: "",
    arrivalPort: "",
    durationDays: "1",
    durationNights: "0",
    stops: [],
    currency: "INR",
    cabins: [emptyCabinRow()],
    shipAmenities: "",
    diningOptions: "",
    mealBreakfast: false,
    mealLunch: false,
    mealDinner: false,
    departures: [],
    freeCancelDays: "",
    chargePercent: "",
    minAge: "",
    maxAge: "",
  };
}

function toCsv(arr: string[]): string {
  return arr.join(", ");
}
function isoDate(value: string): string {
  return value.length >= 10 ? value.slice(0, 10) : value;
}

export function cruiseFormFromApi(c: CruiseListingApi): CruiseFormState {
  return {
    cruiseName: c.cruiseName,
    status: c.status === "active" ? "active" : "draft",
    cruiseType: c.cruiseType,
    description: c.description ?? "",
    highlights: toCsv(c.highlights),
    tags: toCsv(c.tags),
    vesselName: c.vessel.name ?? "",
    vesselOperator: c.vessel.operator ?? "",
    vesselTotalDecks: c.vessel.totalDecks !== undefined ? String(c.vessel.totalDecks) : "",
    vesselBuiltYear: c.vessel.builtYear !== undefined ? String(c.vessel.builtYear) : "",
    departurePort: c.route.departurePort,
    arrivalPort: c.route.arrivalPort ?? "",
    durationDays: String(c.route.durationDays),
    durationNights: c.route.durationNights !== undefined ? String(c.route.durationNights) : "",
    stops: c.route.stops.map((s) => ({ port: s.port ?? "", arrivalTime: s.arrivalTime ?? "", departureTime: s.departureTime ?? "" })),
    currency: c.cabins[0]?.currency ?? "INR",
    cabins:
      c.cabins.length > 0
        ? c.cabins.map((cb) => ({
            type: cb.type,
            label: cb.label ?? "",
            maxOccupancy: cb.maxOccupancy !== undefined ? String(cb.maxOccupancy) : "",
            pricePerPerson: String(cb.pricePerPerson),
            totalCabins: cb.totalCabins !== undefined ? String(cb.totalCabins) : "",
            amenities: toCsv(cb.amenities),
            isRefundable: cb.isRefundable,
          }))
        : [emptyCabinRow()],
    shipAmenities: toCsv(c.shipAmenities),
    diningOptions: toCsv(c.diningOptions),
    mealBreakfast: c.mealsIncluded.breakfast,
    mealLunch: c.mealsIncluded.lunch,
    mealDinner: c.mealsIncluded.dinner,
    departures: c.departures.map((d) => ({ date: isoDate(d.date), status: d.status })),
    freeCancelDays: c.cancellationPolicy.freeCancelDays !== undefined ? String(c.cancellationPolicy.freeCancelDays) : "",
    chargePercent: c.cancellationPolicy.chargePercent !== undefined ? String(c.cancellationPolicy.chargePercent) : "",
    minAge: c.boardingAge.minAge !== undefined ? String(c.boardingAge.minAge) : "",
    maxAge: c.boardingAge.maxAge !== undefined ? String(c.boardingAge.maxAge) : "",
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

export function validateCruiseForm(state: CruiseFormState): string | null {
  if (!state.cruiseName.trim()) return "Cruise name is required.";
  if (!state.departurePort.trim()) return "Departure port is required.";
  if (!(Number(state.durationDays) >= 1)) return "Duration (days) must be at least 1.";
  const cabins = state.cabins.filter((c) => c.pricePerPerson.trim());
  if (cabins.length === 0) return "Add at least one cabin with a price.";
  return null;
}

export function buildCruiseFormData(state: CruiseFormState, files: CruiseFiles): FormData {
  const payload = {
    cruiseName: state.cruiseName.trim(),
    status: state.status,
    cruiseType: state.cruiseType,
    description: state.description.trim() || undefined,
    highlights: fromCsv(state.highlights),
    tags: fromCsv(state.tags),
    vessel: {
      name: state.vesselName.trim() || undefined,
      operator: state.vesselOperator.trim() || undefined,
      totalDecks: numOrUndef(state.vesselTotalDecks),
      builtYear: numOrUndef(state.vesselBuiltYear),
    },
    route: {
      departurePort: state.departurePort.trim(),
      arrivalPort: state.arrivalPort.trim() || undefined,
      durationDays: Number(state.durationDays),
      durationNights: numOrUndef(state.durationNights),
      stops: state.stops
        .filter((s) => s.port.trim() || s.arrivalTime.trim() || s.departureTime.trim())
        .map((s) => ({ port: s.port.trim() || undefined, arrivalTime: s.arrivalTime.trim() || undefined, departureTime: s.departureTime.trim() || undefined })),
    },
    cabins: state.cabins
      .filter((c) => c.pricePerPerson.trim())
      .map((c) => ({
        type: c.type,
        label: c.label.trim() || undefined,
        maxOccupancy: numOrUndef(c.maxOccupancy),
        pricePerPerson: Number(c.pricePerPerson),
        currency: state.currency,
        totalCabins: numOrUndef(c.totalCabins),
        amenities: fromCsv(c.amenities),
        isRefundable: c.isRefundable,
      })),
    shipAmenities: fromCsv(state.shipAmenities),
    diningOptions: fromCsv(state.diningOptions),
    mealsIncluded: { breakfast: state.mealBreakfast, lunch: state.mealLunch, dinner: state.mealDinner },
    departures: state.departures
      .filter((d) => d.date.trim())
      .map((d) => ({ date: d.date, status: d.status })),
    cancellationPolicy: {
      freeCancelDays: numOrUndef(state.freeCancelDays),
      chargePercent: numOrUndef(state.chargePercent),
    },
    boardingAge: { minAge: numOrUndef(state.minAge), maxAge: numOrUndef(state.maxAge) },
  };

  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  files.vesselImages.forEach((file) => form.append("vesselImages", file));
  return form;
}
