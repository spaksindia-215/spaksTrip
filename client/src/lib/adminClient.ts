import { api, ApiError } from "@/lib/api";
import type { UserRole, UserStatus } from "@/lib/authClient";

export type MarkupRule = { type: "percent" | "flat"; value: number; cap?: number };

// Full user record as returned by the admin endpoints (KYC visible to admin).
export type AdminUser = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  aadhar: string;
  gst?: string;
  pan?: string;
  creditLimit: number | null;
  walletBalance: number;
  markup?: { flights: MarkupRule; hotels: MarkupRule; taxi: MarkupRule };
  createdAt: string;
};

// Map of navbar labelKey → visible. Missing keys default to visible (true).
export type NavbarVisibility = Record<string, boolean>;

export type PlatformMarkupRule = { type: "percent" | "flat"; value: number; cap?: number };
export type PlatformMarkupConfig = {
  flights: PlatformMarkupRule;
  hotels:  PlatformMarkupRule;
  taxi:    PlatformMarkupRule;
};
export type PlatformMarkupResponse = {
  markup:    PlatformMarkupConfig;
  version:   number;
  updatedAt: string;
  updatedBy: string;
};

type ListResponse = { items: AdminUser[] };
type UserResponse = { user: AdminUser };

// Admin endpoints never participate in user-JWT refresh — skipRefresh avoids a
// pointless /api/auth/refresh round-trip on 401 (which just means "no admin session").
export const adminClient = {
  async login(password: string): Promise<void> {
    await api<{ ok: true }>("/api/admin/login", {
      method: "POST",
      body: { password },
      skipRefresh: true,
    });
  },

  async logout(): Promise<void> {
    await api<{ ok: true }>("/api/admin/logout", { method: "POST", skipRefresh: true });
  },

  async me(): Promise<void> {
    await api<{ ok: true }>("/api/admin/me", { skipRefresh: true });
  },

  async pending(): Promise<AdminUser[]> {
    const res = await api<ListResponse>("/api/admin/pending", { skipRefresh: true });
    return res.items;
  },

  async users(role?: UserRole): Promise<AdminUser[]> {
    const query = role ? `?role=${encodeURIComponent(role)}` : "";
    const res = await api<ListResponse>(`/api/admin/users${query}`, { skipRefresh: true });
    return res.items;
  },

  async approve(id: string, creditLimit?: number): Promise<AdminUser> {
    const res = await api<UserResponse>(`/api/admin/approve/${id}`, {
      method: "POST",
      body: creditLimit !== undefined ? { creditLimit } : {},
      skipRefresh: true,
    });
    return res.user;
  },

  async reject(id: string, reason: string): Promise<AdminUser> {
    const res = await api<UserResponse>(`/api/admin/reject/${id}`, {
      method: "POST",
      body: { reason },
      skipRefresh: true,
    });
    return res.user;
  },

  async setCreditLimit(id: string, creditLimit: number): Promise<AdminUser> {
    const res = await api<UserResponse>(`/api/admin/users/${id}/credit-limit`, {
      method: "PATCH",
      body: { creditLimit },
      skipRefresh: true,
    });
    return res.user;
  },

  async getNavbarSettings(): Promise<NavbarVisibility> {
    const res = await api<{ visibility: NavbarVisibility }>("/api/admin/navbar-settings", {
      skipRefresh: true,
    });
    return res.visibility;
  },

  async updateNavbarSettings(visibility: NavbarVisibility): Promise<NavbarVisibility> {
    const res = await api<{ visibility: NavbarVisibility }>("/api/admin/navbar-settings", {
      method: "PUT",
      body: { visibility },
      skipRefresh: true,
    });
    return res.visibility;
  },

  async getPlatformMarkup(): Promise<PlatformMarkupResponse> {
    return api<PlatformMarkupResponse>("/api/admin/platform-markup", { skipRefresh: true });
  },

  async updatePlatformMarkup(
    markup: Partial<PlatformMarkupConfig>,
  ): Promise<PlatformMarkupResponse> {
    return api<PlatformMarkupResponse>("/api/admin/platform-markup", {
      method: "PUT",
      body: markup,
      skipRefresh: true,
    });
  },

  // ── Partner hotel listings (admin review queue) ──────────────────────────────
  hotelListings: {
    // Defaults to status "pending"; pass "all" to see every listing.
    async list(status: string = "pending"): Promise<AdminHotelListing[]> {
      const res = await api<{ items: AdminHotelListing[] }>(
        `/api/admin/hotel-listings?status=${encodeURIComponent(status)}`,
        { skipRefresh: true },
      );
      return res.items;
    },
    async approve(id: string): Promise<AdminHotelListing> {
      const res = await api<{ item: AdminHotelListing }>(
        `/api/admin/hotel-listings/${id}/approve`,
        { method: "POST", skipRefresh: true },
      );
      return res.item;
    },
    async reject(id: string): Promise<AdminHotelListing> {
      const res = await api<{ item: AdminHotelListing }>(
        `/api/admin/hotel-listings/${id}/reject`,
        { method: "POST", skipRefresh: true },
      );
      return res.item;
    },
  },

  // ── Unified partner-listing review queue (all verticals) ──────────────────────
  listings: {
    async list(params: { status?: string; type?: string } = {}): Promise<AdminListing[]> {
      const sp = new URLSearchParams();
      if (params.status) sp.set("status", params.status);
      if (params.type) sp.set("type", params.type);
      const qs = sp.toString();
      const res = await api<{ items: AdminListing[] }>(
        `/api/admin/listings${qs ? `?${qs}` : ""}`,
        { skipRefresh: true },
      );
      return res.items;
    },
    async approve(type: string, id: string): Promise<void> {
      await api(`/api/admin/listings/${type}/${id}/approve`, { method: "POST", skipRefresh: true });
    },
    async reject(type: string, id: string): Promise<void> {
      await api(`/api/admin/listings/${type}/${id}/reject`, { method: "POST", skipRefresh: true });
    },
  },

  // ── Marketplace packages (fixed templates + moderation + leads) ───────────────
  packages: {
    async list(filters: { kind?: string; origin?: string; status?: string } = {}): Promise<AdminPackage[]> {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(filters)) if (v) sp.set(k, String(v));
      const qs = sp.toString();
      const res = await api<{ items: AdminPackage[] }>(`/api/admin/packages${qs ? `?${qs}` : ""}`, { skipRefresh: true });
      return res.items;
    },
    // Multipart create of a platform template: a `data` JSON field + `images` files.
    async createTemplate(form: FormData): Promise<AdminPackage> {
      const response = await fetch("/api/admin/packages", { method: "POST", body: form, credentials: "include" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new ApiError(response.status, (payload && payload.error) || "Request failed");
      return (payload as { item: AdminPackage }).item;
    },
    async setStatus(id: string, status: string): Promise<AdminPackage> {
      const res = await api<{ item: AdminPackage }>(`/api/admin/packages/${id}/status`, { method: "PATCH", body: { status }, skipRefresh: true });
      return res.item;
    },
    async remove(id: string): Promise<void> {
      await api<null>(`/api/admin/packages/${id}`, { method: "DELETE", skipRefresh: true });
    },
    async enquiries(status?: string): Promise<AdminEnquiry[]> {
      const qs = status ? `?status=${status}` : "";
      const res = await api<{ items: AdminEnquiry[] }>(`/api/admin/packages/enquiries${qs}`, { skipRefresh: true });
      return res.items;
    },
    async updateEnquiry(id: string, input: { status?: string; note?: string }): Promise<AdminEnquiry> {
      const res = await api<{ item: AdminEnquiry }>(`/api/admin/packages/enquiries/${id}`, { method: "PATCH", body: input, skipRefresh: true });
      return res.item;
    },
  },
};

// Partner hotel listing as seen in the admin review queue. `partner` is
// populated to { id, name, email } by the backend.
export type AdminHotelListing = {
  id: string;
  name: string;
  type: string;
  starRating: number;
  status: "draft" | "pending" | "active" | "paused" | "suspended";
  address?: { street?: string; city?: string; state?: string; country?: string };
  images?: { url: string; caption?: string }[];
  rooms?: { name: string }[];
  pricing?: { basePricePerNight?: number; currency?: string };
  partner?: { id: string; name?: string; email?: string } | string;
  createdAt: string;
};

// Normalized listing from the unified review queue (any partner-resource type).
export type AdminListingType = "hotel" | "taxi" | "taxi_package" | "tour" | "tour_package" | "cruise";
export type AdminListing = {
  id: string;
  type: AdminListingType;
  typeLabel: string;
  title: string;
  thumbnail?: string;
  subtitle?: string;
  status: "draft" | "pending" | "active" | "paused" | "suspended";
  partner?: { id: string; name?: string; email?: string };
  createdAt: string;
};

export type AdminPackage = {
  id: string;
  kind: string;
  scope: string;
  origin: "platform" | "partner";
  status: "draft" | "active" | "paused" | "suspended";
  title: string;
  slug: string;
  thumbnail?: string;
  route: { destinations: string[]; durationDays: number; durationNights: number };
  author?: { id: string; name?: string; companyName?: string } | string;
};

export type AdminEnquiry = {
  id: string;
  package: { id: string; title: string; slug: string } | string;
  partner: { id: string; name?: string; companyName?: string } | string;
  offer?: { id: string; price: number; currency: string } | string;
  contact: { name: string; phone: string; email?: string };
  travelDate?: string;
  pax: { adults: number; children: number; infants: number };
  message?: string;
  status: "new" | "contacted" | "quoted" | "converted" | "closed" | "spam";
  createdAt: string;
};
