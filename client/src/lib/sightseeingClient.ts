import { api } from "@/lib/api";
import type { SightseeingListingApi } from "@/lib/partnerClient";

// Typed client for the public SightSeeing API. Browsing + detail + enquiry are all
// unauthenticated (guests allowed); the enquiry is attributed to the user when a
// session cookie is present. Mirrors packagesClient.ts.

export type Pagination = { page: number; limit: number; total: number; totalPages: number };

// Detail includes a populated partner (overrides the base `partner: string`).
export type SightseeingDetail = Omit<SightseeingListingApi, "partner"> & {
  partner: { id: string; name?: string; companyName?: string; slug?: string } | string;
};

export type SightseeingEnquiryInput = {
  contact: { name: string; phone: string; email?: string };
  travelDate?: string;
  pax?: { adults: number; children: number; infants: number };
  message?: string;
};

export type SightseeingFilters = {
  q?: string;
  island?: string;
  category?: string;
  day?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "newest";
  page?: number;
  limit?: number;
};

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== null) sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function browseSightseeing(
  filters: SightseeingFilters = {},
): Promise<{ items: SightseeingListingApi[]; pagination: Pagination }> {
  return api(`/api/sightseeing${qs(filters)}`);
}

export function getSightseeingCategories(): Promise<{ items: { category: string; count: number }[] }> {
  return api(`/api/sightseeing/categories`);
}

export function getSightseeing(slug: string): Promise<{ item: SightseeingDetail }> {
  return api(`/api/sightseeing/${encodeURIComponent(slug)}`);
}

export function enquireSightseeing(
  slug: string,
  input: SightseeingEnquiryInput,
): Promise<{ item: { id: string } }> {
  return api(`/api/sightseeing/${encodeURIComponent(slug)}/enquire`, {
    method: "POST",
    body: input,
  });
}
