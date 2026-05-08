import "server-only";
import { logRequest, logResponse, logError } from "../log";
import { assertTboSuccess } from "../errors";
import type {
  TboStaticHotelDetail,
  TboStaticHotelDetailsResponse,
} from "../types";

// Endpoint: POST {TBOHolidays}/Hoteldetails — static catalog data (no pricing,
// no TraceId, no dates). Auth: shared TBOHolidays static Basic credentials,
// same pair used by countryList.ts / cityList.ts. TBO docs recommend
// downloading & refreshing static data every ~15 days.

const TBO_HOLIDAYS_URL =
  process.env.TBO_HOLIDAYS_HOTEL_API_URL?.replace(/\/$/, "") ??
  "http://api.tbotechnology.in/TBOHolidays_HotelAPI";

const STATIC_API_USER = "TBOStaticAPITest";
const STATIC_API_PASS = "Tbo@11530818";

function basicAuthHeader(): string {
  const user = process.env.TBO_HOLIDAYS_STATIC_USER_NAME ?? STATIC_API_USER;
  const pass = process.env.TBO_HOLIDAYS_STATIC_PASSWORD ?? STATIC_API_PASS;
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

const CACHE_TTL_MS = 15 * 24 * 60 * 60 * 1000;
const cache = new Map<string, { fetchedAt: number; detail: TboStaticHotelDetail }>();

function cacheKey(hotelCode: string, language: string, withRooms: boolean): string {
  return `${hotelCode}|${language}|${withRooms ? 1 : 0}`;
}

export interface StaticHotelDetailsOptions {
  language?: string;
  isRoomDetailRequired?: boolean;
}

export async function tboGetStaticHotelDetails(
  hotelCode: string,
  options: StaticHotelDetailsOptions = {},
): Promise<TboStaticHotelDetail | null> {
  const code = String(hotelCode).trim();
  if (!code) throw new Error("hotelCode is required");

  const language = (options.language ?? "EN").toUpperCase();
  const isRoomDetailRequired = options.isRoomDetailRequired ?? true;
  const key = cacheKey(code, language, isRoomDetailRequired);

  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.detail;
  }

  const url = `${TBO_HOLIDAYS_URL}/Hoteldetails`;
  // Doc names the field "Hotelcodes" (plural with lowercase 'c'); accepts a
  // single code or comma-separated string.
  const reqBody = {
    Hotelcodes: code,
    Language: language,
    IsRoomDetailRequired: isRoomDetailRequired,
  };

  logRequest("Static Hoteldetails", url, reqBody);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: basicAuthHeader(),
      },
      body: JSON.stringify(reqBody),
      cache: "no-store",
    });
  } catch (err) {
    logError("Static Hoteldetails", err);
    throw err;
  }

  const text = await res.text();
  let data: TboStaticHotelDetailsResponse;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `TBO Hoteldetails non-JSON (HTTP ${res.status}) from ${url}: ${text.slice(0, 200)}`,
    );
  }

  logResponse("Static Hoteldetails", res.status, {
    Status: data.Status,
    Count: data.HotelDetails?.length ?? 0,
  });

  if (!res.ok) throw new Error(`TBO Hoteldetails HTTP ${res.status}`);
  assertTboSuccess(data.Error);

  if (data.Status && data.Status.Code !== 200) {
    throw new Error(
      `TBO Hoteldetails status ${data.Status.Code}: ${data.Status.Description}`,
    );
  }

  const detail = data.HotelDetails?.[0] ?? null;
  if (!detail) return null;

  cache.set(key, { fetchedAt: Date.now(), detail });
  return detail;
}

// Helpers for consumers (e.g. detail.ts merge step).

export function parseLatLong(map: string | undefined): { lat: number; lng: number } | null {
  if (!map) return null;
  const [latStr, lngStr] = map.split("|");
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function parseAttractions(
  attractions: TboStaticHotelDetail["Attractions"],
): string[] {
  if (!attractions) return [];
  const blobs = typeof attractions === "string"
    ? [attractions]
    : Object.values(attractions);
  const items: string[] = [];
  for (const blob of blobs) {
    if (typeof blob !== "string") continue;
    const parts = blob
      .replace(/<\/?p[^>]*>/gi, "")
      .split(/<br\s*\/?>(?:\s*)/i)
      .map((s) => s.replace(/<[^>]+>/g, "").trim())
      .filter(Boolean);
    items.push(...parts);
  }
  return items;
}

export function clearStaticHotelDetailsCache(): void {
  cache.clear();
}
