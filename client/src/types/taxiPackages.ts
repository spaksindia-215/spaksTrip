// Destination Types
export interface TaxiPackageDestination {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Itinerary Types
export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  image?: string;
}

// Package Details Metadata
export interface TaxiPackageMetadata {
  destinationId?: string;
  slug: string;
  pickupLocation: string;
  dropLocation: string;
  pickupCoordinates?: { lat: number; lng: number };
  dropCoordinates?: { lat: number; lng: number };
  durationDays: number;
  durationNights: number;
  coverImage: string;
  galleryImages: string[];
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions?: string[];
  basePrice: number;
}

// Package
export interface TaxiPackage {
  id: string;
  partnerId: string;
  type: "taxi_package";
  title: string;
  description: string;
  price: number;
  metadata: TaxiPackageMetadata;
  createdAt: string;
  updatedAt: string;
  vehicles?: PackageVehiclePricing[];
}

// Vehicle Pricing
export interface PackageVehiclePricing {
  id: string;
  packageId: string;
  partnerId: string;
  vehicleType: string;
  vehicleName: string;
  seatingCapacity: number;
  pricePerDay: number;
  totalPrice: number;
  amenities: string[];
  createdAt: string;
  updatedAt: string;
}

// Availability Types
export type AvailabilityStatus = "AVAILABLE" | "SOLD_OUT" | "ON_REQUEST" | "BLOCKED";

export interface PackageAvailability {
  id: string;
  packageId: string;
  vehiclePricingId?: string;
  partnerId: string;
  date: string;
  status: AvailabilityStatus;
  priceOverride?: number;
  availableSeats?: number;
  createdAt: string;
  updatedAt: string;
}

// Booking Types
export type BookingStatus = "active" | "held" | "cancelled" | "completed";

export interface BookingDetails {
  packageName: string;
  packageId: string;
  vehicleName: string;
  vehicleId: string;
  startDate: string;
  travellers: number;
  children?: number;
  customerDetails?: {
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
}

export interface TaxiPackageBooking {
  id: string;
  ownerId: string;
  ownerRole: "customer";
  partnerId: string;
  productType: "package";
  status: BookingStatus;
  pnr?: string;
  amount: number;
  currency: string;
  holdExpiresAt?: string;
  cancelRequestedAt?: string;
  details: BookingDetails;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ListResponse<T> {
  items: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DetailResponse<T> {
  item: T;
}

export interface ListDestinationsResponse extends ListResponse<TaxiPackageDestination> {}
export interface GetDestinationResponse extends DetailResponse<TaxiPackageDestination> {}
export interface ListPackagesResponse extends ListResponse<TaxiPackage> {}
export interface GetPackageResponse extends DetailResponse<TaxiPackage> {}
export interface ListAvailabilityResponse extends ListResponse<PackageAvailability> {}
export interface ListVehiclesResponse extends ListResponse<PackageVehiclePricing> {}
export interface CreateBookingResponse extends DetailResponse<TaxiPackageBooking> {}
export interface ListBookingsResponse extends ListResponse<TaxiPackageBooking> {}
export interface GetBookingResponse extends DetailResponse<TaxiPackageBooking> {}
