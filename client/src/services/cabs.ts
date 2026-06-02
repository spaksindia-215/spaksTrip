import type { CabOffer, CabType } from "@/lib/mock/cabs";
import { api } from "@/lib/api";

export type { CabOffer, CabType };

export type CabSearchInput = {
  from: string;
  to: string;
  date: string;
};

type ServerTaxiListing = {
  id: string;
  title: string;
  price: number;
  metadata: {
    vehicleType?: string;
    brand?: string;
    model?: string;
    seatingCapacity?: number;
    acAvailable?: boolean;
    minimumFare?: number;
    pricePerKm?: number;
    amenities?: string[];
    operatingCity?: string;
  };
};

function vehicleTypeToCategory(vehicleType?: string): CabType {
  const v = (vehicleType ?? "").toLowerCase();
  if (v.includes("mini") || v.includes("hatchback")) return "Mini";
  if (v.includes("sedan") || v.includes("dzire") || v.includes("etios")) return "Sedan";
  if (v.includes("suv") || v.includes("innova") || v.includes("scorpio")) return "SUV";
  if (v.includes("luxury") || v.includes("premium") || v.includes("mercedes") || v.includes("bmw")) return "Luxury";
  if (v.includes("van") || v.includes("traveller") || v.includes("tempo") || v.includes("bus")) return "Van";
  return "Sedan";
}

function serverTaxiToCabOffer(taxi: ServerTaxiListing): CabOffer {
  const type = vehicleTypeToCategory(taxi.metadata.vehicleType);
  return {
    id: taxi.id,
    type,
    name: taxi.title,
    seats: taxi.metadata.seatingCapacity ?? 4,
    ac: taxi.metadata.acAvailable ?? true,
    rating: 4.2,
    ratingCount: 0,
    basePrice: taxi.metadata.minimumFare ?? taxi.price,
    pricePerKm: taxi.metadata.pricePerKm ?? 15,
    eta: 10,
    features: taxi.metadata.amenities ?? ["AC", "GPS tracked"],
    imageHue: Math.abs(taxi.id.charCodeAt(0) * 37 + taxi.id.charCodeAt(1) * 17) % 360,
  };
}

export async function searchCabs(input: CabSearchInput): Promise<CabOffer[]> {
  try {
    const params = new URLSearchParams();
    if (input.from) params.set("city", input.from);
    const response = await api<{ items: ServerTaxiListing[] }>(
      `/api/customer/taxis?${params}`,
    );
    return (response.items ?? []).map(serverTaxiToCabOffer);
  } catch {
    return [];
  }
}

export async function getCab(id: string): Promise<CabOffer | null> {
  try {
    const response = await api<{ item: ServerTaxiListing }>(`/api/customer/taxis/${id}`);
    return serverTaxiToCabOffer(response.item);
  } catch {
    return null;
  }
}

export async function createTaxiBooking(data: {
  taxiId?: string;
  pickupLocation: string;
  dropLocation: string;
  pickupDate: string;
  pickupTime?: string;
  vehicleType?: string;
  passengers: number;
  amount: number;
  customerDetails: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    address?: string;
    state?: string;
    city?: string;
    additionalNotes?: string;
  };
}): Promise<{ id: string }> {
  const response = await api<{ item: { id: string } }>("/api/customer/taxis/book", {
    method: "POST",
    body: data,
  });
  return response.item;
}
