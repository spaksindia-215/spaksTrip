import "server-only";
import { logRequest, logResponse, logError } from "../log";
import { assertTboSuccess, TboNoResultsError } from "../errors";
import { MOCK_COUNTRIES } from "./mockData";

// NOTE on auth: CountryList lives on the TBO Holidays Hotel API
// (api.tbotechnology.in/TBOHolidays_HotelAPI), which is a *different* TBO
// product than the legacy session-token API used by flight/hotel-search
// (api.tektravels.com + Authenticate → TokenId). TBO Holidays uses HTTP
// Basic Auth, not the auth.ts TokenId flow. Do not migrate this to
// withRetry/tboBase — the TBO Holidays host ignores TokenId and the
// legacy host has no CountryList resource.

export interface TboCountry {
  Code: string;
  Name: string;
}

interface TboCountryListResponse {
  Status?: { Code: number; Description: string };
  CountryList?: TboCountry[];
  Error?: { ErrorCode: number; ErrorMessage: string };
}

const COUNTRY_LIST_URL =
  process.env.TBO_HOLIDAYS_HOTEL_API_URL?.replace(/\/$/, "") ??
  "https://api.tbotechnology.in/TBOHolidays_HotelAPI";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let cache: { fetchedAt: number; countries: TboCountry[] } | null = null;

// Per TBO Holidays Authorization doc, static-data endpoints (CountryList,
// CityList, HotelDetails, HotelCodes, TBOHotelCodeList) use a shared public
// credential pair, NOT the agency credentials used for Search/PreBook/Book.
// These are the credentials TBO publishes in their docs; override only if
// TBO rotates them.
const STATIC_API_USER = "TBOStaticAPITest";
const STATIC_API_PASS = "Tbo@11530818";

function basicAuthHeader(): string {
  const user = process.env.TBO_HOLIDAYS_STATIC_USER_NAME ?? STATIC_API_USER;
  const pass = process.env.TBO_HOLIDAYS_STATIC_PASSWORD ?? STATIC_API_PASS;
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

export async function tboGetCountryList(): Promise<TboCountry[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.countries;
  }

  const url = `${COUNTRY_LIST_URL}/CountryList`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: basicAuthHeader(),
  };

  logRequest("Country List", url, { auth: "Basic ***" });

  let res: Response;
  try {
    res = await fetch(url, { method: "GET", headers, cache: "no-store" });
  } catch (err) {
    logError("Country List", err);
    console.warn("[TBO] CountryList fetch failed, using mock data", err instanceof Error ? err.message : String(err));
    const sorted = [...MOCK_COUNTRIES].sort((a, b) => a.Name.localeCompare(b.Name));
    cache = { fetchedAt: Date.now(), countries: sorted };
    return sorted;
  }

  const text = await res.text();
  let data: TboCountryListResponse;
  try {
    data = JSON.parse(text);
  } catch {
    console.warn("[TBO] CountryList non-JSON response, using mock data");
    const sorted = [...MOCK_COUNTRIES].sort((a, b) => a.Name.localeCompare(b.Name));
    cache = { fetchedAt: Date.now(), countries: sorted };
    return sorted;
  }

  logResponse("Country List", res.status, {
    Status: data.Status,
    Count: data.CountryList?.length ?? 0,
  });

  if (!res.ok) {
    console.warn("[TBO] CountryList HTTP error, using mock data");
    const sorted = [...MOCK_COUNTRIES].sort((a, b) => a.Name.localeCompare(b.Name));
    cache = { fetchedAt: Date.now(), countries: sorted };
    return sorted;
  }

  // Try to validate the response, but fall back to mock data on error
  try {
    assertTboSuccess(data.Error);

    if (data.Status && data.Status.Code !== 200) {
      throw new Error(
        `TBO CountryList status ${data.Status.Code}: ${data.Status.Description}`,
      );
    }
  } catch (err) {
    console.warn("[TBO] CountryList validation failed, using mock data", err instanceof Error ? err.message : String(err));
    const sorted = [...MOCK_COUNTRIES].sort((a, b) => a.Name.localeCompare(b.Name));
    cache = { fetchedAt: Date.now(), countries: sorted };
    return sorted;
  }

  const countries = data.CountryList ?? [];
  if (countries.length === 0) {
    console.warn("[TBO] CountryList empty, using mock data");
    const sorted = [...MOCK_COUNTRIES].sort((a, b) => a.Name.localeCompare(b.Name));
    cache = { fetchedAt: Date.now(), countries: sorted };
    return sorted;
  }

  const sorted = [...countries].sort((a, b) => a.Name.localeCompare(b.Name));
  cache = { fetchedAt: Date.now(), countries: sorted };
  console.log(`[TBO] CountryList returned ${sorted.length} countries`);
  return sorted;
}

export function clearCountryListCache(): void {
  cache = null;
}
