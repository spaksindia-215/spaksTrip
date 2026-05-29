import "server-only";
import type { Amenity, CancelPolicy, Supplement } from "@/lib/mock/hotels";
import type { Room } from "@/lib/mock/hotels";

export type DistributionType = "b2c" | "b2b";

export function basicAuthHeader(distributionType: DistributionType = "b2c"): string {
  let user: string | undefined;
  let pass: string | undefined;

  if (distributionType === "b2b") {
    // B2B channel: wholesale pricing (TotalFare)
    user = process.env.TBO_HOLIDAYS_B2B_USER_NAME;
    pass = process.env.TBO_HOLIDAYS_B2B_PASSWORD;
    if (!user || !pass) {
      throw new Error(
        "TBO Holidays B2B credentials missing. Set TBO_HOLIDAYS_B2B_USER_NAME and TBO_HOLIDAYS_B2B_PASSWORD in .env.local",
      );
    }
  } else {
    // B2C channel: retail pricing (RecommendedSellingRate)
    user = process.env.TBO_HOLIDAYS_USER_NAME;
    pass = process.env.TBO_HOLIDAYS_PASSWORD;
    if (!user || !pass) {
      throw new Error(
        "TBO Holidays B2C credentials missing. Set TBO_HOLIDAYS_USER_NAME and TBO_HOLIDAYS_PASSWORD in .env.local",
      );
    }
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

export interface TboSupplement {
  Index: number | string;
  Type: string;
  Description: string;
  Price: number;
  Currency: string;
}

export function mapSupplements(raw: TboSupplement[] | undefined): Supplement[] {
  if (!raw) return [];
  return raw.map((s) => ({
    index: String(s.Index),
    type: s.Type,
    description: s.Description,
    price: s.Price,
    currency: s.Currency, // May differ from account default currency
  }));
}
