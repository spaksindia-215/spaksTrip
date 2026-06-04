import { api, ApiError } from "@/lib/api";
import type { Booking } from "@/lib/customerClient";

// MTI TaxiListing as returned by the backend (mirrors the server model's
// toJSON). The dashboard maps this into a flat view via taxiViewFromApi.
export type TaxiListingApi = {
  id: string;
  partner: string;
  status: "draft" | "active" | "paused" | "suspended";
  slug: string;
  vehicle: {
    make: string;
    model: string;
    type: string;
    fuelType?: string;
    transmission?: string;
    registrationNumber?: string;
    yearOfManufacture?: number;
    seatingCap: number;
    acAvailable: boolean;
    luggageSpace?: string;
    luggageCapacity?: number;
    images: { url: string; isPrimary?: boolean }[];
    amenities: string[];
  };
  services: {
    type: string;
    isActive: boolean;
    pricing: { baseFare: number; pricePerKm?: number; taxPercent: number; tollsIncluded: boolean };
    coverage: { baseCity: string; servicedCities: string[] };
  }[];
  operationalHours: { available24x7: boolean; slots: { from: string; to: string }[] };
  operatingDays: string[];
  routes: string[];
  contact: { name?: string; phone?: string; email?: string; businessName?: string };
  description?: string;
  driverIncluded: boolean;
  selfDriveAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TaxiListingUpdate = {
  operatingCity?: string;
  minimumFare?: number;
  pricePerKm?: number;
  serviceAreas?: string[];
  availableRoutes?: string[];
  description?: string;
  availableDays?: string[];
  availableTimeSlots?: string[];
  amenities?: string[];
  availabilityEnabled?: boolean;
};

export type ResourceType =
  | "hotel"
  | "cruise"
  | "taxi"
  | "taxi_package"
  | "tour"
  | "tour_package";

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

  // Taxi listings are persisted server-side (MTI TaxiListing model); images and
  // documents are uploaded through the same multipart request to Cloudinary.
  taxis: {
    async list(): Promise<TaxiListingApi[]> {
      const response = await api<{ items: TaxiListingApi[] }>("/api/partner/taxis");
      return response.items;
    },

    // Multipart create. `form` carries a `payload` JSON field plus file fields
    // (vehiclePhotos, rcBook, insurance, pollutionCertificate, drivingLicense).
    // Sent through the Next.js proxy so the auth cookie is forwarded; the
    // browser sets the multipart Content-Type/boundary, so we don't.
    async create(form: FormData): Promise<TaxiListingApi> {
      const response = await fetch("/api/partner/taxis", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (payload && typeof payload.error === "string" && payload.error) ||
          "Failed to create taxi listing";
        throw new ApiError(response.status, message);
      }
      return (payload as { item: TaxiListingApi }).item;
    },

    async update(id: string, patch: TaxiListingUpdate): Promise<TaxiListingApi> {
      const response = await api<{ item: TaxiListingApi }>(`/api/partner/taxis/${id}`, {
        method: "PATCH",
        body: patch,
      });
      return response.item;
    },

    async remove(id: string): Promise<void> {
      await api<null>(`/api/partner/taxis/${id}`, { method: "DELETE" });
    },
  },
};
