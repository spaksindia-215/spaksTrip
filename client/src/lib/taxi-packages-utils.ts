/**
 * Generate URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Format availability status for display
 */
export function formatAvailabilityStatus(status: string): string {
  const statusMap: Record<string, string> = {
    AVAILABLE: "Available",
    SOLD_OUT: "Sold Out",
    ON_REQUEST: "On Request",
    BLOCKED: "Blocked",
  };
  return statusMap[status] || status;
}

/**
 * Get CSS class for availability status
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-800",
    SOLD_OUT: "bg-red-100 text-red-800",
    ON_REQUEST: "bg-yellow-100 text-yellow-800",
    BLOCKED: "bg-gray-100 text-gray-800",
  };
  return colorMap[status] || "bg-gray-100 text-gray-800";
}

/**
 * Calculate duration display string
 */
export function formatDuration(days: number, nights: number): string {
  if (days === 0 && nights === 0) return "Same day";
  if (days === 1 && nights === 0) return "1 Day";
  if (nights > 0) return `${nights}N / ${days}D`;
  return `${days}D`;
}

/**
 * Format date for display
 */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: string | Date): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Format date range for display
 */
export function formatDateRange(startDate: string | Date, endDate: string | Date): string {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  const startStr = start.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startStr} - ${endStr}`;
}

/**
 * Get next N days from today
 */
export function getNextDays(count: number): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    days.push(date);
  }
  return days;
}

/**
 * Build URL-friendly path for package
 */
export function buildPackageUrl(destinationSlug: string, packageSlug: string): string {
  return `/taxi-packages/${destinationSlug}/${packageSlug}`;
}

/**
 * Build booking URL
 */
export function buildBookingUrl(destinationSlug: string, packageSlug: string): string {
  return `/taxi-packages/${destinationSlug}/${packageSlug}/booking`;
}

/**
 * Parse package URL to extract slugs
 */
export function parsePackageUrl(pathname: string): {
  destinationSlug?: string;
  packageSlug?: string;
} | null {
  const match = pathname.match(/^\/taxi-packages\/([^/]+)\/([^/]+)/);
  if (!match) return null;

  return {
    destinationSlug: match[1],
    packageSlug: match[2],
  };
}

/**
 * Calculate number of persons (adults + children)
 */
export function getTotalPersons(adults: number, children: number = 0): number {
  return adults + children;
}

/**
 * Get appropriate vehicle option for traveller count
 */
export function getRecommendedVehicle(
  persons: number,
  vehicles: Array<{ seatingCapacity: number; [key: string]: unknown }>,
): typeof vehicles[0] | undefined {
  const suitable = vehicles.filter((v) => v.seatingCapacity >= persons);
  return suitable.length > 0 ? suitable[0] : vehicles[0];
}

/**
 * Validate itinerary
 */
export function isValidItinerary(
  itinerary: Array<{ day: number; title: string; description: string }>,
  durationDays: number,
): boolean {
  if (!itinerary || itinerary.length === 0) return false;
  if (itinerary.length !== durationDays) return false;

  for (let i = 0; i < itinerary.length; i++) {
    if (itinerary[i].day !== i + 1) return false;
    if (!itinerary[i].title || !itinerary[i].description) return false;
  }

  return true;
}
