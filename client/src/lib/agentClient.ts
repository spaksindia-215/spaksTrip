import { api } from "@/lib/api";
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
};
