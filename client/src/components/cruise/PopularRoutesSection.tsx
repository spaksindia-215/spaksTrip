import SectionHeading from "@/components/landing/SectionHeading";

type RouteCard = {
  from: string;
  to: string;
  duration: string;
  sailings: string;
  image: string;
};

const ROUTES: RouteCard[] = [
  {
    from: "Port Blair",
    to: "Havelock Island",
    duration: "Approx. 90 mins",
    sailings: "Fast ferry departures daily",
    image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
  },
  {
    from: "Havelock Island",
    to: "Neil Island",
    duration: "Approx. 60 mins",
    sailings: "Popular inter-island route",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    from: "Neil Island",
    to: "Port Blair",
    duration: "Approx. 75 mins",
    sailings: "Morning and evening options",
    image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function PopularRoutesSection() {
  return (
    <section className="bg-slate-50 py-18 sm:py-22">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Popular Routes"
          subtitle="Choose from the most searched inter-island cruise routes across the Andaman archipelago."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {ROUTES.map((route) => (
            <article
              key={`${route.from}-${route.to}`}
              className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-(--shadow-sm) transition-shadow hover:shadow-(--shadow-lg)"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={route.image}
                  alt={`${route.from} to ${route.to}`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071426]/70 via-transparent to-transparent" />
                <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-brand-700 backdrop-blur">
                  {route.duration}
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2">
                  <div className="rounded-2xl bg-blue-50 px-3 py-2 text-center text-[12px] font-bold text-brand-700">
                    {route.from}
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    width={18}
                    height={18}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                    className="text-slate-300"
                  >
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                  <div className="rounded-2xl bg-cyan-50 px-3 py-2 text-center text-[12px] font-bold text-cyan-700">
                    {route.to}
                  </div>
                </div>
                <p className="mt-4 text-[15px] font-bold text-[#0E1E3A]">
                  {route.from} to {route.to}
                </p>
                <p className="mt-2 text-[13px] leading-6 text-ink-muted">{route.sailings}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
