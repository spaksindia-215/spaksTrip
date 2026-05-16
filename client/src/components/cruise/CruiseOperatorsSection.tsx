import SectionHeading from "@/components/landing/SectionHeading";

type Operator = {
  name: string;
  tagline: string;
  tone: string;
  description: string;
};

const OPERATORS: Operator[] = [
  {
    name: "Makruzz",
    tagline: "High-speed catamaran",
    tone: "from-cyan-500 to-blue-600",
    description: "Preferred for fast sailings, premium cabins and dependable Port Blair to Havelock connectivity.",
  },
  {
    name: "Green Ocean",
    tagline: "Budget-friendly ferry",
    tone: "from-emerald-500 to-teal-600",
    description: "A popular choice for value-driven travellers looking for practical island transfers and open-deck journeys.",
  },
  {
    name: "Nautika",
    tagline: "Modern vessel fleet",
    tone: "from-indigo-500 to-sky-600",
    description: "Known for comfortable seating layouts and smooth inter-island departures across major Andaman routes.",
  },
  {
    name: "ITT Majestic",
    tagline: "Premium operator",
    tone: "from-amber-500 to-orange-500",
    description: "Well-suited for travellers seeking dependable schedules, clean cabins and a polished onboard experience.",
  },
];

export default function CruiseOperatorsSection() {
  return (
    <section className="bg-white py-18 sm:py-22">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Featured Cruise Operators"
          subtitle="Travel with trusted Andaman ferry brands offering fast transfers, comfortable cabins and timely sailings."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {OPERATORS.map((operator) => (
            <article
              key={operator.name}
              className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-(--shadow-sm) transition-transform duration-200 hover:-translate-y-1 hover:shadow-(--shadow-lg)"
            >
              <div className={`inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-semibold text-white ${operator.tone}`}>
                {operator.tagline}
              </div>
              <h3 className="mt-5 text-xl font-extrabold text-[#0E1E3A]">{operator.name}</h3>
              <p className="mt-3 text-[13px] leading-6 text-ink-muted">{operator.description}</p>
              <div className="mt-5 flex items-center gap-1.5 text-[12px] font-semibold text-brand-700">
                <span className="text-amber-500">★</span>
                <span>Trusted operator network</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
