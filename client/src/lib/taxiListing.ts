import type {
  TaxiBookingRequest,
  TaxiListing,
  TaxiListingDraft,
  TaxiListingEditorDraft,
  TaxiListingErrors,
  TaxiListingFile,
} from "@/types/taxiListing";

const TAXI_LISTING_STORAGE_KEY = "spakstrip.list-your-taxi.listings";
const TAXI_LISTING_EVENT = "spakstrip:list-your-taxi:updated";

const PHONE_PATTERN = /^[+\d][\d\s-]{9,14}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createEmptyTaxiListingDraft(): TaxiListingDraft {
  return {
    fullName: "",
    mobileNumber: "",
    emailAddress: "",
    businessName: "",
    vehicleType: "",
    brand: "",
    model: "",
    registrationNumber: "",
    seatingCapacity: "",
    fuelType: "",
    transmission: "",
    acAvailable: true,
    luggageCapacity: "",
    yearOfManufacture: "",
    operatingCity: "",
    serviceAreas: "",
    availableRoutes: "",
    minimumFare: "",
    pricePerKm: "",
    driverIncluded: true,
    selfDriveAvailable: false,
    rcBook: null,
    insurance: null,
    pollutionCertificate: null,
    drivingLicense: null,
    vehiclePhotos: [],
    availableDays: [],
    availableTimeSlots: [],
    description: "",
    amenities: [],
    acceptTerms: false,
  };
}

export function createTaxiListingEditorDraft(listing: TaxiListing): TaxiListingEditorDraft {
  return {
    operatingCity: listing.operatingCity,
    serviceAreas: listing.serviceAreas.join(", "),
    availableRoutes: listing.availableRoutes.join(", "),
    minimumFare: String(listing.minimumFare),
    pricePerKm: String(listing.pricePerKm),
    availableDays: listing.availableDays,
    availableTimeSlots: listing.availableTimeSlots,
    description: listing.description,
    amenities: listing.amenities,
  };
}

export function serializeFiles(files: FileList | null): TaxiListingFile[] {
  if (!files) return [];

  return Array.from(files).map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type,
  }));
}

export function validateTaxiListingDraft(draft: TaxiListingDraft): TaxiListingErrors {
  const errors: TaxiListingErrors = {};
  const currentYear = new Date().getFullYear() + 1;

  if (!draft.fullName.trim()) errors.fullName = "Full name is required.";
  if (!PHONE_PATTERN.test(draft.mobileNumber.trim())) {
    errors.mobileNumber = "Enter a valid mobile number.";
  }
  if (!EMAIL_PATTERN.test(draft.emailAddress.trim())) {
    errors.emailAddress = "Enter a valid email address.";
  }
  if (!draft.vehicleType) errors.vehicleType = "Select a vehicle type.";
  if (!draft.brand.trim()) errors.brand = "Brand is required.";
  if (!draft.model.trim()) errors.model = "Model is required.";
  if (!draft.registrationNumber.trim()) {
    errors.registrationNumber = "Registration number is required.";
  }

  const seatingCapacity = Number(draft.seatingCapacity);
  if (!Number.isFinite(seatingCapacity) || seatingCapacity < 1) {
    errors.seatingCapacity = "Enter a valid seating capacity.";
  }

  if (!draft.fuelType) errors.fuelType = "Select a fuel type.";
  if (!draft.transmission) errors.transmission = "Select a transmission type.";

  const luggageCapacity = Number(draft.luggageCapacity);
  if (!Number.isFinite(luggageCapacity) || luggageCapacity < 0) {
    errors.luggageCapacity = "Enter a valid luggage capacity.";
  }

  const yearOfManufacture = Number(draft.yearOfManufacture);
  if (!Number.isFinite(yearOfManufacture) || yearOfManufacture < 1990 || yearOfManufacture > currentYear) {
    errors.yearOfManufacture = "Enter a valid manufacture year.";
  }

  if (!draft.operatingCity.trim()) errors.operatingCity = "Operating city is required.";
  if (toList(draft.serviceAreas).length === 0) {
    errors.serviceAreas = "Add at least one service area.";
  }
  if (toList(draft.availableRoutes).length === 0) {
    errors.availableRoutes = "Add at least one route.";
  }

  const minimumFare = Number(draft.minimumFare);
  if (!Number.isFinite(minimumFare) || minimumFare <= 0) {
    errors.minimumFare = "Enter a valid minimum fare.";
  }

  const pricePerKm = Number(draft.pricePerKm);
  if (!Number.isFinite(pricePerKm) || pricePerKm <= 0) {
    errors.pricePerKm = "Enter a valid per-km price.";
  }

  if (!draft.rcBook) errors.rcBook = "RC Book is required.";
  if (!draft.insurance) errors.insurance = "Insurance document is required.";
  if (!draft.pollutionCertificate) {
    errors.pollutionCertificate = "Pollution certificate is required.";
  }
  if (!draft.drivingLicense) errors.drivingLicense = "Driving license is required.";
  if (draft.vehiclePhotos.length === 0) {
    errors.vehiclePhotos = "Upload at least one vehicle photo.";
  }
  if (draft.availableDays.length === 0) {
    errors.availableDays = "Choose at least one available day.";
  }
  if (draft.availableTimeSlots.length === 0) {
    errors.availableTimeSlots = "Choose at least one time slot.";
  }
  if (!draft.description.trim()) errors.description = "Description is required.";
  if (draft.amenities.length === 0) errors.amenities = "Select at least one amenity.";
  if (!draft.acceptTerms) errors.acceptTerms = "You must accept the terms to continue.";

  return errors;
}

export function createTaxiListingFromDraft(draft: TaxiListingDraft): TaxiListing {
  const now = new Date().toISOString();
  const serviceAreas = toList(draft.serviceAreas);
  const availableRoutes = toList(draft.availableRoutes);
  const vehicleType = requireSelection(draft.vehicleType, "Vehicle type");
  const fuelType = requireSelection(draft.fuelType, "Fuel type");
  const transmission = requireSelection(draft.transmission, "Transmission");
  const listing: TaxiListing = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    fullName: draft.fullName.trim(),
    mobileNumber: draft.mobileNumber.trim(),
    emailAddress: draft.emailAddress.trim(),
    businessName: draft.businessName.trim(),
    vehicleType,
    brand: draft.brand.trim(),
    model: draft.model.trim(),
    registrationNumber: draft.registrationNumber.trim().toUpperCase(),
    seatingCapacity: Number(draft.seatingCapacity),
    fuelType,
    transmission,
    acAvailable: draft.acAvailable,
    luggageCapacity: Number(draft.luggageCapacity),
    yearOfManufacture: Number(draft.yearOfManufacture),
    operatingCity: draft.operatingCity.trim(),
    serviceAreas,
    availableRoutes,
    minimumFare: Number(draft.minimumFare),
    pricePerKm: Number(draft.pricePerKm),
    driverIncluded: draft.driverIncluded,
    selfDriveAvailable: draft.selfDriveAvailable,
    rcBook: ensureFile(draft.rcBook),
    insurance: ensureFile(draft.insurance),
    pollutionCertificate: ensureFile(draft.pollutionCertificate),
    drivingLicense: ensureFile(draft.drivingLicense),
    vehiclePhotos: draft.vehiclePhotos,
    availableDays: draft.availableDays,
    availableTimeSlots: draft.availableTimeSlots,
    description: draft.description.trim(),
    amenities: draft.amenities,
    acceptTerms: true,
    availabilityEnabled: true,
    bookingRequests: buildMockBookingRequests(
      draft.fullName.trim(),
      draft.operatingCity.trim(),
      serviceAreas,
      availableRoutes,
      Number(draft.minimumFare),
      Number(draft.seatingCapacity),
    ),
  };

  return listing;
}

export function applyTaxiListingEditorDraft(
  listing: TaxiListing,
  draft: TaxiListingEditorDraft,
): TaxiListing {
  return {
    ...listing,
    updatedAt: new Date().toISOString(),
    operatingCity: draft.operatingCity.trim(),
    serviceAreas: toList(draft.serviceAreas),
    availableRoutes: toList(draft.availableRoutes),
    minimumFare: Number(draft.minimumFare),
    pricePerKm: Number(draft.pricePerKm),
    availableDays: draft.availableDays,
    availableTimeSlots: draft.availableTimeSlots,
    description: draft.description.trim(),
    amenities: draft.amenities,
  };
}

export function validateTaxiListingEditorDraft(draft: TaxiListingEditorDraft) {
  const errors: Partial<Record<keyof TaxiListingEditorDraft, string>> = {};

  if (!draft.operatingCity.trim()) errors.operatingCity = "Operating city is required.";
  if (toList(draft.serviceAreas).length === 0) {
    errors.serviceAreas = "Add at least one service area.";
  }
  if (toList(draft.availableRoutes).length === 0) {
    errors.availableRoutes = "Add at least one route.";
  }
  if (!Number.isFinite(Number(draft.minimumFare)) || Number(draft.minimumFare) <= 0) {
    errors.minimumFare = "Enter a valid minimum fare.";
  }
  if (!Number.isFinite(Number(draft.pricePerKm)) || Number(draft.pricePerKm) <= 0) {
    errors.pricePerKm = "Enter a valid per-km price.";
  }
  if (draft.availableDays.length === 0) {
    errors.availableDays = "Choose at least one available day.";
  }
  if (draft.availableTimeSlots.length === 0) {
    errors.availableTimeSlots = "Choose at least one time slot.";
  }
  if (!draft.description.trim()) errors.description = "Description is required.";
  if (draft.amenities.length === 0) errors.amenities = "Select at least one amenity.";

  return errors;
}

export function getStoredTaxiListings(): TaxiListing[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(TAXI_LISTING_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as TaxiListing[];
  } catch {
    return [];
  }
}

export function saveStoredTaxiListings(listings: TaxiListing[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TAXI_LISTING_STORAGE_KEY, JSON.stringify(listings));
  window.dispatchEvent(new Event(TAXI_LISTING_EVENT));
}

export function upsertTaxiListing(listing: TaxiListing): TaxiListing[] {
  const current = getStoredTaxiListings();
  const index = current.findIndex((item) => item.id === listing.id);
  const next =
    index === -1
      ? [listing, ...current]
      : current.map((item) => (item.id === listing.id ? listing : item));

  saveStoredTaxiListings(next);
  return next;
}

export function setTaxiListingAvailability(id: string, availabilityEnabled: boolean): TaxiListing[] {
  const current = getStoredTaxiListings();
  const next = current.map((item) =>
    item.id === id
      ? {
          ...item,
          availabilityEnabled,
          updatedAt: new Date().toISOString(),
        }
      : item,
  );

  saveStoredTaxiListings(next);
  return next;
}

export function taxiListingStorageKey() {
  return TAXI_LISTING_STORAGE_KEY;
}

export function subscribeTaxiListings(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(TAXI_LISTING_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(TAXI_LISTING_EVENT, onStoreChange);
  };
}

function ensureFile(file: TaxiListingFile | null): TaxiListingFile {
  if (!file) {
    return {
      name: "",
      size: 0,
      type: "",
    };
  }

  return file;
}

function requireSelection<T extends string>(value: T | "", label: string): Exclude<T, ""> {
  if (!value) {
    throw new Error(`${label} is required.`);
  }

  return value as Exclude<T, "">;
}

function toList(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function buildMockBookingRequests(
  ownerName: string,
  city: string,
  serviceAreas: string[],
  availableRoutes: string[],
  minimumFare: number,
  seatingCapacity: number,
): TaxiBookingRequest[] {
  const fallbackArea = serviceAreas[0] ?? `${city} Central`;
  const fallbackRoute = availableRoutes[0] ?? `${city} Airport Drop`;
  const dayOne = addDays(2);
  const dayTwo = addDays(5);
  const contactName = ownerName.split(" ")[0] || "Partner";

  return [
    {
      id: createId(),
      riderName: "Aarav Mehta",
      route: `${city} to ${fallbackArea}`,
      pickupDate: dayOne,
      passengers: Math.max(1, Math.min(seatingCapacity, 2)),
      quotedFare: minimumFare,
      status: "pending",
    },
    {
      id: createId(),
      riderName: `${contactName} Referral`,
      route: fallbackRoute,
      pickupDate: dayTwo,
      passengers: Math.max(1, Math.min(seatingCapacity, 4)),
      quotedFare: minimumFare + 450,
      status: "confirmed",
    },
  ];
}

function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `taxi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
