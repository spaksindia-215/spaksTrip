import type { TaxiPackage } from "@/types/taxi";

// City list powering the search dropdown. This is reference data (place names),
// not bookable inventory, so it is safe to keep in production.
export const taxiCities = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Hyderabad", "Pune", "Jaipur", "Agra", "Goa", "Kochi", "Mysore", "Udaipur"];

// No live taxi-package supplier is connected yet. The previously hardcoded
// sample packages (with placeholder prices) have been removed so production
// never shows or sells fabricated inventory. The landing/results pages render
// their "inventory unavailable" empty state, and detail/booking routes resolve
// to "not found". Re-populate this from a real source to restore listings.
export const taxiPackages: TaxiPackage[] = [];

export const popularTaxiRoutes = taxiPackages.filter((pkg) => pkg.popular || pkg.recommended).slice(0, 5);
