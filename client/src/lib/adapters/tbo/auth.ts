import "server-only";
import { assertTboSuccess, TboInvalidSessionError } from "./errors";
import { logRequest, logResponse, logError } from "./log";
import type { TboAuthResponse } from "./types";

// Per HTML FAQ Q3: token is valid from 00:00:00 till 23:59:59 of the current
// day. Bullet on the page also notes "After 12:02 AM no new booking with old
// token." So we expire the cache at end-of-day, with a small safety buffer.
const TOKEN_RENEW_BUFFER_MS = 5 * 60 * 1000;

// Response Timeout Benchmarking (CLAUDE.md):
//   Book/Ticket may take up to 300s — set a 300s timeout to avoid financial loss.
//   All other methods (Search/FareQuote/SSR/GetBookingDetails) → 60s.
export const TBO_BOOK_TIMEOUT_MS = 300_000;
export const TBO_DEFAULT_TIMEOUT_MS = 60_000;

// Search & Book URL Validation (CLAUDE.md): TBO's docs name two services — a Search
// service (BookingEngineService_Air) and a Booking service (BookingEngineService_AirBook).
// We keep the routing centralised in these two constants so the split is one line to flip.
//
// Confirmed against this account/host (api.tektravels.com): the "_AirBook" path is
// NOT provisioned — FareQuote/Book there return "Invalid Resource Requested". Search
// and every booking-flow method work on "_Air", which is what the certified samples
// and the passing test cases use. So both constants point at BookingEngineService_Air.
//
// If TBO provisions a dedicated _AirBook host/path for production, change AIR_BOOK_SVC
// to "BookingEngineService_AirBook/AirService.svc/rest" (and/or its host) and re-test
// against the live endpoint before shipping.
export const AIR_SEARCH_SVC = "BookingEngineService_Air/AirService.svc/rest";
export const AIR_BOOK_SVC = "BookingEngineService_Air/AirService.svc/rest";

function endOfDayMs(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

interface TokenEntry {
  tokenId: string;
  expiresAt: number;
}

let tokenCache: TokenEntry | null = null;
let refreshPromise: Promise<string> | null = null;

function getBaseUrl(): string {
  const url = process.env.TBO_API_URL;
  if (!url) throw new Error("TBO_API_URL not set in .env.local");
  return url.replace(/\/$/, "");
}

/**
 * Returns the base URL for a given TBO service.
 *
 * Priority: explicit env var (e.g. TBO_SHARED_API_URL) → derive from TBO_API_URL
 * keeping its protocol but replacing the hostname with the service-specific host.
 *
 * TBO hosts per service:
 *   shared → sharedapi.tektravels.com  (/SharedData.svc/rest/...)
 *   air    → api.tektravels.com        (/BookingEngineService_Air/...)
 *   hotel  → api.tektravels.com        (/HotelAPI/...)
 *
 * This ensures that regardless of whether TBO_API_URL is set to
 * api.tektravels.com, b2b.tektravels.com, or any other host, each service
 * always reaches the correct endpoint.
 */
function getServiceBaseUrl(envKey: string, fallbackHost: string): string {
  const explicit = process.env[envKey];
  if (explicit) return explicit.replace(/\/$/, "");
  const base = getBaseUrl();
  try {
    const parsed = new URL(base);
    parsed.hostname = fallbackHost;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return `https://${fallbackHost}`;
  }
}

export function tboApiUrl(
  path: string,
  service: "shared" | "air" | "hotel" = "air",
): string {
  const cleanPath = path.replace(/^\//, "");
  const baseUrl =
    service === "shared"
      ? getServiceBaseUrl("TBO_SHARED_API_URL", "sharedapi.tektravels.com")
      : service === "hotel"
        ? getServiceBaseUrl("TBO_HOTEL_API_URL", "api.tektravels.com")
        : getServiceBaseUrl("TBO_AIR_API_URL", "api.tektravels.com");
  return `${baseUrl}/${cleanPath}`;
}

function maskToken(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) return "<empty>";
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}***${value.slice(-2)}`;
}

async function authenticate(): Promise<string> {
  const userName = process.env.TBO_USER_NAME;
  const password = process.env.TBO_PASSWORD;
  const endUserIp = process.env.TBO_END_USER_IP ?? "1.1.1.1";
  const clientId = process.env.TBO_CLIENT_ID ?? "ApiIntegrationNew";

  if (!userName || !password) {
    throw new Error(
      "TBO credentials not configured. Set TBO_USER_NAME and TBO_PASSWORD in .env.local",
    );
  }

  // Per TBO B2B docs: auth endpoint is /SharedServices/SharedData.svc/rest/Authenticate
  const url = tboApiUrl("SharedData.svc/rest/Authenticate", "shared");
  const body = {
    ClientId: clientId,
    UserName: userName,
    Password: password,
    EndUserIp: endUserIp,
  };

  logRequest("Authenticate", url, { ...body, Password: "***" });

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err) {
    logError("Authenticate", err);
    throw new Error(
      `TBO auth network error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const text = await res.text();

  if (!res.ok) {
    logError("Authenticate", new Error(`HTTP ${res.status}`), {
      status: res.status,
      bodyPreview: text.slice(0, 500),
    });
    throw new Error(`TBO auth HTTP ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
  }

  let data: TboAuthResponse;
  try {
    data = JSON.parse(text);
  } catch {
    logError("Authenticate", new Error("non-JSON response"), {
      status: res.status,
      bodyPreview: text.slice(0, 500),
    });
    throw new Error(
      `TBO auth returned non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`,
    );
  }

  logResponse("Authenticate", res.status, {
    ...data,
    TokenId: maskToken(data.TokenId),
  });

  if (data.Status !== 1) {
    throw new Error(
      `TBO auth returned non-success Status (expected 1, got ${data.Status ?? "undefined"})`,
    );
  }

  assertTboSuccess(data.Error);

  if (!data.TokenId) {
    throw new Error("TBO auth response missing TokenId");
  }

  tokenCache = { tokenId: data.TokenId, expiresAt: endOfDayMs() };
  return data.TokenId;
}

export async function getTboToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt - Date.now() > TOKEN_RENEW_BUFFER_MS) {
    return tokenCache.tokenId;
  }

  if (refreshPromise) return refreshPromise;

  refreshPromise = authenticate().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export function clearTokenCache(): void {
  tokenCache = null;
  refreshPromise = null;
}

export async function withRetry<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const token = await getTboToken();
  try {
    return await fn(token);
  } catch (err) {
    if (err instanceof TboInvalidSessionError) {
      clearTokenCache();
      const freshToken = await getTboToken();
      return fn(freshToken);
    }
    throw err;
  }
}

export function tboBase(token: string): { TokenId: string; EndUserIp: string } {
  return {
    TokenId: token,
    EndUserIp: process.env.TBO_END_USER_IP ?? "1.1.1.1",
  };
}
