import { api, ApiError } from "@/lib/api";
import type {
  PackageDetail,
  PackageSummary,
  PackageKind,
  PackageScope,
  Operator,
} from "@/lib/packagesClient";

// Partner-facing marketplace client: manage own custom packages, attach/price
// offers on any active package (templates + others'), and work the lead inbox.
// Package create/update are multipart (a `data` JSON field + `images` files);
// everything else is JSON.

export type { PackageDetail, PackageSummary, PackageKind, PackageScope } from "@/lib/packagesClient";

export type PartnerOffer = {
  id: string;
  package: (PackageSummary & { id: string }) | string;
  partner: string;
  price: number;
  currency: string;
  perPerson: boolean;
  pricingNote?: string;
  notes?: string;
  inclusionsOverride: string[];
  directContact?: { name?: string; businessName?: string; phone?: string; email?: string; whatsapp?: string };
  showDirectContact: boolean;
  status: "draft" | "active" | "paused" | "suspended";
};

export type PartnerEnquiry = {
  id: string;
  package: { id: string; title: string; slug: string; kind: PackageKind; scope: PackageScope } | string;
  offer?: { id: string; price: number; currency: string } | string;
  partner: string;
  customer?: string | Operator;
  contact: { name: string; phone: string; email?: string };
  travelDate?: string;
  pax: { adults: number; children: number; infants: number };
  message?: string;
  status: "new" | "contacted" | "quoted" | "converted" | "closed" | "spam";
  internalNotes: { at: string; text: string }[];
  createdAt: string;
};

export type OfferInput = {
  packageId: string;
  price: number;
  currency?: string;
  perPerson?: boolean;
  pricingNote?: string;
  notes?: string;
  inclusionsOverride?: string[];
  directContact?: { name?: string; businessName?: string; phone?: string; email?: string; whatsapp?: string };
  showDirectContact?: boolean;
};

async function multipart<T>(path: string, method: "POST" | "PUT", form: FormData): Promise<T> {
  const response = await fetch(path, { method, body: form, credentials: "include" });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (payload && typeof payload.error === "string" && payload.error) || "Request failed";
    throw new ApiError(response.status, message);
  }
  return (payload as { item: T }).item;
}

export const partnerPackagesClient = {
  // ── Own custom packages ─────────────────────────────────────────────────────
  async listMine(): Promise<PackageSummary[]> {
    return (await api<{ items: PackageSummary[] }>("/api/partner/packages")).items;
  },
  async create(form: FormData): Promise<PackageDetail> {
    return multipart<PackageDetail>("/api/partner/packages", "POST", form);
  },
  async update(id: string, form: FormData): Promise<PackageDetail> {
    return multipart<PackageDetail>(`/api/partner/packages/${id}`, "PUT", form);
  },
  async setStatus(id: string, status: PartnerOffer["status"]): Promise<PackageSummary> {
    return (await api<{ item: PackageSummary }>(`/api/partner/packages/${id}/status`, { method: "PATCH", body: { status } })).item;
  },
  async remove(id: string): Promise<void> {
    await api<null>(`/api/partner/packages/${id}`, { method: "DELETE" });
  },

  // ── Catalog the partner can offer on (templates + every active package) ───────
  async browseCatalog(filters: { kind?: PackageKind; scope?: PackageScope; q?: string } = {}): Promise<PackageSummary[]> {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) sp.set(k, String(v));
    const qs = sp.toString();
    return (await api<{ items: PackageSummary[] }>(`/api/partner/packages/catalog${qs ? `?${qs}` : ""}`)).items;
  },

  // ── Offers ───────────────────────────────────────────────────────────────────
  async listOffers(): Promise<PartnerOffer[]> {
    return (await api<{ items: PartnerOffer[] }>("/api/partner/packages/offers")).items;
  },
  async upsertOffer(input: OfferInput): Promise<PartnerOffer> {
    return (await api<{ item: PartnerOffer }>("/api/partner/packages/offers", { method: "POST", body: input })).item;
  },
  async updateOffer(id: string, input: Partial<OfferInput> & { status?: PartnerOffer["status"] }): Promise<PartnerOffer> {
    return (await api<{ item: PartnerOffer }>(`/api/partner/packages/offers/${id}`, { method: "PATCH", body: input })).item;
  },
  async removeOffer(id: string): Promise<void> {
    await api<null>(`/api/partner/packages/offers/${id}`, { method: "DELETE" });
  },

  // ── Lead inbox ───────────────────────────────────────────────────────────────
  async listEnquiries(status?: PartnerEnquiry["status"]): Promise<PartnerEnquiry[]> {
    const qs = status ? `?status=${status}` : "";
    return (await api<{ items: PartnerEnquiry[] }>(`/api/partner/packages/enquiries${qs}`)).items;
  },
  async updateEnquiry(id: string, input: { status?: PartnerEnquiry["status"]; note?: string }): Promise<PartnerEnquiry> {
    return (await api<{ item: PartnerEnquiry }>(`/api/partner/packages/enquiries/${id}`, { method: "PATCH", body: input })).item;
  },
};
