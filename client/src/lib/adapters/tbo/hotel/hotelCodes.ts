import "server-only";
import { logRequest, logResponse, logError } from "../log";
import { TboNoResultsError } from "../errors";

// Endpoint: GET {TBOHolidays}/hotelcodelist (note: lowercase path).
// Per docs the request takes NO body — it's a global bulk dump of every
// HotelCode TBO knows about (multi-MB). Intended for offline pre-seeding,
// not request-time use; we cache aggressively (15 days).

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

interface CacheEntry {
  fetchedAt: number;
  codes: string[];
}

let cache: CacheEntry | null = null;
let inflight: Promise<string[]> | null = null;

interface TboHotelCodesResponse {
  HotelCodes?: Array<number | string>;
  Status?: { Code: number; Description: string };
  Error?: { ErrorCode: number; ErrorMessage: string };
}

export interface HotelCodesResult {
  codes: string[];
  fetchedAt: number;
}

async function fetchAll(): Promise<string[]> {
  const url = `${TBO_HOLIDAYS_URL}/hotelcodelist`;
  logRequest("HotelCodes", url, { method: "GET" });

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: basicAuthHeader(),
      },
      cache: "no-store",
    });
  } catch (err) {
    logError("HotelCodes", err);
    throw err;
  }

  const text = await res.text();
  let data: TboHotelCodesResponse;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `TBO hotelcodelist non-JSON (HTTP ${res.status}) from ${url}: ${text.slice(0, 200)}`,
    );
  }

  logResponse("HotelCodes", res.status, {
    Status: data.Status,
    Count: data.HotelCodes?.length ?? 0,
  });

  if (!res.ok) throw new Error(`TBO hotelcodelist HTTP ${res.status}`);
  if (data.Status && data.Status.Code !== 200) {
    throw new Error(
      `TBO hotelcodelist status ${data.Status.Code}: ${data.Status.Description}`,
    );
  }

  const raw = data.HotelCodes ?? [];
  if (raw.length === 0) throw new TboNoResultsError();

  // Normalize to strings — codes are integers in the response, but everywhere
  // else in this codebase HotelCode is a string.
  return raw.map((c) => String(c));
}

export async function tboGetAllHotelCodes(
  options: { force?: boolean } = {},
): Promise<HotelCodesResult> {
  const now = Date.now();
  if (!options.force && cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return { codes: cache.codes, fetchedAt: cache.fetchedAt };
  }
  if (inflight) {
    const codes = await inflight;
    return { codes, fetchedAt: cache?.fetchedAt ?? now };
  }
  inflight = fetchAll().finally(() => {
    inflight = null;
  });
  const codes = await inflight;
  cache = { fetchedAt: Date.now(), codes };
  return { codes, fetchedAt: cache.fetchedAt };
}

export function clearAllHotelCodesCache(): void {
  cache = null;
}
