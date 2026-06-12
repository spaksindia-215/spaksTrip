import { api } from "@/lib/api";
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
};
