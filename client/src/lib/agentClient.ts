import { api, ApiError } from "@/lib/api";
import type { UserRole, UserStatus } from "@/lib/authClient";
import type { Booking, BookingStatus, ProductType } from "@/lib/customerClient";

export type { Booking, BookingStatus, ProductType } from "@/lib/customerClient";

export type AgentProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  slug: string | null;
  kyc: { aadharProvided: boolean; gst: string | null; pan: string | null };
  creditLimit: number | null;
  creditUsed: number;
  creditAvailable: number | null;
  walletBalance: number;
};

export type CreateBookingInput = {
  productType: ProductType;
  amount: number;
  status: "active" | "held";
  pnr?: string;
  currency?: string;
  holdMinutes?: number;
  details?: Record<string, unknown>;
};

export interface AgentBranding {
  companyName?: string;
  tagline?: string;
  logo?: string;
  primaryColor: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface AgentBrandingResponse {
  slug: string | null;
  branding: AgentBranding | null;
}

export type MarkupType = "percent" | "flat";

export interface MarkupRule {
  type: MarkupType;
  value: number;
  cap?: number;
}

export interface AgentMarkupConfig {
  flights: MarkupRule;
  hotels: MarkupRule;
  taxi: MarkupRule;
}

export const agentClient = {
  async bookings(status?: BookingStatus): Promise<Booking[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const res = await api<{ items: Booking[] }>(`/api/agent/bookings${query}`);
    return res.items;
  },

  async create(input: CreateBookingInput): Promise<Booking> {
    const res = await api<{ booking: Booking }>("/api/agent/bookings", {
      method: "POST",
      body: input,
    });
    return res.booking;
  },

  async confirm(id: string): Promise<Booking> {
    const res = await api<{ booking: Booking }>(`/api/agent/bookings/${id}/confirm`, {
      method: "POST",
    });
    return res.booking;
  },

  async cancel(id: string): Promise<Booking> {
    const res = await api<{ booking: Booking }>(`/api/agent/bookings/${id}/cancel`, {
      method: "POST",
    });
    return res.booking;
  },

  async lookupPnr(pnr: string): Promise<Booking> {
    const res = await api<{ booking: Booking }>(
      `/api/agent/bookings/pnr/${encodeURIComponent(pnr)}`,
    );
    return res.booking;
  },

  async profile(): Promise<AgentProfile> {
    const res = await api<{ profile: AgentProfile }>("/api/agent/profile");
    return res.profile;
  },

  async getMarkup(): Promise<AgentMarkupConfig | null> {
    const res = await api<{ markup: AgentMarkupConfig | null }>("/api/agent/markup");
    return res.markup;
  },

  async updateMarkup(
    product: "flights" | "hotels" | "taxi",
    rule: MarkupRule,
  ): Promise<AgentMarkupConfig | null> {
    const res = await api<{ markup: AgentMarkupConfig | null }>("/api/agent/markup", {
      method: "PATCH",
      body: { [product]: rule },
    });
    return res.markup;
  },

  async getBranding(): Promise<AgentBrandingResponse> {
    return api<AgentBrandingResponse>("/api/agent/branding");
  },

  async updateBranding(formData: FormData): Promise<AgentBranding | null> {
    // Raw fetch — api() overrides Content-Type to application/json, breaking multipart.
    const response = await fetch("/api/agent/branding", {
      method: "PATCH",
      body: formData,
      credentials: "include",
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
      const msg = (typeof payload.error === "string" ? payload.error : null)
               ?? (typeof payload.message === "string" ? payload.message : null)
               ?? "Update failed";
      throw new ApiError(response.status, msg);
    }
    const data = await response.json() as { branding: AgentBranding | null };
    return data.branding;
  },
};
