import "server-only";
import type { Amenity, CancelPolicy } from "@/lib/mock/hotels";
import type { Room } from "@/lib/mock/hotels";

export function basicAuthHeader(): string {
  const user = process.env.TBO_HOLIDAYS_USER_NAME;
  const pass = process.env.TBO_HOLIDAYS_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      "TBO Holidays agency credentials missing. Set TBO_HOLIDAYS_USER_NAME and TBO_HOLIDAYS_PASSWORD in .env.local",
    );
  }
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

export const AMENITY_KEYWORDS: Array<[string[], Amenity]> = [
  [["wi-fi", "wifi", "internet", "wireless"], "wifi"],
  [["pool", "swimming"], "pool"],
  [["gym", "fitness", "health club"], "gym"],
  [["spa"], "spa"],
  [["restaurant", "dining"], "restaurant"],
  [["bar", "lounge"], "bar"],
  [["parking", "car park"], "parking"],
  [["air condition", "air-condition"], "ac"],
  [["breakfast"], "breakfast"],
  [["pet"], "pet_friendly"],
  [["business center", "business centre"], "business_center"],
  [["shuttle", "airport transfer"], "airport_shuttle"],
  [["beach"], "beach_access"],
  [["rooftop"], "rooftop"],
];

export function mapAmenities(raw: string[]): Amenity[] {
  const found = new Set<Amenity>();
  for (const str of raw) {
    const lower = str.toLowerCase();
    for (const [kws, amenity] of AMENITY_KEYWORDS) {
      if (kws.some((kw) => lower.includes(kw))) {
        found.add(amenity);
        break;
      }
    }
  }
  return Array.from(found);
}

export function mapRoomType(name: string): Room["type"] {
  const lower = name.toLowerCase();
  if (lower.includes("suite")) return "suite";
  if (lower.includes("villa")) return "villa";
  if (lower.includes("deluxe") || lower.includes("superior") || lower.includes("premium"))
    return "deluxe";
  return "standard";
}

export function mapBedType(name: string): Room["bedType"] {
  const lower = name.toLowerCase();
  if (lower.includes("king")) return "king";
  if (lower.includes("queen")) return "queen";
  if (lower.includes("twin") || lower.includes("double")) return "double";
  if (lower.includes("single")) return "single";
  return "double";
}

export interface TboSearchCancelPolicy {
  Index: string;
  FromDate: string;
  ChargeType: string;
  CancellationCharge: number;
}

export function mapCancelPolicies(raw: TboSearchCancelPolicy[] | undefined): CancelPolicy[] {
  if (!raw) return [];
  return raw.map((p) => ({
    index: p.Index,
    fromDate: p.FromDate,
    chargeType: p.ChargeType,
    cancellationCharge: p.CancellationCharge,
  }));
}
