export const TAXI_VEHICLE_TYPES = [
  "Sedan",
  "SUV",
  "Hatchback",
  "MUV",
  "Luxury",
  "Tempo Traveller",
] as const;

export const TAXI_FUEL_TYPES = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"] as const;

export const TAXI_TRANSMISSION_TYPES = ["Manual", "Automatic"] as const;

export const TAXI_AVAILABLE_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const TAXI_TIME_SLOTS = [
  "06:00 - 10:00",
  "10:00 - 14:00",
  "14:00 - 18:00",
  "18:00 - 22:00",
  "22:00 - 06:00",
] as const;

export const TAXI_AMENITIES = [
  "Wi-Fi",
  "Phone Charger",
  "Water Bottles",
  "Music System",
  "First Aid Kit",
  "Child Seat",
  "GPS Tracking",
  "Extra Legroom",
] as const;

export type TaxiVehicleType = (typeof TAXI_VEHICLE_TYPES)[number];
export type TaxiFuelType = (typeof TAXI_FUEL_TYPES)[number];
export type TaxiTransmissionType = (typeof TAXI_TRANSMISSION_TYPES)[number];
export type TaxiAvailableDay = (typeof TAXI_AVAILABLE_DAYS)[number];
export type TaxiTimeSlot = (typeof TAXI_TIME_SLOTS)[number];
export type TaxiAmenity = (typeof TAXI_AMENITIES)[number];

export type TaxiListingFile = {
  name: string;
  size: number;
  type: string;
};

export type TaxiBookingRequestStatus = "pending" | "confirmed" | "completed";

export type TaxiBookingRequest = {
  id: string;
  riderName: string;
  route: string;
  pickupDate: string;
  passengers: number;
  quotedFare: number;
  status: TaxiBookingRequestStatus;
};

export type TaxiListing = {
  id: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  mobileNumber: string;
  emailAddress: string;
  businessName: string;
  vehicleType: TaxiVehicleType;
  brand: string;
  model: string;
  registrationNumber: string;
  seatingCapacity: number;
  fuelType: TaxiFuelType;
  transmission: TaxiTransmissionType;
  acAvailable: boolean;
  luggageCapacity: number;
  yearOfManufacture: number;
  operatingCity: string;
  serviceAreas: string[];
  availableRoutes: string[];
  minimumFare: number;
  pricePerKm: number;
  driverIncluded: boolean;
  selfDriveAvailable: boolean;
  rcBook: TaxiListingFile;
  insurance: TaxiListingFile;
  pollutionCertificate: TaxiListingFile;
  drivingLicense: TaxiListingFile;
  vehiclePhotos: TaxiListingFile[];
  availableDays: TaxiAvailableDay[];
  availableTimeSlots: TaxiTimeSlot[];
  description: string;
  amenities: string[];
  acceptTerms: true;
  availabilityEnabled: boolean;
  bookingRequests: TaxiBookingRequest[];
};

export type TaxiListingDraft = {
  fullName: string;
  mobileNumber: string;
  emailAddress: string;
  businessName: string;
  vehicleType: TaxiVehicleType | "";
  brand: string;
  model: string;
  registrationNumber: string;
  seatingCapacity: string;
  fuelType: TaxiFuelType | "";
  transmission: TaxiTransmissionType | "";
  acAvailable: boolean;
  luggageCapacity: string;
  yearOfManufacture: string;
  operatingCity: string;
  serviceAreas: string;
  availableRoutes: string;
  minimumFare: string;
  pricePerKm: string;
  driverIncluded: boolean;
  selfDriveAvailable: boolean;
  rcBook: TaxiListingFile | null;
  insurance: TaxiListingFile | null;
  pollutionCertificate: TaxiListingFile | null;
  drivingLicense: TaxiListingFile | null;
  vehiclePhotos: TaxiListingFile[];
  availableDays: TaxiAvailableDay[];
  availableTimeSlots: TaxiTimeSlot[];
  description: string;
  amenities: string[];
  acceptTerms: boolean;
};

export type TaxiListingDraftKey = keyof TaxiListingDraft;

export type TaxiListingErrors = Partial<Record<TaxiListingDraftKey, string>>;

export type TaxiListingEditorDraft = {
  operatingCity: string;
  serviceAreas: string;
  availableRoutes: string;
  minimumFare: string;
  pricePerKm: string;
  availableDays: TaxiAvailableDay[];
  availableTimeSlots: TaxiTimeSlot[];
  description: string;
  amenities: string[];
};
