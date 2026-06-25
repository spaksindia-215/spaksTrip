import Link from "next/link";
import { formatINR } from "@/lib/format";
import type { EventCard as EventCardType } from "@/services/events";

// Reusable event card for the listing grid. Internal events link to the in-app
// detail page (/events/[slug]); external (Ticketmaster/Insider/BookMyShow) link
// out to the affiliate URL in a new tab with a clear source badge.

const CATEGORY_LABELS: Record<string, string> = {
  concert: "Concert",
  music_festival: "Music Festival",
  comedy_show: "Comedy",
  theatre: "Theatre",
  sports: "Sports",
  exhibition: "Exhibition",
  conference: "Conference",
  workshop: "Workshop",
  food_festival: "Food",
  nightlife: "Nightlife",
  wedding: "Wedding",
  corporate: "Corporate",
  cultural_festival: "Cultural",
  other: "Event",
};

const SOURCE_LABELS: Record<string, string> = {
  ticketmaster: "Ticketmaster",
  insider: "Insider",
  bookmyshow: "BookMyShow",
};

function categoryLabel(c: string): string {
  return CATEGORY_LABELS[c] ?? c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function dateLabel(iso?: string): string {
  if (!iso) return "Date TBA";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date TBA";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function priceLabel(card: EventCardType): string {
  if (card.isFree) return "Free";
  const min = card.priceRange?.min;
  const max = card.priceRange?.max;
  if (min === undefined && max === undefined) return "See pricing";
  if (min !== undefined && max !== undefined && min !== max) return `${formatINR(min)} – ${formatINR(max)}`;
  return formatINR((min ?? max)!);
}

export default function EventCard({ card }: { card: EventCardType }) {
  const image = card.images?.[0] ?? "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80";
  const href = card.isExternal ? card.affiliateUrl ?? "#" : `/events/${card.slug}`;
  const cityLine = [card.venue?.name, card.venue?.city].filter(Boolean).join(", ") || "Venue to be announced";

  const inner = (
    <>
      <div className="relative h-44 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={card.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#0E1E3A]">
          {categoryLabel(card.category)}
        </span>
        {card.isExternal && (
          <span className="absolute right-3 top-3 rounded-full bg-[#0E1E3A]/90 px-2.5 py-1 text-xs font-semibold text-white">
            {SOURCE_LABELS[card.source] ?? "Partner"}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#C5A572]">{dateLabel(card.startDate)}</p>
        <h3 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-[#0E1E3A]">{card.title}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-gray-500">{cityLine}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-sm font-bold text-[#0E1E3A]">{priceLabel(card)}</span>
          <span className="text-xs font-semibold text-[#C5A572]">
            {card.isExternal ? "Book on partner →" : "View details →"}
          </span>
        </div>
      </div>
    </>
  );

  const className =
    "group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-lg";

  if (card.isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
