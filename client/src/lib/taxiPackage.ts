import { taxiPackages } from "@/data/taxi/packages";
import type { TaxiCabCategory, TaxiFilters, TaxiPackage, TaxiSearchParams, TaxiTripMode } from "@/types/taxi";

export const TAXI_CATEGORIES: Array<{ value: TaxiCabCategory; label: string }> = [
  { value: "hatchback", label: "Hatchback" },
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "premium", label: "Premium" },
  { value: "traveller", label: "Traveller" },
];

export const TAXI_MODES: Array<{ value: TaxiTripMode; label: string; description: string }> = [
  { value: "outstation", label: "Outstation", description: "Intercity one-way or return" },
  { value: "local", label: "Local", description: "Hourly city packages" },
  { value: "airport", label: "Airport", description: "Pickup and drop transfers" },
];

export const defaultTaxiSearch: TaxiSearchParams = {
  mode: "outstation",
  pickupCity: "Delhi",
  pickupLocation: "Central Delhi",
  destination: "Agra",
  pickupDate: new Date().toISOString().slice(0, 10),
  pickupTime: "09:00",
  cabType: "any",
};

export const defaultTaxiFilters: TaxiFilters = {
  minPrice: 0,
  maxPrice: 20000,
  categories: [],
  ac: "all",
  minRating: 0,
  popularOnly: false,
};

export function categoryLabel(category: TaxiCabCategory): string {
  return TAXI_CATEGORIES.find((item) => item.value === category)?.label ?? category;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function findTaxiPackage(slug: string): TaxiPackage | undefined {
  return taxiPackages.find((pkg) => pkg.slug === slug);
}

export function getSimilarTaxiPackages(pkg: TaxiPackage): TaxiPackage[] {
  return taxiPackages
    .filter((item) => item.slug !== pkg.slug && (item.category === pkg.category || item.pickupCity === pkg.pickupCity || item.mode === pkg.mode))
    .slice(0, 3);
}

export function fareBreakdown(pkg: TaxiPackage, coupon: string) {
  const baseFare = pkg.price;
  const serviceFee = Math.round(baseFare * 0.035);
  const taxes = Math.round((baseFare + serviceFee) * 0.05);
  const couponDiscount = coupon.trim().toUpperCase() === "SPAKS500" ? Math.min(500, baseFare) : 0;

  return {
    baseFare,
    serviceFee,
    taxes,
    couponDiscount,
    total: baseFare + serviceFee + taxes - couponDiscount,
  };
}

export function searchParamsToQuery(params: TaxiSearchParams): URLSearchParams {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    query.set(key, String(value));
  });
  return query;
}

export function parseTaxiSearchParams(params: URLSearchParams): TaxiSearchParams {
  const mode = parseTripMode(params.get("mode"));
  const cabType = parseCabType(params.get("cabType"));

  return {
    mode,
    pickupCity: params.get("pickupCity") || defaultTaxiSearch.pickupCity,
    pickupLocation: params.get("pickupLocation") || defaultTaxiSearch.pickupLocation,
    destination: params.get("destination") || defaultTaxiSearch.destination,
    pickupDate: params.get("pickupDate") || defaultTaxiSearch.pickupDate,
    pickupTime: params.get("pickupTime") || defaultTaxiSearch.pickupTime,
    cabType,
  };
}

function parseTripMode(value: string | null): TaxiTripMode {
  return TAXI_MODES.some((mode) => mode.value === value) ? (value as TaxiTripMode) : defaultTaxiSearch.mode;
}

function parseCabType(value: string | null): TaxiSearchParams["cabType"] {
  if (value === "any") return "any";
  return TAXI_CATEGORIES.some((category) => category.value === value) ? (value as TaxiCabCategory) : defaultTaxiSearch.cabType;
}

