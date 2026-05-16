import Accordion from "@/components/ui/Accordion";
import SectionHeading from "@/components/landing/SectionHeading";

const FAQ_ITEMS = [
  {
    value: "booking-window",
    title: "How early should I book my Andaman cruise tickets?",
    content:
      "It is best to book a few days in advance during normal periods and even earlier during peak holiday months, long weekends and festive travel windows.",
  },
  {
    value: "id-proof",
    title: "Do I need ID proof for boarding?",
    content:
      "Yes. Travellers typically need a valid government-issued ID matching the booking details for verification at the jetty or operator counter.",
  },
  {
    value: "operator-difference",
    title: "Are all ferry operators the same?",
    content:
      "Operators differ in sailing speed, seat categories, cabin comfort and schedule timings. The right option depends on budget, route and preferred travel experience.",
  },
  {
    value: "round-trip",
    title: "Can I search for round-trip ferry travel?",
    content:
      "Yes. You can choose round trip in the form and include your return sailing date to plan both directions together.",
  },
  {
    value: "baggage",
    title: "Is baggage allowed on Andaman cruise routes?",
    content:
      "Most operators allow baggage, but limits can vary by ferry brand and ticket class. Final baggage details should always be confirmed at booking time.",
  },
];

export default function AndamanCruiseFAQ() {
  return (
    <section className="bg-white py-18 sm:py-22">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionHeading
          title="Frequently Asked Questions"
          subtitle="Helpful answers for planning ferry and cruise travel across the Andaman islands."
        />

        <div className="mt-10 rounded-[28px] border border-slate-200 bg-slate-50/70 px-5 py-3 shadow-(--shadow-xs) sm:px-7">
          <Accordion
            items={FAQ_ITEMS.map((item) => ({
              value: item.value,
              title: <span className="pr-4 text-[15px] font-semibold text-ink">{item.title}</span>,
              content: <p className="max-w-3xl leading-7">{item.content}</p>,
            }))}
            defaultOpen={["booking-window"]}
          />
        </div>
      </div>
    </section>
  );
}
