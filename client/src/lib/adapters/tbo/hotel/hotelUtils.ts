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
  [["gym", "fitness", "health club", "fitness facilities"], "gym"],
  [["spa", "steam room", "hammam", "sauna"], "spa"],
  [["restaurant", "dining", "coffee", "cafe", "snack bar"], "restaurant"],
  [["bar", "lounge"], "bar"],
  [["parking", "car park"], "parking"],
  [["air condition", "air-condition"], "ac"],
  [["breakfast"], "breakfast"],
  [["pet"], "pet_friendly"],
  [["business center", "business centre", "conference"], "business_center"],
  [["shuttle", "airport transfer", "airport transportation", "transfer"], "airport_shuttle"],
  [["beach"], "beach_access"],
  [["rooftop"], "rooftop"],
];

function shouldFilterFacility(facility: string): boolean {
  const lower = facility.toLowerCase();
  // Filter out metadata and unhelpful entries
  const filterPatterns = [
    /^(conference space size|number of)/i, // "Conference space size (meters) - 44", "Number of meeting rooms"
    /wheelchair accessible.*no/i, // "Wheelchair accessible — no"
    /^free newspapers/i, // Generic meta info
  ];
  return filterPatterns.some((p) => p.test(lower));
}

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

export function getUnmatchedFacilities(raw: string[]): string[] {
  const unmatched: string[] = [];
  for (const str of raw) {
    if (shouldFilterFacility(str)) continue;
    const lower = str.toLowerCase();
    let isMatched = false;
    for (const [kws] of AMENITY_KEYWORDS) {
      if (kws.some((kw) => lower.includes(kw))) {
        isMatched = true;
        break;
      }
    }
    if (!isMatched) {
      unmatched.push(str);
    }
  }
  return unmatched;
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

function formatCancelPolicyDate(dateStr: string): string {
  if (!dateStr) return dateStr;

  // TBO returns dates without timezone markers, treat as UTC per API spec
  // Two formats observed:
  // 1. ISO 8601: "2024-04-18T00:00:00"
  // 2. DD-MM-YYYY: "15-04-2024 00:00:00"
  // Convert to IST (UTC+5:30) for display to Indian users
  try {
    let date: Date;

    if (dateStr.includes('T')) {
      // ISO 8601 format — add Z to mark as UTC
      const withZ = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
      date = new Date(withZ);
    } else if (dateStr.includes('-') && dateStr.includes(':')) {
      // DD-MM-YYYY HH:MM:SS format — parse manually
      const parts = dateStr.split(' ');
      const dateParts = parts[0].split('-');
      const timeParts = parts[1].split(':');

      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const year = parseInt(dateParts[2], 10);
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      const seconds = parseInt(timeParts[2], 10);

      date = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    } else {
      return dateStr;
    }

    // Format using IST timezone for display
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return dateStr;
  }
}

export function mapCancelPolicies(raw: TboSearchCancelPolicy[] | undefined): CancelPolicy[] {
  if (!raw) return [];
  return raw.map((p) => ({
    index: p.Index,
    fromDate: formatCancelPolicyDate(p.FromDate),
    chargeType: p.ChargeType,
    cancellationCharge: p.CancellationCharge,
  }));
}

export interface TboSupplement {
  Index: number | string;
  Type: string;
  Supplement: string;
  Amount: number;
  Currency: string;
}

export function mapSupplements(raw: TboSupplement[] | undefined): Supplement[] {
  if (!raw) return [];
  return raw.map((s) => ({
    index: String(s.Index),
    type: s.Type,
    description: s.Supplement,
    price: s.Amount,
    currency: s.Currency, // May differ from account default currency
  }));
}
