import { api, ApiError } from "@/lib/api";

// Config-driven client + form metadata for the enquiry-first service modules
// (Transfer, Self-Drive, Islandhopper, Visa). One generic partner API + one public
// API are derived from a base path, and a field list drives the generic manager
// form. SightSeeing predates this and has its own bespoke client/manager.

export type ServiceVerticalKey = "transfer" | "self_drive" | "islandhopper" | "visa";

export type ServiceListingApi = {
  id: string;
  partner: string | { id: string; name?: string; companyName?: string; slug?: string };
  status: "draft" | "pending" | "active" | "paused" | "suspended";
  title: string;
  slug: string;
  description?: string;
  currency: string;
  cancellationPolicy: string;
  tags: string[];
  images: { url: string; caption?: string; isPrimary?: boolean }[];
  createdAt: string;
  updatedAt: string;
  // Module-specific fields are present but not all typed here; the generic UI reads
  // a known subset via the field config.
  [key: string]: unknown;
};

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

export type Pagination = { page: number; limit: number; total: number; totalPages: number };

// ── Field metadata for the generic manager form ──────────────────────────────
export type FieldDef =
  | { kind: "text" | "textarea" | "number"; key: string; label: string; placeholder?: string }
  | { kind: "select"; key: string; label: string; required?: boolean; options: { value: string; label: string }[] }
  | { kind: "csv"; key: string; label: string; placeholder?: string };

export type ServiceModuleConfig = {
  vertical: ServiceVerticalKey;
  basePath: string; // public api/proxy base, e.g. "/api/transfer"
  partnerBasePath: string; // e.g. "/api/partner/transfer"
  detailBase: string; // public detail route base, e.g. "/transfer"
  label: string; // "Transfer"
  singular: string; // "Transfer service"
  plural: string; // "Transfer services"
  blurb: string;
  // Top-level fields rendered in the manager form (besides title/desc/tags/images).
  fields: FieldDef[];
  // Public browse filter controls.
  browseFilters: FieldDef[];
};

const CANCELLATION_OPTIONS = [
  { value: "free_24h", label: "Free cancellation up to 24h" },
  { value: "free_48h", label: "Free cancellation up to 48h" },
  { value: "free_72h", label: "Free cancellation up to 72h" },
  { value: "non_refundable", label: "Non-refundable" },
  { value: "custom", label: "Custom (see terms)" },
];

const TRANSFER_TYPE_OPTIONS = [
  { value: "airport_pickup", label: "Airport Pickup" },
  { value: "airport_dropoff", label: "Airport Drop-off" },
  { value: "round_trip", label: "Round Trip" },
  { value: "intercity", label: "Inter-city" },
  { value: "harbour", label: "Harbour Transfer" },
];

const SELF_DRIVE_CATEGORY_OPTIONS = [
  { value: "economy", label: "Economy" },
  { value: "compact", label: "Compact" },
  { value: "suv", label: "SUV" },
  { value: "luxury", label: "Luxury" },
  { value: "scooter_bike", label: "Scooter / Bike" },
  { value: "electric", label: "Electric" },
];

const ISLANDHOPPER_SERVICE_OPTIONS = [
  { value: "domestic_flight", label: "Domestic Flight" },
  { value: "seaplane", label: "Seaplane" },
  { value: "speedboat", label: "Speedboat" },
  { value: "ferry", label: "Ferry" },
  { value: "yacht_charter", label: "Yacht Charter" },
];

const VISA_TYPE_OPTIONS = [
  { value: "pr", label: "PR Visa" },
  { value: "work", label: "Work Visa" },
  { value: "study", label: "Study Visa" },
  { value: "visit", label: "Visit Visa" },
];

export const SERVICE_MODULES: Record<ServiceVerticalKey, ServiceModuleConfig> = {
  transfer: {
    vertical: "transfer",
    basePath: "/api/transfer",
    partnerBasePath: "/api/partner/transfer",
    detailBase: "/transfer",
    label: "Transfer",
    singular: "Transfer service",
    plural: "Transfer services",
    blurb: "Airport, harbour and inter-city transfers. Enquire with the operator to book.",
    fields: [
      { kind: "select", key: "transferType", label: "Transfer type", required: true, options: TRANSFER_TYPE_OPTIONS },
      { kind: "csv", key: "coverageAreas", label: "Coverage areas (comma separated)", placeholder: "Malé Airport, Hulhumalé" },
      { kind: "number", key: "advanceBookingHours", label: "Advance booking (hours)" },
      { kind: "text", key: "waitingTimePolicy", label: "Waiting time policy" },
      { kind: "select", key: "cancellationPolicy", label: "Cancellation policy", options: CANCELLATION_OPTIONS },
    ],
    browseFilters: [
      { kind: "text", key: "from", label: "From" },
      { kind: "text", key: "to", label: "To" },
      { kind: "select", key: "transferType", label: "Type", options: [{ value: "", label: "Any" }, ...TRANSFER_TYPE_OPTIONS] },
    ],
  },
  self_drive: {
    vertical: "self_drive",
    basePath: "/api/self-drive",
    partnerBasePath: "/api/partner/self-drive",
    detailBase: "/self-drive",
    label: "Self-Drive",
    singular: "Vehicle rental",
    plural: "Vehicle rentals",
    blurb: "Self-drive car, scooter and vehicle rentals. Enquire to reserve.",
    fields: [
      { kind: "number", key: "minRentalDays", label: "Minimum rental days" },
      { kind: "number", key: "maxRentalDays", label: "Maximum rental days" },
      { kind: "text", key: "lateReturnPolicy", label: "Late return policy" },
      { kind: "select", key: "cancellationPolicy", label: "Cancellation policy", options: CANCELLATION_OPTIONS },
    ],
    browseFilters: [
      { kind: "select", key: "category", label: "Category", options: [{ value: "", label: "Any" }, ...SELF_DRIVE_CATEGORY_OPTIONS] },
    ],
  },
  islandhopper: {
    vertical: "islandhopper",
    basePath: "/api/islandhopper",
    partnerBasePath: "/api/partner/islandhopper",
    detailBase: "/islandhopper",
    label: "Islandhopper",
    singular: "Route",
    plural: "Routes",
    blurb: "Inter-island flights, seaplanes, speedboats and ferries. Enquire to book.",
    fields: [
      { kind: "select", key: "serviceType", label: "Service type", required: true, options: ISLANDHOPPER_SERVICE_OPTIONS },
      { kind: "text", key: "departurePoint", label: "Departure point" },
      { kind: "text", key: "checkinPolicy", label: "Check-in policy" },
      { kind: "text", key: "weatherRestrictions", label: "Weather/seasonal restrictions" },
      { kind: "select", key: "cancellationPolicy", label: "Cancellation policy", options: CANCELLATION_OPTIONS },
    ],
    browseFilters: [
      { kind: "text", key: "origin", label: "From island" },
      { kind: "text", key: "destination", label: "To island" },
      { kind: "select", key: "serviceType", label: "Service", options: [{ value: "", label: "Any" }, ...ISLANDHOPPER_SERVICE_OPTIONS] },
    ],
  },
  visa: {
    vertical: "visa",
    basePath: "/api/visa",
    partnerBasePath: "/api/partner/visa",
    detailBase: "/visa/consultancy",
    label: "Visa Consultancy",
    singular: "Consultancy",
    plural: "Consultancies",
    blurb: "Licensed visa consultancies. Enquire for a free assessment or consultation.",
    fields: [
      { kind: "text", key: "licenceNumber", label: "Licence / registration number" },
      { kind: "csv", key: "countriesCovered", label: "Countries covered (comma separated)", placeholder: "Canada, Australia" },
      { kind: "csv", key: "visaTypesOffered", label: "Visa types (pr, work, study, visit)", placeholder: "pr, work, study, visit" },
      { kind: "csv", key: "languages", label: "Languages (comma separated)" },
      { kind: "csv", key: "consultationModes", label: "Consultation modes (in_person, video, phone, email)" },
    ],
    browseFilters: [
      { kind: "text", key: "country", label: "Country" },
      { kind: "select", key: "visaType", label: "Visa type", options: [{ value: "", label: "Any" }, ...VISA_TYPE_OPTIONS] },
    ],
  },
};

export const VISA_TYPE_BY_SLUG: Record<string, { value: string; label: string }> = {
  "pr-visa": { value: "pr", label: "PR Visa" },
  "work-visa": { value: "work", label: "Work Visa" },
  "study-visa": { value: "study", label: "Study Visa" },
  "visit-visa": { value: "visit", label: "Visit Visa" },
};

// ── Generic clients ──────────────────────────────────────────────────────────
function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== null) sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function multipart<T>(path: string, method: "POST" | "PUT", form: FormData): Promise<T> {
  const response = await fetch(path, { method, body: form, credentials: "include" });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (payload && typeof payload.error === "string" && payload.error) || "Request failed";
    throw new ApiError(response.status, message);
  }
  return (payload as { item: T }).item;
}

export function servicePartnerApi(cfg: ServiceModuleConfig) {
  const base = cfg.partnerBasePath;
  return {
    async list(): Promise<ServiceListingApi[]> {
      const res = await api<{ items: ServiceListingApi[] }>(base);
      return res.items;
    },
    async get(id: string): Promise<ServiceListingApi> {
      const res = await api<{ item: ServiceListingApi }>(`${base}/${id}`);
      return res.item;
    },
    create(form: FormData): Promise<ServiceListingApi> {
      return multipart<ServiceListingApi>(base, "POST", form);
    },
    update(id: string, form: FormData): Promise<ServiceListingApi> {
      return multipart<ServiceListingApi>(`${base}/${id}`, "PUT", form);
    },
    async setStatus(id: string, status: string): Promise<ServiceListingApi> {
      const res = await api<{ item: ServiceListingApi }>(`${base}/${id}/status`, { method: "PATCH", body: { status } });
      return res.item;
    },
    async remove(id: string): Promise<void> {
      await api<null>(`${base}/${id}`, { method: "DELETE" });
    },
    async enquiries(status?: string): Promise<ServiceEnquiryApi[]> {
      const res = await api<{ items: ServiceEnquiryApi[] }>(`${base}/enquiries${status ? `?status=${status}` : ""}`);
      return res.items;
    },
    async updateEnquiry(id: string, patch: { status?: string; note?: string }): Promise<ServiceEnquiryApi> {
      const res = await api<{ item: ServiceEnquiryApi }>(`${base}/enquiries/${id}`, { method: "PATCH", body: patch });
      return res.item;
    },
  };
}

export type ServiceEnquiryInput = {
  contact: { name: string; phone: string; email?: string };
  travelDate?: string;
  pax?: { adults: number; children: number; infants: number };
  message?: string;
  details?: Record<string, unknown>;
};

export function servicePublicApi(cfg: ServiceModuleConfig) {
  const base = cfg.basePath;
  return {
    browse(filters: Record<string, string | number | undefined> = {}): Promise<{ items: ServiceListingApi[]; pagination: Pagination }> {
      return api(`${base}${qs(filters)}`);
    },
    get(slug: string): Promise<{ item: ServiceListingApi }> {
      return api(`${base}/${encodeURIComponent(slug)}`);
    },
    enquire(slug: string, input: ServiceEnquiryInput): Promise<{ item: { id: string } }> {
      return api(`${base}/${encodeURIComponent(slug)}/enquire`, { method: "POST", body: input });
    },
  };
}
