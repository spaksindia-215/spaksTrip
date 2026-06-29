import SectionHeading from "@/components/landing/SectionHeading";

type Destination = { name: string; cruises: number; image: string };

const BENTO: Destination[] = [
  { name: "Caribbean",      cruises: 100, image: "https://images.unsplash.com/photo-1559494007-9f5847c49d94?auto=format&fit=crop&w=900&q=80" },
  { name: "Mediterranean",  cruises: 200, image: "https://images.unsplash.com/photo-1504512485720-7d83a16ee930?auto=format&fit=crop&w=900&q=80" },
  { name: "Alaska",         cruises: 370, image: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=900&q=80" },
  { name: "Hawaiian Islands", cruises: 400, image: "https://images.unsplash.com/photo-1542259009477-d625272157b7?auto=format&fit=crop&w=900&q=80" },
  { name: "Canary Islands", cruises: 300, image: "https://images.unsplash.com/photo-1512100606561-a5b77a3b6b41?auto=format&fit=crop&w=900&q=80" },
  { name: "Northern Europe", cruises: 250, image: "https://images.unsplash.com/photo-1539768942893-daf53e448371?auto=format&fit=crop&w=900&q=80" },
  { name: "Panama Canal",   cruises: 180, image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=80" },
  { name: "British Isles",  cruises: 120, image: "https://images.unsplash.com/photo-1520986606214-8b456906c813?auto=format&fit=crop&w=900&q=80" },
];

const [caribbean, mediterranean, alaska, hawaiian, canary, northern, panama, british] = BENTO;

export default function PopularDestinations() {
  return (
    <section className="bg-[#F4F6F9] py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          title="Popular Destinations"
          subtitle="Embark on unforgettable journeys to the world's most sought-after cruise ports"
        />

        {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 4 columns with bento layout */}
        <div className="mt-8 sm:mt-10 md:mt-12">
          {/* Mobile and Tablet view */}
          <div className="grid gap-3 sm:gap-4 md:hidden grid-cols-1 sm:grid-cols-2">
            {[caribbean, mediterranean, alaska, hawaiian, canary, northern, panama].map((dest, idx) => (
              <Card key={idx} d={dest} className="h-48 sm:h-56" />
            ))}
          </div>

          {/* Desktop Bento grid — 4 cols, Mediterranean spans 2 rows */}
          <div
            className="hidden md:grid gap-4"
            style={{
              gridTemplateColumns: "repeat(4, 1fr)",
              gridTemplateRows: "260px 260px",
            }}
          >
            <Card d={caribbean} style={{ gridColumn: 1, gridRow: 1 }} />
            <Card d={mediterranean} style={{ gridColumn: 2, gridRow: "1 / 3" }} />
            <Card d={alaska} style={{ gridColumn: 3, gridRow: 1 }} />
            <Card d={hawaiian} style={{ gridColumn: 4, gridRow: 1 }} />
            <Card d={canary} style={{ gridColumn: 1, gridRow: 2 }} />
            <Card d={northern} style={{ gridColumn: 3, gridRow: 2 }} />
            <Card d={panama} style={{ gridColumn: 4, gridRow: 2 }} />
          </div>
        </div>

        {/* British Isles — full-width accent row below */}
        <div className="mt-4 sm:mt-5 md:mt-4">
          <Card d={british} className="h-40 sm:h-48 md:h-52 w-full" />
        </div>
      </div>
    </section>
  );
}

function Card({
  d,
  style,
  className = "",
}: {
  d: Destination;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <a
      href="#"
      aria-label={`${d.name} cruises`}
      className={`group relative block overflow-hidden rounded-2xl ${className}`}
      style={style}
    >
      <img
        src={d.image}
        alt={d.name}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <p className="text-xl font-bold">{d.name}</p>
        <p className="mt-0.5 text-sm text-white/80">{d.cruises} Cruises</p>
      </div>
    </a>
  );
}
