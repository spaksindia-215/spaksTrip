import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load from client/.env.local if it exists; fall back to process.env
const envPath = path.resolve(__dirname, "../../client/.env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

function require_env(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback;
  if (!val) {
    throw new Error(
      `Missing required environment variable: ${key}. Add it to client/.env.local or set it in environment.`
    );
  }
  return val;
}

const searchBase = (
  process.env.TBO_HOLIDAYS_SEARCH_URL ??
  process.env.TBO_HOLIDAYS_HOTEL_API_URL ??
  "https://affiliate.tektravels.com/HotelAPI"
).replace(/\/$/, "");

const bookBase = (() => {
  const raw = process.env.TBO_HOLIDAYS_BOOK_URL;
  if (raw) return raw.replace(/\/book\/?$/, "").replace(/\/$/, "");
  return "https://HotelBE.tektravels.com/hotelservice.svc/rest";
})();

export const config = {
  // Agency credentials (required for Search, PreBook, Book, Voucher)
  agencyUsername: require_env("TBO_HOLIDAYS_USER_NAME", "Spaks"),
  agencyPassword: require_env("TBO_HOLIDAYS_PASSWORD", "Spaks@123"),

  // Static credentials (for HotelCodeList - public test creds)
  staticUsername: process.env.TBO_HOLIDAYS_STATIC_USER_NAME ?? "TBOStaticAPITest",
  staticPassword: process.env.TBO_HOLIDAYS_STATIC_PASSWORD ?? "Tbo@11530818",

  endUserIp: process.env.TBO_END_USER_IP ?? "1.1.1.1",

  // TBO endpoint bases
  searchUrl: `${searchBase}/Search`,
  preBookUrl: `${searchBase}/PreBook`,
  bookUrl: `${bookBase}/book`,
  voucherUrl: `${bookBase}/GenerateVoucher`,
  bookingDetailUrl: `${bookBase}/Getbookingdetail`,
  hotelCodeListUrl: "https://api.tbotechnology.in/TBOHolidays_HotelAPI/TBOHotelCodeList",

  // Certification output directory
  outputDir: path.resolve(__dirname, "../../certification-output"),

  // Retry settings
  retryAttempts: 3,
  retryBaseDelay: 2000,  // ms, doubles on each retry

  // Rate-limit avoidance delays (ms)
  stepDelay: 1500,   // between steps within a case
  caseDelay: 5000,   // between cases

  // Search settings — large batch so child-accepting rooms are likely included
  maxHotelCodesPerSearch: 150,
  // Max total codes to try across retry batches before giving up
  maxHotelCodesTotal: 600,

  // City codes for test cases
  // These are TBO city codes - update these to known working codes for your account
  // Delhi = 130443 (example), Dubai = 130264 (example)
  domesticCityCode: process.env.DOMESTIC_CITY_CODE ?? "130443",
  internationalCityCode: process.env.INTERNATIONAL_CITY_CODE ?? "130264",

  // Separate city codes for cases with children (Cases 2, 4, 6, 8).
  // EAN-backed cities (e.g. Delhi) often reject 2A+2C at Book time with
  // "Error in Supplier Response". Set these to a city with non-EAN suppliers.
  // If unset, falls back to the regular domestic/international city codes.
  domesticChildrenCityCode: process.env.DOMESTIC_CHILDREN_CITY_CODE
    ?? process.env.DOMESTIC_CITY_CODE
    ?? "130443",
  internationalChildrenCityCode: process.env.INTERNATIONAL_CHILDREN_CITY_CODE
    ?? process.env.INTERNATIONAL_CITY_CODE
    ?? "130264",
} as const;

export type Config = typeof config;
