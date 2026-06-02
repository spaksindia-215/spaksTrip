import { api, ApiError } from "./api";
import type {
  TaxiPackageDestination,
  TaxiPackage,
  PackageVehiclePricing,
  PackageAvailability,
  TaxiPackageBooking,
  ListResponse,
} from "@/types/taxiPackages";

const BASE_URL = "/api/customer/taxi-packages";

// ────────────────────────────────────────────────────────────────────────────
// CUSTOMER ENDPOINTS
// ────────────────────────────────────────────────────────────────────────────

export const taxiPackagesClient = {
  // Destinations
  async listDestinations(): Promise<TaxiPackageDestination[]> {
    const response = await api<{ items: TaxiPackageDestination[] }>(
      `${BASE_URL}/destinations`,
    );
    return response.items;
  },

  async getDestination(slug: string): Promise<TaxiPackageDestination> {
    const response = await api<{ item: TaxiPackageDestination }>(
      `${BASE_URL}/destinations/${slug}`,
    );
    return response.item;
  },

  // Packages
  async listPackagesByDestination(
    destinationSlug: string,
    page?: number,
    limit?: number,
  ): Promise<ListResponse<TaxiPackage>> {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));

    const response = await api<ListResponse<TaxiPackage>>(
      `${BASE_URL}/destinations/${destinationSlug}/packages${params ? "?" + params : ""}`,
    );
    return response;
  },

  async getPackageBySlug(
    destinationSlug: string,
    packageSlug: string,
  ): Promise<TaxiPackage> {
    const response = await api<{ item: TaxiPackage }>(
      `${BASE_URL}/packages/${destinationSlug}/${packageSlug}`,
    );
    return response.item;
  },

  // Availability & Vehicles
  async getAvailability(
    packageId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PackageAvailability[]> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate.toISOString());
    if (endDate) params.append("endDate", endDate.toISOString());

    const response = await api<{ items: PackageAvailability[] }>(
      `${BASE_URL}/packages/${packageId}/availability${params ? "?" + params : ""}`,
    );
    return response.items;
  },

  async getVehicles(packageId: string): Promise<PackageVehiclePricing[]> {
    const response = await api<{ items: PackageVehiclePricing[] }>(
      `${BASE_URL}/packages/${packageId}/vehicles`,
    );
    return response.items;
  },

  // Bookings
  async createBooking(booking: {
    packageId: string;
    vehicleId: string;
    travelDate: string;
    passengers: number;
    children?: number;
    amount: number;
    customerDetails: {
      email: string;
      phone: string;
      firstName: string;
      lastName: string;
      age?: number;
      address1: string;
      address2?: string;
      state: string;
      city: string;
      zipCode: string;
      additionalNotes?: string;
    };
  }): Promise<TaxiPackageBooking> {
    const response = await api<{ item: TaxiPackageBooking }>(
      `${BASE_URL}/bookings`,
      { method: "POST", body: booking },
    );
    return response.item;
  },

  async listBookings(status?: string): Promise<TaxiPackageBooking[]> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);

    const response = await api<{ items: TaxiPackageBooking[] }>(
      `${BASE_URL}/bookings${params ? "?" + params : ""}`,
    );
    return response.items;
  },

  async getBooking(bookingId: string): Promise<TaxiPackageBooking> {
    const response = await api<{ item: TaxiPackageBooking }>(
      `${BASE_URL}/bookings/${bookingId}`,
    );
    return response.item;
  },
};

// ────────────────────────────────────────────────────────────────────────────
// PARTNER ENDPOINTS
// ────────────────────────────────────────────────────────────────────────────

const PARTNER_BASE_URL = "/api/partner/taxi-packages";

export const taxiPackagesPartnerClient = {
  // Destinations
  async createDestination(data: {
    name: string;
    slug: string;
    description: string;
    coverImage: string;
  }): Promise<TaxiPackageDestination> {
    const response = await api<{ item: TaxiPackageDestination }>(
      `${PARTNER_BASE_URL}/destinations`,
      { method: "POST", body: data },
    );
    return response.item;
  },

  async listDestinations(): Promise<TaxiPackageDestination[]> {
    const response = await api<{ items: TaxiPackageDestination[] }>(
      `${PARTNER_BASE_URL}/destinations`,
    );
    return response.items;
  },

  async updateDestination(
    id: string,
    data: {
      name: string;
      slug: string;
      description: string;
      coverImage: string;
    },
  ): Promise<TaxiPackageDestination> {
    const response = await api<{ item: TaxiPackageDestination }>(
      `${PARTNER_BASE_URL}/destinations/${id}`,
      { method: "PUT", body: data },
    );
    return response.item;
  },

  async deleteDestination(id: string): Promise<void> {
    await api<null>(`${PARTNER_BASE_URL}/destinations/${id}`, { method: "DELETE" });
  },

  // Vehicle Pricing
  async addVehiclePricing(
    packageId: string,
    data: {
      vehicleType: string;
      vehicleName: string;
      seatingCapacity: number;
      pricePerDay: number;
      totalPrice: number;
      amenities: string[];
    },
  ): Promise<PackageVehiclePricing> {
    const response = await api<{ item: PackageVehiclePricing }>(
      `${PARTNER_BASE_URL}/packages/${packageId}/vehicles`,
      { method: "POST", body: data },
    );
    return response.item;
  },

  async listVehiclePricing(packageId: string): Promise<PackageVehiclePricing[]> {
    const response = await api<{ items: PackageVehiclePricing[] }>(
      `${PARTNER_BASE_URL}/packages/${packageId}/vehicles`,
    );
    return response.items;
  },

  async updateVehiclePricing(
    packageId: string,
    vehicleId: string,
    data: {
      vehicleType: string;
      vehicleName: string;
      seatingCapacity: number;
      pricePerDay: number;
      totalPrice: number;
      amenities: string[];
    },
  ): Promise<PackageVehiclePricing> {
    const response = await api<{ item: PackageVehiclePricing }>(
      `${PARTNER_BASE_URL}/packages/${packageId}/vehicles/${vehicleId}`,
      { method: "PUT", body: data },
    );
    return response.item;
  },

  async deleteVehiclePricing(packageId: string, vehicleId: string): Promise<void> {
    await api<null>(`${PARTNER_BASE_URL}/packages/${packageId}/vehicles/${vehicleId}`, { method: "DELETE" });
  },

  // Availability
  async setAvailability(
    packageId: string,
    dates: Array<{
      date: string;
      status: string;
      priceOverride?: number;
      availableSeats?: number;
    }>,
  ): Promise<PackageAvailability[]> {
    const response = await api<{ items: PackageAvailability[] }>(
      `${PARTNER_BASE_URL}/packages/${packageId}/availability`,
      { method: "POST", body: dates },
    );
    return response.items;
  },

  async getAvailability(
    packageId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PackageAvailability[]> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate.toISOString());
    if (endDate) params.append("endDate", endDate.toISOString());

    const response = await api<{ items: PackageAvailability[] }>(
      `${PARTNER_BASE_URL}/packages/${packageId}/availability${params ? "?" + params : ""}`,
    );
    return response.items;
  },

  // Bookings
  async getPackageBookings(packageId: string): Promise<TaxiPackageBooking[]> {
    const response = await api<{ items: TaxiPackageBooking[] }>(
      `${PARTNER_BASE_URL}/packages/${packageId}/bookings`,
    );
    return response.items;
  },
};
