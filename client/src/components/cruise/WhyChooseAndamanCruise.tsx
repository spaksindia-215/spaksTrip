import SectionHeading from "@/components/landing/SectionHeading";

const BENEFITS = [
  {
    title: "Best Prices",
    description: "Competitive fares across leading Andaman operators with transparent final pricing.",
  },
  {
    title: "Instant Confirmation",
    description: "Move quickly from search to booking with fast, reliable confirmation support.",
  },
  {
    title: "Trusted Operators",
    description: "Sail with well-known ferry brands that travellers already prefer on island routes.",
  },
  {
    title: "24×7 Support",
    description: "Our team is available to help with route guidance, schedule questions and booking assistance.",
  },
];

export default function WhyChooseAndamanCruise() {
  return (
    <section className="relative overflow-hidden bg-[#f3f8ff] py-18 sm:py-22">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.14),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Why Book With Us"
          subtitle="Everything you need for a smoother Andaman island transfer experience, from search to confirmation."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {BENEFITS.map((benefit, index) => (
            <article
              key={benefit.title}
              className="rounded-[28px] border border-white/60 bg-white/90 p-5 shadow-(--shadow-sm) backdrop-blur-sm"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-cyan-500 text-[15px] font-extrabold text-white">
                0{index + 1}
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-[#0E1E3A]">{benefit.title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-ink-muted">{benefit.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
