export type TaxiCabCategory = "hatchback" | "sedan" | "suv" | "premium" | "traveller";

export type TaxiTripMode = "local" | "outstation" | "airport";

export type TaxiSort = "recommended" | "price-asc" | "price-desc" | "rating-desc";

export type TaxiSearchParams = {
  mode: TaxiTripMode;
  pickupCity: string;
  pickupLocation: string;
  destination: string;
  pickupDate: string;
  pickupTime: string;
  cabType: TaxiCabCategory | "any";
};

export type TaxiFilters = {
  minPrice: number;
  maxPrice: number;
  categories: TaxiCabCategory[];
  ac: "all" | "ac" | "non-ac";
  minRating: number;
  popularOnly: boolean;
};

export type TaxiPackage = {
  slug: string;
  title: string;
  cabName: string;
  category: TaxiCabCategory;
  mode: TaxiTripMode;
  pickupCity: string;
  pickupLocation: string;
  destination: string;
  duration: string;
  seats: number;
  bags: number;
  ac: boolean;
  fuelType: string;
  transmission: string;
  includedKm: number;
  extraKmCharge: number;
  driverAllowance: number;
  tollsEstimate: number;
  price: number;
  strikePrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  gallery: string[];
  tags: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: Array<{
    time: string;
    title: string;
    description: string;
  }>;
  specs: Array<{
    label: string;
    value: string;
  }>;
  cancellation: string[];
  terms: string[];
  reviews: Array<{
    name: string;
    route: string;
    rating: number;
    text: string;
  }>;
  popular?: boolean;
  recommended?: boolean;
};

export type TaxiBookingDraft = {
  leadPassenger: string;
  phone: string;
  email: string;
  passengers: number;
  pickupInstructions: string;
  coupon: string;
};

