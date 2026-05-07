import type { UserRole } from "@/lib/authClient";

export const TAXI_PACKAGE_ROOT = "/taxi-package";
export const TAXI_PACKAGE_DESTINATIONS_ROUTE = "/taxi-package/destinations";

/** Partners and agents have taxi management access. */
export function isTaxiManagerRole(role: UserRole): boolean {
  return role === "partner" || role === "agent";
}

/** Customers browsing taxi packages are sent straight to destinations. */
export function shouldOpenTaxiDestinations(role: UserRole): boolean {
  return role === "customer";
}
