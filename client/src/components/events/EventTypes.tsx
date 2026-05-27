import Link from "next/link";

type EventType = { name: string; image: string; href: string };

const EVENT_TYPES: EventType[] = [
  {
    name: "Wedding Planner",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    href: "/events/wedding",
  },
  {
    name: "Corporate Events",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
    href: "/events/corporate-events",
  },
  {
    name: "Destination Wedding",
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
    href: "/events/destination-wedding",
  },
  {
    name: "Engagement Planner",
    image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=800&q=80",
    href: "/events/engagement",
  },
  {
    name: "Birthday Party Planner",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
    href: "/events/birthday-party",
  },
  {
    name: "Cocktail Party",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
    href: "/events/cocktail-party",
  },
];

export default function EventTypes() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {EVENT_TYPES.map((evt) => (
            <Link
              key={evt.name}
              href={evt.href}
              className="group block rounded-xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="overflow-hidden h-52">
                <img
                  src={evt.image}
                  alt={evt.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="px-5 py-4">
                <p className="text-base font-bold text-[#0E1E3A] text-center">{evt.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
