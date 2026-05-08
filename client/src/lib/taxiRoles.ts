// Taxi package routes and role-based access control
export const TAXI_PACKAGE_DESTINATIONS_ROUTE = "/taxi-package/destinations";

// Determine if a user role should be redirected to the destinations page
export function shouldOpenTaxiDestinations(role: string | undefined): boolean {
  return role === "taxi-partner" || role === "partner";
}

// Determine if a user role is a taxi manager/partner
export function isTaxiManagerRole(role: string | undefined): boolean {
  return role === "taxi-partner" || role === "partner";
}

// Add your taxi role to the given list if the user has taxi manager role
export const ADD_YOUR_TAXI_ROUTE = "/taxi-package/add-taxi";

// Get the appropriate taxi package href based on user role
export function getTaxiPackageHref(role: string | undefined): string {
  if (isTaxiManagerRole(role)) {
    return TAXI_PACKAGE_DESTINATIONS_ROUTE;
  }
  return "/taxi-package";
}
