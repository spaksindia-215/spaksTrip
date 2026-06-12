import { api } from "@/lib/api";
import type { UserRole, UserStatus } from "@/lib/authClient";

export type ProductType = "flight" | "hotel" | "taxi" | "tour" | "cruise" | "package";
export type BookingStatus = "active" | "held" | "cancelled" | "completed";

export type Booking = {
  id: string;
  ownerId: string;
  ownerRole: UserRole;
  productType: ProductType;
  status: BookingStatus;
  pnr?: string;
  amount: number;
  currency: string;
  holdExpiresAt?: string;
  cancelRequestedAt?: string;
  details: Record<string, unknown>;
  agentMarkup?: number;
  netFare?: number;
  customerPaid?: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  aadharMasked: string;
  createdAt: string;
};

export const customerClient = {
  async bookings(): Promise<Booking[]> {
    const res = await api<{ items: Booking[] }>("/api/customer/bookings");
    return res.items;
  },

  async requestCancel(id: string): Promise<Booking> {
    const res = await api<{ booking: Booking }>(
      `/api/customer/bookings/${id}/cancel-request`,
      { method: "POST" },
    );
    return res.booking;
  },

  async profile(): Promise<CustomerProfile> {
    const res = await api<{ profile: CustomerProfile }>("/api/customer/profile");
    return res.profile;
  },
};
