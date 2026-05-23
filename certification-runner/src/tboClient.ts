import axios, { AxiosInstance, AxiosError } from "axios";
import { config } from "./config";

// Transient TBO error codes that are safe to retry
const RETRYABLE_TBO_ERROR_CODES = new Set([1001, 2001, 9999]);

function basicAuth(username: string, password: string): string {
  return "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
}

function isRetryable(error: unknown): boolean {
  if (error instanceof AxiosError) {
    // Network/timeout errors
    if (!error.response) return true;
    // 5xx server errors
    if (error.response.status >= 500) return true;
    // 429 rate limited
    if (error.response.status === 429) return true;
  }
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  attempts = config.retryAttempts,
  baseDelay = config.retryBaseDelay
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === attempts) break;

      // Check TBO-specific transient errors in response body
      let tboRetryable = false;
      if (err instanceof AxiosError && err.response?.data) {
        type TboErr = { ErrorCode?: number };
        type TboData = { Error?: TboErr; BookResult?: { Error?: TboErr }; GenerateVoucherResult?: { Error?: TboErr } };
        const data = err.response.data as TboData;
        const errObj: TboErr | undefined =
          data.Error ?? data.BookResult?.Error ?? data.GenerateVoucherResult?.Error;
        if (errObj?.ErrorCode && RETRYABLE_TBO_ERROR_CODES.has(errObj.ErrorCode)) {
          tboRetryable = true;
        }
      }

      if (!isRetryable(err) && !tboRetryable) {
        throw err; // Don't retry 4xx client errors
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(
        `  [Retry] ${label} attempt ${attempt}/${attempts} failed. Retrying in ${delay}ms...`
      );
      await sleep(delay);
    }
  }
  throw lastError;
}

// ─── Agency Client (Search / PreBook / Book / Voucher) ───────────────────────

function createAgencyClient(): AxiosInstance {
  return axios.create({
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: basicAuth(config.agencyUsername, config.agencyPassword),
    },
    timeout: 60_000,
  });
}

// ─── Static Client (HotelCodeList) ───────────────────────────────────────────

function createStaticClient(): AxiosInstance {
  return axios.create({
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: basicAuth(config.staticUsername, config.staticPassword),
    },
    timeout: 30_000,
  });
}

const agencyClient = createAgencyClient();
const staticClient = createStaticClient();

// ─── Public API ───────────────────────────────────────────────────────────────

export async function tboPost<TReq, TRes>(
  url: string,
  body: TReq,
  label: string,
  useStatic = false
): Promise<TRes> {
  const client = useStatic ? staticClient : agencyClient;
  return withRetry(async () => {
    const res = await client.post<TRes>(url, body);
    return res.data;
  }, label);
}

export async function tboGet<TRes>(
  url: string,
  params: Record<string, string>,
  label: string,
  useStatic = false
): Promise<TRes> {
  const client = useStatic ? staticClient : agencyClient;
  return withRetry(async () => {
    const res = await client.get<TRes>(url, { params });
    return res.data;
  }, label);
}

export { sleep };
