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

// Typed TaxiPackage as returned by the backend (mirrors the model's toJSON).
export type TaxiPackageApi = {
  id: string;
  partner: string;
  status: "draft" | "active" | "paused" | "suspended";
  title: string;
  slug: string;
  thumbnail?: string;
  route: {
    origin: string;
    destinations: string[];
    totalKm?: number;
    durationDays: number;
    durationNights: number;
  };
  vehicle?: string;
  vehicleSnapshot?: { make?: string; model?: string; type?: string; seatingCap?: number; images: string[] };
  itinerary: {
    day: number;
    title?: string;
    description?: string;
    activities: string[];
    distance?: number;
    overnight?: string;
  }[];
  pricing: {
    basePrice: number;
    currency: string;
    maxPersons?: number;
    extraPersonCharge?: number;
    tollsIncluded: boolean;
    driverAllowance: boolean;
    fuelIncluded: boolean;
  };
  inclusions: string[];
  exclusions: string[];
  startDates: string[];
  blackoutDates: string[];
  advanceBookingDays: number;
  images: { url: string; caption?: string; isPrimary?: boolean }[];
  description?: string;
  highlights: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

// Typed TourListing as returned by the backend (mirrors the model's toJSON).
export type TourListingApi = {
  id: string;
  partner: string;
  status: "draft" | "active" | "paused" | "suspended";
  title: string;
  slug: string;
  category: string;
  basedIn: string;
  coversCities: string[];
  coordinates?: { type: "Point"; coordinates: [number, number] };
  durationHours?: number;
  durationDays?: number;
  durationNights?: number;
  itinerary: { time?: string; title?: string; description?: string; location?: string }[];
  pricing: { label: string; price: number; currency: string; minAge?: number; maxAge?: number }[];
  minGroupSize: number;
  maxGroupSize?: number;
  privateAvailable: boolean;
  privatePrice?: number;
  inclusions: string[];
  exclusions: string[];
  pickupIncluded: boolean;
  pickupPoints: { name?: string; time?: string }[];
  operatingDays: string[];
  startTimes: string[];
  advanceBookingHrs: number;
  blackoutDates: string[];
  images: { url: string; caption?: string; isPrimary?: boolean }[];
  videoUrl?: string;
  description?: string;
  highlights: string[];
  tags: string[];
  languages: string[];
  createdAt: string;
  updatedAt: string;
};

// Minimal hotel listing shape (used for the tour-package includes picker and
// the partner dashboard's recent-activity / status display).
export type HotelListingApi = {
  id: string;
  name: string;
  type: string;
  status: "draft" | "pending" | "active" | "paused" | "suspended";
  address?: { city?: string };
  createdAt: string;
  updatedAt: string;
};

// Full hotel listing as returned by GET /api/partner/hotels/:id — used to prefill
// the partner edit form. Images/rooms/rates/inventory are read-only here.
export type HotelListingDetail = {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: "draft" | "pending" | "active" | "paused" | "suspended";
  starRating?: number;
  address: {
    street?: string;
    city: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  contact?: { phone?: string; email?: string };
  policies?: { checkIn?: string; checkOut?: string; cancellation?: string };
  amenities?: string[];
  images?: { url: string; caption?: string }[];
  rooms?: { name: string }[];
  pricing?: { basePricePerNight?: number; taxPercentage?: number; currency?: string };
  createdAt: string;
  updatedAt: string;
};

// Editable subset sent to PUT /api/partner/hotels/:id.
export type HotelListingUpdate = {
  name?: string;
  description?: string;
  type?: string;
  starRating?: number;
  amenities?: string[];
  address?: { street?: string; city?: string; state?: string; country?: string; postalCode?: string };
  contact?: { phone?: string; email?: string };
  policies?: { checkIn?: string; checkOut?: string; cancellation?: string };
  pricing?: { basePricePerNight?: number; taxPercentage?: number; currency?: string };
};

// Typed TourPackage as returned by the backend (mirrors the model's toJSON).
export type TourPackageApi = {
  id: string;
  partner: string;
  status: "draft" | "active" | "paused" | "suspended";
  title: string;
  slug: string;
  packageType: string;
  thumbnail?: string;
  route: { origin?: string; destinations: string[]; durationDays: number; durationNights: number };
  includes: { taxi?: string; hotels: string[]; tours: string[] };
  customInclusions: string[];
  exclusions: string[];
  itinerary: {
    day: number;
    title?: string;
    description?: string;
    meals: { breakfast: boolean; lunch: boolean; dinner: boolean };
    accommodation?: string;
    activities: string[];
  }[];
  pricing: {
    basePrice: number;
    currency: string;
    perPerson: boolean;
    maxPersons?: number;
    childPrice?: number;
    infantPrice: number;
    extraPersonCharge?: number;
    singleSupplement?: number;
    discounts: { label: string; percent: number; validUntil?: string }[];
  };
  departures: { date: string; seatsTotal?: number; seatsBooked: number; status: string }[];
  images: { url: string; caption?: string; isPrimary?: boolean }[];
  videoUrl?: string;
  description?: string;
  highlights: string[];
  tags: string[];
  difficultyLevel?: string;
  createdAt: string;
  updatedAt: string;
};

// Typed CruiseListing as returned by the backend (mirrors the model's toJSON).
export type CruiseListingApi = {
  id: string;
  partner: string;
  status: "draft" | "active" | "paused" | "suspended";
  cruiseName: string;
  slug: string;
  cruiseType: string;
  vessel: {
    name?: string;
    operator?: string;
    totalDecks?: number;
    builtYear?: number;
    images: { url: string; caption?: string; isPrimary?: boolean }[];
  };
  route: {
    departurePort: string;
    arrivalPort?: string;
    stops: { port?: string; arrivalTime?: string; departureTime?: string }[];
    durationDays: number;
    durationNights?: number;
  };
  cabins: {
    type: string;
    label?: string;
    maxOccupancy?: number;
    pricePerPerson: number;
    currency: string;
    totalCabins?: number;
    amenities: string[];
    images: string[];
    isRefundable: boolean;
  }[];
  shipAmenities: string[];
  diningOptions: string[];
  mealsIncluded: { breakfast: boolean; lunch: boolean; dinner: boolean };
  departures: { date: string; cabinAvailability: { cabinType: string; seatsLeft?: number }[]; status: string }[];
  cancellationPolicy: { freeCancelDays?: number; chargePercent?: number };
  boardingAge: { minAge?: number; maxAge?: number };
  description?: string;
  highlights: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

// Multipart request through the Next.js proxy (forwards cookies + raw body).
// The browser sets the multipart Content-Type/boundary, so we don't.
// Mirrors the api() refresh-and-retry: if the access token is expired,
// call /api/auth/refresh once, then retry the original request.
async function multipart<T>(path: string, method: "POST" | "PATCH" | "PUT", form: FormData): Promise<T> {
  async function attempt(): Promise<Response> {
    return fetch(path, { method, body: form, credentials: "include" });
  }

  let response = await attempt();

  if (response.status === 401) {
    try {
      await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
    } catch {
      // refresh failed — let the retry surface the 401
    }
    response = await attempt();
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (payload && typeof payload.error === "string" && payload.error) || "Request failed";
    throw new ApiError(response.status, message);
  }
  return (payload as { item: T }).item;
}

// Typed SightseeingListing as returned by the backend (mirrors the model's toJSON).
export type SightseeingListingApi = {
  id: string;
  partner: string;
  status: "draft" | "pending" | "active" | "paused" | "suspended";
  title: string;
  slug: string;
  category: string;
  location: { address?: string; island?: string };
  meetingPoint: { instructions?: string };
  description?: string;
  highlights: string[];
  duration: { value?: number; unit: string };
  difficulty?: string;
  ageRestriction: { min?: number; max?: number };
  groupSize: { min: number; max?: number };
  inclusions: string[];
  exclusions: string[];
  whatToBring: string[];
  pricingModel: string;
  currency: string;
  pricing: { adult?: number; child?: number; infant?: number; groupPrice?: number };
  availableDays: string[];
  timeSlots: string[];
  cancellationPolicy: string;
  bookingCutoffHours: number;
  languages: string[];
  accessibility: string[];
  termsAndConditions?: string;
  images: { url: string; caption?: string; isPrimary?: boolean }[];
  videoUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

// A lead routed to the partner (generic ServiceEnquiry, vertical=sightseeing).
export type ServiceEnquiryApi = {
  id: string;
  vertical: string;
  listing: { id: string; title?: string; slug?: string } | string;
  status: "new" | "contacted" | "quoted" | "converted" | "closed" | "spam";
  contact: { name: string; phone: string; email?: string };
  travelDate?: string;
  pax: { adults: number; children: number; infants: number };
  message?: string;
  internalNotes: { at: string; text: string }[];
  createdAt: string;
  updatedAt: string;
};

export type ResourceType =
  | "hotel"
  | "cruise"
  | "taxi"
  | "taxi_package"
  | "tour"
  | "tour_package"
  | "sightseeing"
  | "transfer"
  | "self_drive"
  | "islandhopper"
  | "visa";

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

  // Submit any partner-resource listing for admin review (draft/paused/suspended
  // → pending). `type` is the vertical: taxi | taxi_package | tour | tour_package
  // | cruise | hotel. Returns the new status.
  async submitListing(type: string, id: string): Promise<{ status: string }> {
    const response = await api<{ item: { status: string } }>(
      `/api/partner/listings/${type}/${id}/submit`,
      { method: "POST" },
    );
    return response.item;
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
    async create(form: FormData): Promise<TaxiListingApi> {
      return multipart<TaxiListingApi>("/api/partner/taxis", "POST", form);
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

  // Taxi packages (typed model; thumbnail/images to Cloudinary). create/update
  // are multipart: a `payload` JSON field + optional `thumbnail` and `images`.
  taxiPackages: {
    async list(): Promise<TaxiPackageApi[]> {
      const response = await api<{ items: TaxiPackageApi[] }>("/api/partner/taxi-packages");
      return response.items;
    },

    async create(form: FormData): Promise<TaxiPackageApi> {
      return multipart<TaxiPackageApi>("/api/partner/taxi-packages", "POST", form);
    },

    async update(id: string, form: FormData): Promise<TaxiPackageApi> {
      return multipart<TaxiPackageApi>(`/api/partner/taxi-packages/${id}`, "PATCH", form);
    },

    async remove(id: string): Promise<void> {
      await api<null>(`/api/partner/taxi-packages/${id}`, { method: "DELETE" });
    },
  },

  // Tours (typed model; images to Cloudinary). create/update are multipart:
  // a `payload` JSON field + optional `images`.
  tours: {
    async list(): Promise<TourListingApi[]> {
      const response = await api<{ items: TourListingApi[] }>("/api/partner/tours");
      return response.items;
    },

    async create(form: FormData): Promise<TourListingApi> {
      return multipart<TourListingApi>("/api/partner/tours", "POST", form);
    },

    async update(id: string, form: FormData): Promise<TourListingApi> {
      return multipart<TourListingApi>(`/api/partner/tours/${id}`, "PATCH", form);
    },

    async remove(id: string): Promise<void> {
      await api<null>(`/api/partner/tours/${id}`, { method: "DELETE" });
    },
  },

  // SightSeeing (typed model; images to Cloudinary). create/update are multipart:
  // a `data` JSON field + optional `images`. Enquiries are leads routed to the
  // partner (generic ServiceEnquiry, vertical=sightseeing).
  sightseeing: {
    async list(): Promise<SightseeingListingApi[]> {
      const response = await api<{ items: SightseeingListingApi[] }>("/api/partner/sightseeing");
      return response.items;
    },

    async get(id: string): Promise<SightseeingListingApi> {
      const response = await api<{ item: SightseeingListingApi }>(`/api/partner/sightseeing/${id}`);
      return response.item;
    },

    async create(form: FormData): Promise<SightseeingListingApi> {
      return multipart<SightseeingListingApi>("/api/partner/sightseeing", "POST", form);
    },

    async update(id: string, form: FormData): Promise<SightseeingListingApi> {
      return multipart<SightseeingListingApi>(`/api/partner/sightseeing/${id}`, "PUT", form);
    },

    async setStatus(id: string, status: string): Promise<SightseeingListingApi> {
      const response = await api<{ item: SightseeingListingApi }>(
        `/api/partner/sightseeing/${id}/status`,
        { method: "PATCH", body: { status } },
      );
      return response.item;
    },

    async remove(id: string): Promise<void> {
      await api<null>(`/api/partner/sightseeing/${id}`, { method: "DELETE" });
    },

    async enquiries(status?: string): Promise<ServiceEnquiryApi[]> {
      const q = status ? `?status=${encodeURIComponent(status)}` : "";
      const response = await api<{ items: ServiceEnquiryApi[] }>(`/api/partner/sightseeing/enquiries${q}`);
      return response.items;
    },

    async updateEnquiry(id: string, patch: { status?: string; note?: string }): Promise<ServiceEnquiryApi> {
      const response = await api<{ item: ServiceEnquiryApi }>(
        `/api/partner/sightseeing/enquiries/${id}`,
        { method: "PATCH", body: patch },
      );
      return response.item;
    },
  },

  // Hotels — created via the multipart wizard (POST elsewhere); here we list,
  // fetch one for editing, save core-field edits, and submit for admin review.
  hotels: {
    async list(): Promise<HotelListingApi[]> {
      const response = await api<{ items: HotelListingApi[] }>("/api/partner/hotels");
      return response.items;
    },

    async get(id: string): Promise<HotelListingDetail> {
      const response = await api<{ item: HotelListingDetail }>(`/api/partner/hotels/${id}`);
      return response.item;
    },

    async update(id: string, patch: HotelListingUpdate): Promise<HotelListingDetail> {
      const response = await api<{ item: HotelListingDetail }>(`/api/partner/hotels/${id}`, {
        method: "PUT",
        body: patch,
      });
      return response.item;
    },

    async submit(id: string): Promise<HotelListingDetail> {
      const response = await api<{ item: HotelListingDetail }>(`/api/partner/hotels/${id}/submit`, {
        method: "POST",
      });
      return response.item;
    },

    async remove(id: string): Promise<void> {
      await api<{ ok: true }>(`/api/partner/hotels/${id}`, { method: "DELETE" });
    },
  },

  // Tour packages (typed model; cross-model refs; thumbnail/images to Cloudinary).
  tourPackages: {
    async list(): Promise<TourPackageApi[]> {
      const response = await api<{ items: TourPackageApi[] }>("/api/partner/tour-packages");
      return response.items;
    },

    async create(form: FormData): Promise<TourPackageApi> {
      return multipart<TourPackageApi>("/api/partner/tour-packages", "POST", form);
    },

    async update(id: string, form: FormData): Promise<TourPackageApi> {
      return multipart<TourPackageApi>(`/api/partner/tour-packages/${id}`, "PATCH", form);
    },

    async remove(id: string): Promise<void> {
      await api<null>(`/api/partner/tour-packages/${id}`, { method: "DELETE" });
    },
  },

  // Cruises (typed model; vessel images to Cloudinary). create/update are
  // multipart: a `payload` JSON field + optional `vesselImages`.
  cruises: {
    async list(): Promise<CruiseListingApi[]> {
      const response = await api<{ items: CruiseListingApi[] }>("/api/partner/cruises");
      return response.items;
    },

    async create(form: FormData): Promise<CruiseListingApi> {
      return multipart<CruiseListingApi>("/api/partner/cruises", "POST", form);
    },

    async update(id: string, form: FormData): Promise<CruiseListingApi> {
      return multipart<CruiseListingApi>(`/api/partner/cruises/${id}`, "PATCH", form);
    },

    async remove(id: string): Promise<void> {
      await api<null>(`/api/partner/cruises/${id}`, { method: "DELETE" });
    },
  },
};
