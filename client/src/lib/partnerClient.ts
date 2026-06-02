import { api } from "@/lib/api";
import type { Booking } from "@/lib/customerClient";

export type ResourceType = "cruise" | "taxi" | "taxi_package" | "tour" | "tour_package";

export type PartnerResource = {
  id: string;
  partnerId: string;
  type: ResourceType;
  title: string;
  description: string;
  price: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type PartnerResourceInput = {
  type: ResourceType;
  title: string;
  description: string;
  price: number;
  metadata: Record<string, unknown>;
};

export type PartnerResourceUpdate = Partial<PartnerResourceInput>;

type ListResponse = {
  items: PartnerResource[];
};

type ItemResponse = {
  item: PartnerResource;
};

export const partnerClient = {
  async list(type?: ResourceType): Promise<PartnerResource[]> {
    const query = type ? `?type=${encodeURIComponent(type)}` : "";
    const response = await api<ListResponse>(`/api/partner/resources${query}`);
    return response.items;
  },

  async create(input: PartnerResourceInput): Promise<PartnerResource> {
    const response = await api<ItemResponse>("/api/partner/resources", {
      method: "POST",
      body: input,
    });

    return response.item;
  },

  async update(id: string, input: PartnerResourceUpdate): Promise<PartnerResource> {
    const response = await api<ItemResponse>(`/api/partner/resources/${id}`, {
      method: "PUT",
      body: input,
    });

    return response.item;
  },

  async remove(id: string): Promise<void> {
    await api<null>(`/api/partner/resources/${id}`, { method: "DELETE" });
  },

  async bookings(): Promise<Booking[]> {
    const response = await api<{ items: Booking[] }>("/api/partner/bookings");
    return response.items;
  },
};
