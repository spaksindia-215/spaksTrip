import Link from "next/link";
import EventConsultForm from "./EventConsultForm";

const EVENT_LINKS = [
  { label: "Wedding Planner",       href: "/events/wedding" },
  { label: "Corporate Events",      href: "/events/corporate-events" },
  { label: "Destination Wedding",   href: "/events/destination-wedding" },
  { label: "Birthday Party",        href: "/events/birthday-party" },
  { label: "Engagement Planner",    href: "/events/engagement" },
  { label: "Cocktail Party",        href: "/events/cocktail-party" },
];

export default function EventSidebar({
  activeEvent,
  eventType,
}: {
  activeEvent: string;
  eventType: string;
}) {
  return (
    <aside className="w-full md:w-72 shrink-0 flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="#1F86C7" strokeWidth={2} aria-hidden="true">
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 className="text-base font-bold text-[#0E1E3A]">Other Services</h3>
        </div>
        <ul className="flex flex-col divide-y divide-zinc-100">
          {EVENT_LINKS.map((v) => (
            <li key={v.label}>
              <Link
                href={v.href}
                className={`block py-2.5 text-sm transition-colors hover:text-[#1F86C7] ${
                  v.label === activeEvent ? "font-semibold text-[#0E1E3A]" : "text-zinc-600"
                }`}
              >
                {v.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-zinc-200 p-5">
        <h3 className="text-base font-bold text-[#0E1E3A] mb-4">Consult with Us</h3>
        <EventConsultForm eventType={eventType} />
      </div>
    </aside>
  );
}
