import TrainHero from "./TrainHero";

const INFO = [
  {
    title: "Every train, one search",
    sub: "Pick any route across the Indian Railways network and head straight to booking.",
  },
  {
    title: "Secure on IRCTC",
    sub: "Payment and ticketing happen on IRCTC's official platform — we just get you there fast.",
  },
  {
    title: "PNR & status on IRCTC",
    sub: "Check PNR status, live running and cancellations directly in your IRCTC account.",
  },
];

export default function TrainSearchLanding() {
  return (
    <>
      <TrainHero />

      <section className="bg-surface-muted px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {INFO.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border-soft bg-white p-5 shadow-(--shadow-xs)"
              >
                <p className="text-[15px] font-extrabold text-ink">{item.title}</p>
                <p className="mt-1.5 text-[13px] leading-6 text-ink-muted">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
