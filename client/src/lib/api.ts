type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type JsonBody = JsonValue | Record<string, unknown>;

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: JsonBody;
  skipRefresh?: boolean;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Relative paths so the browser calls the Next.js proxy routes on the same
// origin (Vercel), which forwards to Railway and re-stamps the cookies onto
// the Vercel domain. This allows server components to read auth cookies via
// cookies().
function buildUrl(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readMessage(payload: unknown, fallback: string): string {
  if (isPlainObject(payload)) {
    const error = payload.error;
    if (typeof error === "string" && error.trim()) return error;

    const message = payload.message;
    if (typeof message === "string" && message.trim()) return message;
  }

  return fallback;
}

async function readPayload(response: Response): Promise<unknown> {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text.length > 0 ? text : null;
}

async function request<T>(path: string, options: ApiOptions, allowRefresh: boolean): Promise<T> {
  const { body, headers, skipRefresh, ...init } = options;
  const requestHeaders = new Headers(headers);

  let requestBody: BodyInit | undefined;
  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    body: requestBody,
    credentials: "include",
    headers: requestHeaders,
  });

  if (
    response.status === 401 &&
    allowRefresh &&
    !skipRefresh &&
    !path.startsWith("/api/auth/")
  ) {
    await request<{ ok: true }>(
      "/api/auth/refresh",
      { method: "POST", skipRefresh: true },
      false,
    );

    return request<T>(path, options, false);
  }

  const payload = await readPayload(response);

  if (!response.ok) {
    throw new ApiError(response.status, readMessage(payload, response.statusText || "Request failed"));
  }

  return payload as T;
}

export function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  return request<T>(path, options, true);
}
