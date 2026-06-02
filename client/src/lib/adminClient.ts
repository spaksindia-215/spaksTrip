import { api } from "@/lib/api";
import type { UserRole, UserStatus } from "@/lib/authClient";

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
  createdAt: string;
};

export type AdminListing = {
  id: string;
  resourceType: string;
  type: string;
  title: string;
  description: string;
  price: number;
  status: "pending" | "approved" | "rejected";
  partnerId: string;
  partnerName: string | null;
  partnerEmail: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
};

type ListResponse = { items: AdminUser[] };
type UserResponse = { user: AdminUser };
type ListingsResponse = { items: AdminListing[] };

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

  async pendingListings(): Promise<AdminListing[]> {
    const res = await api<ListingsResponse>("/api/admin/listings/pending", { skipRefresh: true });
    return res.items;
  },

  async approveListing(id: string, type: string): Promise<void> {
    await api<unknown>(`/api/admin/listings/${id}/approve`, {
      method: "POST",
      body: { type },
      skipRefresh: true,
    });
  },

  async rejectListing(id: string, type: string): Promise<void> {
    await api<unknown>(`/api/admin/listings/${id}/reject`, {
      method: "POST",
      body: { type },
      skipRefresh: true,
    });
  },
};
