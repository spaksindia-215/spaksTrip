import type { Amenity } from "@/lib/mock/hotels";

const AMENITY_CONFIG: Record<Amenity, { label: string; icon: React.ReactNode }> = {
  wifi: {
    label: "Free WiFi",
    icon: (
      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
    ),
  },
  pool: {
    label: "Swimming Pool",
    icon: (
      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M2 12h20M2 20h20M2 4h20" /><circle cx="12" cy="8" r="3" />
      </svg>
    ),
  },
  gym: {
    label: "Fitness Center",
    icon: (
      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 4v16M18 4v16M2 9h4M18 9h4M2 15h4M18 15h4" />
      </svg>
    ),
  },
  spa: {
    label: "Spa",
    icon: (
      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 22a10 10 0 0 1-8.7-15" /><path d="M12 2a10 10 0 0 1 8.7 15" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
  },
  restaurant: {
    label: "Restaurant",
    icon: (
      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6h5zm0 0v7" />
      </svg>
    ),
  },
  bar: {
    label: "Bar & Lounge",
    icon: (
      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M8 22h8M12 11v11M3 3h18l-2 7H5z" />
      </svg>
    ),
  },
  parking: {
    label: "Free Parking",
    icon: (
      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="2" y="2" width="20" height="20" rx="3" /><path d="M8 16V8h5a3 3 0 0 1 0 6H8" />
      </svg>
    ),
  },
  ac: {
    label: "Air Conditioning",
    icon: (
      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2m-4 4v-4" />
        <line x1="12" y1="12" x2="12" y2="12.01" />
      </svg>
    ),
  },
  breakfast: {
    label: "Breakfast Included",
    icon: (
      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  pet_friendly: {
    label: "Pet Friendly",
    icon: (
      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
  },
  business_center: {
    label: "Business Center",
    icon: (
      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  airport_shuttle: {
    label: "Airport Shuttle",
    icon: (
      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2" />
        <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
      </svg>
    ),
  },
  beach_access: {
    label: "Beach Access",
    icon: (
      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M17.5 8a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0z" /><path d="M3 20h18" /><path d="M12 8v12" />
      </svg>
    ),
  },
  rooftop: {
    label: "Rooftop",
    icon: (
      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 21h18M5 21V10l7-7 7 7v11" /><path d="M9 21v-6h6v6" />
      </svg>
    ),
  },
};

export default function HotelAmenitiesGrid({ amenities, otherServices }: { amenities: Amenity[]; otherServices?: string[] }) {
  return (
    <div className="space-y-4">
      {amenities.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {amenities.map((a) => {
            const config = AMENITY_CONFIG[a];
            if (!config) return null;
            return (
              <div key={a} className="flex items-center gap-2.5 rounded-lg bg-surface-muted px-3 py-2.5">
                <span className="text-brand-600 shrink-0">{config.icon}</span>
                <span className="text-[12px] font-semibold text-ink">{config.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {otherServices && otherServices.length > 0 && (
        <div className="space-y-2">
          <p className="text-[12px] font-semibold text-ink-muted">Other Services & Facilities</p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {otherServices.map((service, idx) => (
              <li key={idx} className="text-[12px] text-ink-soft flex items-start gap-2">
                <span className="text-brand-600 mt-0.5 flex-shrink-0">•</span>
                <span>{service}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
