// Shared enums for the typed partner-resource models (Hotel | Taxi | TaxiPackage
// | Tour | TourPackage | Cruise). Defined once here so individual schemas never
// hardcode their allowed values. Seeded for HotelListing; extend as the other
// five models land. Mirrors the const-array + derived-union pattern used by
// ../../partnerInventory.ts.

export const RESOURCE_STATUS = ["draft", "active", "paused", "suspended"] as const;
export type ResourceStatus = (typeof RESOURCE_STATUS)[number];

export const CURRENCY_CODES = ["INR", "USD", "EUR", "AED", "GBP"] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

// ── Hotel ────────────────────────────────────────────────────────────────────
// Canonical category values. The client form sends human-readable labels
// ("Hotel", "Guest House", …); the controller normalizes to these snake values.
export const HOTEL_TYPES = [
  "hotel",
  "resort",
  "villa",
  "homestay",
  "apartment",
  "guest_house",
] as const;
export type HotelType = (typeof HOTEL_TYPES)[number];

// Meal plan + discount values are kept exactly as the form submits them, so no
// normalization round-trip is needed.
export const HOTEL_MEAL_TYPES = [
  "Room Only",
  "Breakfast Included",
  "Half Board",
  "Full Board",
] as const;
export type HotelMealType = (typeof HOTEL_MEAL_TYPES)[number];

export const HOTEL_DISCOUNT_TYPES = ["Percentage", "Fixed Amount"] as const;
export type HotelDiscountType = (typeof HOTEL_DISCOUNT_TYPES)[number];

// The form's star-rating selector allows half-stars.
export const HOTEL_STAR_RATINGS = [1, 2, 3, 3.5, 4, 4.5, 5] as const;
export type HotelStarRating = (typeof HOTEL_STAR_RATINGS)[number];
