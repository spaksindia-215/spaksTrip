import { api } from "@/lib/api";

// Client service for the Events module. Calls the same-origin proxy routes
// (/api/events, /api/bookings/events) which forward to the Express backend.

export type EventCategory = string;

// Unified card from GET /api/events (internal published + cached external).
export interface EventCard {
  id: string;
  title: string;
  slug?: string;
  category: EventCategory;
  startDate?: string;
  endDate?: string;
  venue: { name?: string; city?: string };
  images: string[];
  priceRange?: { min?: number; max?: number; currency?: string };
  isFree: boolean;
  isExternal: boolean;
  bookingType: "direct" | "affiliate";
  affiliateUrl?: string;
  source: "internal" | "ticketmaster" | "insider" | "bookmyshow";
}

export interface EventTicket {
  _id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  totalQuantity: number;
  availableQuantity: number;
  maxPerOrder: number;
  isActive: boolean;
}

// Full event from GET /api/events/:slug (internal EventListing toJSON).
export interface EventDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: EventCategory;
  eventType: "in_person" | "virtual" | "hybrid";
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  venue?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    landmark?: string;
  };
  images: { url: string; isPrimary?: boolean }[];
  tickets: EventTicket[];
  priceRange: { min: number; max: number };
  isFree: boolean;
  isSoldOut: boolean;
  organizer: { name: string; phone?: string; email?: string; website?: string };
  cancellationPolicy: string;
  cancellationDetails?: string;
  termsAndConditions?: string;
  ageRestriction?: { hasRestriction: boolean; minimumAge?: number };
}

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface EventBooking {
  id: string;
  bookingReference: string;
  event: string | { title?: string; slug?: string; startDate?: string; venue?: { city?: string } };
  tickets: { ticketName: string; quantity: number; unitPrice: number; subtotal: number }[];
  subtotal: number;
  platformFee: number;
  gst: number;
  totalAmount: number;
  paymentStatus: string;
  status: string;
  qrCode?: string;
  bookedAt?: string;
}

export interface EventFilters {
  city?: string;
  category?: string;
  eventType?: string;
  isFree?: boolean;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  includeExternal?: boolean;
}

function toQuery(filters: EventFilters): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === "") continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const eventsService = {
  list(filters: EventFilters = {}): Promise<Paginated<EventCard>> {
    return api<Paginated<EventCard>>(`/api/events${toQuery(filters)}`);
  },
  categories(): Promise<{ items: { category: string; count: number }[] }> {
    return api(`/api/events/categories`);
  },
  cities(): Promise<{ items: { city: string; count: number }[] }> {
    return api(`/api/events/cities`);
  },
  get(slug: string): Promise<{ item: EventDetail }> {
    return api<{ item: EventDetail }>(`/api/events/${encodeURIComponent(slug)}`);
  },
  book(
    slug: string,
    body: { tickets: { ticketTypeId: string; quantity: number }[]; attendees?: { name: string; email?: string; phone?: string; age?: number }[] },
  ): Promise<{
    free?: boolean;
    booking: EventBooking;
    payment?: { orderId: string; amount: number; currency: string };
  }> {
    return api(`/api/events/${encodeURIComponent(slug)}/book`, { method: "POST", body });
  },
  verifyPayment(body: {
    bookingReference: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<{ booking: EventBooking }> {
    return api(`/api/events/booking/verify`, { method: "POST", body });
  },
  myBookings(): Promise<{ items: EventBooking[] }> {
    return api(`/api/bookings/events`);
  },
  myBooking(ref: string): Promise<{ item: EventBooking }> {
    return api(`/api/bookings/events/${encodeURIComponent(ref)}`);
  },
  cancel(ref: string, reason?: string): Promise<{ item: EventBooking }> {
    return api(`/api/bookings/events/${encodeURIComponent(ref)}/cancel`, { method: "POST", body: { reason } });
  },
};
