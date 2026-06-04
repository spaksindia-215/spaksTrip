import { TAXI_AVAILABLE_DAYS, TAXI_TIME_SLOTS } from "@/types/taxiListing";
import type {
  TaxiAvailableDay,
  TaxiListingDraft,
  TaxiListingEditorDraft,
  TaxiListingErrors,
  TaxiListingFile,
  TaxiListingUploadFiles,
  TaxiListingView,
  TaxiTimeSlot,
} from "@/types/taxiListing";
import type { TaxiListingApi, TaxiListingUpdate } from "@/lib/partnerClient";

// Partner taxi listings are persisted in the backend DB (MTI TaxiListing model)
// and images/docs go to Cloudinary — no localStorage. This module owns the
// draft/validation helpers, the multipart builder for create, and the mappers
// between the API shape and the dashboard's flat view.

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

export function createTaxiListingEditorDraft(listing: TaxiListingView): TaxiListingEditorDraft {
  return {
    operatingCity: listing.operatingCity,
    serviceAreas: listing.serviceAreas.join(", "),
    availableRoutes: listing.availableRoutes.join(", "),
    minimumFare: String(listing.minimumFare),
    pricePerKm: String(listing.pricePerKm),
    // The editor's checkboxes use the known literal sets; values outside them
    // simply won't match a checkbox.
    availableDays: listing.availableDays.filter((d): d is TaxiAvailableDay =>
      (TAXI_AVAILABLE_DAYS as readonly string[]).includes(d),
    ),
    availableTimeSlots: listing.availableTimeSlots.filter((s): s is TaxiTimeSlot =>
      (TAXI_TIME_SLOTS as readonly string[]).includes(s),
    ),
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

// Assemble the multipart request body for POST /api/partner/taxis: a `payload`
// JSON field (everything the backend validator maps to the MTI model) plus the
// real file objects the form retained.
export function buildTaxiListingFormData(
  draft: TaxiListingDraft,
  files: TaxiListingUploadFiles,
): FormData {
  const payload = {
    fullName: draft.fullName.trim(),
    mobileNumber: draft.mobileNumber.trim(),
    emailAddress: draft.emailAddress.trim(),
    businessName: draft.businessName.trim(),
    vehicleType: draft.vehicleType,
    brand: draft.brand.trim(),
    model: draft.model.trim(),
    registrationNumber: draft.registrationNumber.trim().toUpperCase(),
    seatingCapacity: Number(draft.seatingCapacity),
    fuelType: draft.fuelType,
    transmission: draft.transmission,
    acAvailable: draft.acAvailable,
    luggageCapacity: Number(draft.luggageCapacity),
    yearOfManufacture: Number(draft.yearOfManufacture),
    operatingCity: draft.operatingCity.trim(),
    serviceAreas: toList(draft.serviceAreas),
    availableRoutes: toList(draft.availableRoutes),
    minimumFare: Number(draft.minimumFare),
    pricePerKm: Number(draft.pricePerKm),
    driverIncluded: draft.driverIncluded,
    selfDriveAvailable: draft.selfDriveAvailable,
    availableDays: draft.availableDays,
    availableTimeSlots: draft.availableTimeSlots,
    description: draft.description.trim(),
    amenities: draft.amenities,
    availabilityEnabled: true,
  };

  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  files.vehiclePhotos.forEach((file) => form.append("vehiclePhotos", file));
  if (files.rcBook) form.append("rcBook", files.rcBook);
  if (files.insurance) form.append("insurance", files.insurance);
  if (files.pollutionCertificate) form.append("pollutionCertificate", files.pollutionCertificate);
  if (files.drivingLicense) form.append("drivingLicense", files.drivingLicense);

  return form;
}

// Map a stored MTI taxi listing (API shape) into the flat dashboard view.
export function taxiViewFromApi(listing: TaxiListingApi): TaxiListingView {
  const service = listing.services[0];
  return {
    id: listing.id,
    vehicleType: prettifyToken(listing.vehicle.type),
    brand: listing.vehicle.make,
    model: listing.vehicle.model,
    registrationNumber: listing.vehicle.registrationNumber ?? "",
    seatingCapacity: listing.vehicle.seatingCap,
    fuelType: listing.vehicle.fuelType ? prettifyToken(listing.vehicle.fuelType) : "",
    transmission: listing.vehicle.transmission ? prettifyToken(listing.vehicle.transmission) : "",
    fullName: listing.contact.name ?? "",
    operatingCity: service?.coverage.baseCity ?? "",
    serviceAreas: service?.coverage.servicedCities ?? [],
    availableRoutes: listing.routes,
    minimumFare: service?.pricing.baseFare ?? 0,
    pricePerKm: service?.pricing.pricePerKm ?? 0,
    availableDays: listing.operatingDays,
    availableTimeSlots: listing.operationalHours.slots.map((s) => `${s.from} - ${s.to}`),
    description: listing.description ?? "",
    amenities: listing.vehicle.amenities,
    images: listing.vehicle.images.map((i) => i.url),
    availabilityEnabled: listing.status === "active",
    updatedAt: listing.updatedAt,
  };
}

// Build the PATCH body for an editor save.
export function buildTaxiUpdatePatch(draft: TaxiListingEditorDraft): TaxiListingUpdate {
  return {
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

// "tempo_traveller" → "Tempo Traveller"
function prettifyToken(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
