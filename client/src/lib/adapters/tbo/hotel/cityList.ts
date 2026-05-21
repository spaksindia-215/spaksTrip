import "server-only";
import { logRequest, logResponse, logError } from "../log";
import { assertTboSuccess, TboNoResultsError } from "../errors";
import { MOCK_CITIES } from "./mockData";

// Shares the TBO Holidays Hotel API host and static-data Basic Auth with
// countryList.ts. Static-data endpoints (CountryList, CityList,
// HotelDetails, HotelCodes, TBOHotelCodeList) all use the public test
// credentials documented at apidoc.tektravels.com/hotelnew/Authorization.aspx.

export interface TboCity {
  Code: string; // API docs say Integer; normalised to string on parse
  Name: string;
}

interface TboCityListResponse {
  Status?: { Code: number; Description: string };
  CityList?: Array<{ Code: number | string; Name: string }>;
  Error?: { ErrorCode: number; ErrorMessage: string };
}

const TBO_HOLIDAYS_URL =
  process.env.TBO_HOLIDAYS_HOTEL_API_URL?.replace(/\/$/, "") ??
  "https://api.tbotechnology.in/TBOHolidays_HotelAPI";

const STATIC_API_USER = "TBOStaticAPITest";
const STATIC_API_PASS = "Tbo@11530818";

function basicAuthHeader(): string {
  const user = process.env.TBO_HOLIDAYS_STATIC_USER_NAME ?? STATIC_API_USER;
  const pass = process.env.TBO_HOLIDAYS_STATIC_PASSWORD ?? STATIC_API_PASS;
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { fetchedAt: number; cities: TboCity[] }>();

export async function tboGetCityList(countryCode: string): Promise<TboCity[]> {
  const code = countryCode.trim().toUpperCase();
  if (!code) throw new Error("countryCode is required");

  const cached = cache.get(code);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.cities;
  }

  const url = `${TBO_HOLIDAYS_URL}/CityList`;
  const reqBody = { CountryCode: code };

  logRequest("City List", url, reqBody);

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
    logError("City List", err);
    console.warn(`[TBO] CityList fetch failed for ${code}, using mock data`, err instanceof Error ? err.message : String(err));
    const mockCities = MOCK_CITIES[code] ?? [];
    const sorted = [...mockCities].sort((a, b) => a.Name.localeCompare(b.Name));
    cache.set(code, { fetchedAt: Date.now(), cities: sorted });
    return sorted;
  }

  const text = await res.text();
  let data: TboCityListResponse;
  try {
    data = JSON.parse(text);
  } catch {
    console.warn(`[TBO] CityList non-JSON response for ${code}, using mock data`);
    const mockCities = MOCK_CITIES[code] ?? [];
    const sorted = [...mockCities].sort((a, b) => a.Name.localeCompare(b.Name));
    cache.set(code, { fetchedAt: Date.now(), cities: sorted });
    return sorted;
  }

  logResponse("City List", res.status, {
    Status: data.Status,
    Count: data.CityList?.length ?? 0,
  });

  if (!res.ok) {
    console.warn(`[TBO] CityList HTTP error for ${code}, using mock data`);
    const mockCities = MOCK_CITIES[code] ?? [];
    const sorted = [...mockCities].sort((a, b) => a.Name.localeCompare(b.Name));
    cache.set(code, { fetchedAt: Date.now(), cities: sorted });
    return sorted;
  }

  // Try to validate the response, but fall back to mock data on error
  try {
    assertTboSuccess(data.Error);

    if (data.Status && data.Status.Code !== 200) {
      throw new Error(
        `TBO CityList status ${data.Status.Code}: ${data.Status.Description}`,
      );
    }
  } catch (err) {
    console.warn(`[TBO] CityList validation failed for ${code}, using mock data`, err instanceof Error ? err.message : String(err));
    const mockCities = MOCK_CITIES[code] ?? [];
    const sorted = [...mockCities].sort((a, b) => a.Name.localeCompare(b.Name));
    cache.set(code, { fetchedAt: Date.now(), cities: sorted });
    return sorted;
  }

  const rawCities = data.CityList ?? [];
  if (rawCities.length === 0) {
    console.warn(`[TBO] CityList empty for ${code}, using mock data`);
    const mockCities = MOCK_CITIES[code] ?? [];
    const sorted = [...mockCities].sort((a, b) => a.Name.localeCompare(b.Name));
    cache.set(code, { fetchedAt: Date.now(), cities: sorted });
    return sorted;
  }

  // API docs declare Code as Integer; normalise to string so UI filters work
  const cities: TboCity[] = rawCities.map((c) => ({
    Code: String(c.Code),
    Name: c.Name,
  }));

  const sorted = [...cities].sort((a, b) => a.Name.localeCompare(b.Name));
  cache.set(code, { fetchedAt: Date.now(), cities: sorted });
  console.log(`[TBO] CityList(${code}) returned ${sorted.length} cities`);
  return sorted;
}

export function clearCityListCache(): void {
  cache.clear();
}
