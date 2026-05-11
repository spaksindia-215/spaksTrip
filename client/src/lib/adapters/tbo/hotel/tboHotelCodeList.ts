import "server-only";
import { logRequest, logResponse, logError } from "../log";
import { assertTboSuccess, TboNoResultsError } from "../errors";
import type {
  TboHotelCodeListItem,
  TboHotelCodeListResponse,
} from "../types";

// Endpoint: POST {TBOHolidays}/TBOHotelCodeList — city-wise list of hotel
// codes used as the precondition for /Hoteldetails. Same Basic Auth as the
// other static endpoints. Refresh ~every 15 days per TBO guidance.

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
const cache = new Map<string, { fetchedAt: number; hotels: TboHotelCodeListItem[] }>();

export async function tboGetHotelCodeListByCity(
  cityCode: string,
): Promise<TboHotelCodeListItem[]> {
  const code = String(cityCode).trim();
  if (!code) throw new Error("cityCode is required");

  const cached = cache.get(code);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.hotels;
  }

  const url = `${TBO_HOLIDAYS_URL}/TBOHotelCodeList`;
  // Per TBO docs the only request field is CityCode. Sending any extra field
  // (e.g. IsDetailedResponse) triggers HTTP 200 with Status.Code 400
  // "Invalid Request". Hotel metadata is always included by default.
  const reqBody = { CityCode: code };

  logRequest("TBO HotelCodeList", url, reqBody);

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
    logError("TBO HotelCodeList", err);
    throw err;
  }

  const text = await res.text();
  let data: TboHotelCodeListResponse;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `TBO TBOHotelCodeList non-JSON (HTTP ${res.status}) from ${url}: ${text.slice(0, 200)}`,
    );
  }

  logResponse("TBO HotelCodeList", res.status, {
    Status: data.Status,
    Count: data.Hotels?.length ?? 0,
  });

  if (!res.ok) throw new Error(`TBO TBOHotelCodeList HTTP ${res.status}`);
  assertTboSuccess(data.Error);

  if (data.Status && data.Status.Code !== 200) {
    throw new Error(
      `TBO TBOHotelCodeList status ${data.Status.Code}: ${data.Status.Description}`,
    );
  }

  const hotels = data.Hotels ?? [];
  if (hotels.length === 0) throw new TboNoResultsError();

  cache.set(code, { fetchedAt: Date.now(), hotels });
  console.log(`[TBO] TBOHotelCodeList(${code}) returned ${hotels.length} hotels`);
  return hotels;
}

export function clearTboHotelCodeListCache(): void {
  cache.clear();
}
