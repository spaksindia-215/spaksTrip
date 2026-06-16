// TBO Insurance Utility Functions

/**
 * Format date to ISO 8601 format with time 00:00:00
 * @param date Date object or string (YYYY-MM-DD)
 * @returns ISO formatted string (YYYY-MM-DDTHH:mm:ss)
 */
export function formatTboDate(date: Date | string): string {
  let dateObj: Date;

  if (typeof date === "string") {
    dateObj = new Date(date + "T00:00:00Z");
  } else {
    dateObj = date;
  }

  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}T00:00:00`;
}

/**
 * Calculate age from date of birth
 * @param dob Date of birth (YYYY-MM-DD format)
 * @param asOfDate Optional reference date (defaults to today)
 * @returns Age in years
 */
export function calculateAge(dob: string, asOfDate?: Date): number {
  const birthDate = new Date(dob);
  const referenceDate = asOfDate || new Date();

  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Format date of birth to DD/MM/YYYY format (TBO expects this for travellers)
 * @param dob Date of birth (YYYY-MM-DD format)
 * @returns Formatted date (DD/MM/YYYY)
 */
export function formatDobForTbo(dob: string): string {
  const [year, month, day] = dob.split("-");
  return `${day}/${month}/${year}`;
}

/**
 * Validate TBO API response status
 * @param response Response object with ResponseStatus field
 * @returns true if successful (ResponseStatus === 1)
 */
export function isSuccessResponse(response: { Response?: { ResponseStatus?: number } }): boolean {
  return response.Response?.ResponseStatus === 1;
}

/**
 * Extract error details from TBO response
 * @param response Response object with Error field
 * @returns Error message or null if no error
 */
export function extractErrorMessage(response: {
  Response?: { Error?: { ErrorCode?: number; ErrorMessage?: string } };
}): string | null {
  const error = response.Response?.Error;
  if (!error) return null;

  const code = error.ErrorCode || "Unknown";
  const message = error.ErrorMessage || "No error message";
  return `[${code}] ${message}`;
}

/**
 * Get trip duration in days
 * @param startDate Start date (YYYY-MM-DD)
 * @param endDate End date (YYYY-MM-DD)
 * @returns Number of days
 */
export function getTripDurationDays(startDate: string, endDate: string): number {
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Categorize trip type based on destination
 * @param destination Airport code
 * @returns Trip type (domestic, non-us, us-canada)
 */
export function categorizeTripType(
  destination: string,
): "domestic" | "non-us" | "us-canada" {
  const usCanadaCodes = [
    "JFK", "LAX", "ORD", "ATL", "DFW", "DEN", "SEA", "SFO", "LAS", "MIA",
    "YYZ", "YVR", "YEZ", "YLW", "YWG", "YEG",
  ];

  const domesticCodes = [
    "DEL", "BOM", "BLR", "HYD", "MAA", "COK", "GAT", "COL", "IDR", "PNQ",
    "JRH", "BGR", "HLH", "CCU", "VAR", "PTM", "BHO", "PNE", "RAJ",
  ];

  const dest = destination.toUpperCase();

  if (usCanadaCodes.includes(dest)) {
    return "us-canada";
  } else if (domesticCodes.includes(dest)) {
    return "domestic";
  }

  return "non-us";
}

/**
 * Generate human-readable trip description
 * @param origin Origin code
 * @param destination Destination code
 * @param startDate Start date
 * @param endDate End date
 * @returns Description string
 */
export function generateTripDescription(
  origin: string,
  destination: string,
  startDate: string,
  endDate: string,
): string {
  const days = getTripDurationDays(startDate, endDate);
  return `${origin}→${destination}, ${days} days (${startDate} to ${endDate})`;
}

/**
 * Group travellers by age range
 * @param travellers Array of traveller objects with DateOfBirth
 * @returns Object with adults, children, and infants arrays
 */
export function groupTravellersByAge(
  travellers: Array<{ DateOfBirth: string; FirstName: string; LastName: string }>,
): {
  adults: typeof travellers;
  children: typeof travellers;
  infants: typeof travellers;
} {
  const now = new Date();
  const adults = [];
  const children = [];
  const infants = [];

  for (const traveller of travellers) {
    const age = calculateAge(traveller.DateOfBirth, now);

    if (age >= 18) {
      adults.push(traveller);
    } else if (age >= 2) {
      children.push(traveller);
    } else {
      infants.push(traveller);
    }
  }

  return { adults, children, infants };
}
