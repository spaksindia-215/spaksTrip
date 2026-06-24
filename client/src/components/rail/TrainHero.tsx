import TrainSearchForm from "./TrainSearchForm";

export default function TrainHero() {
  return (
    <section className="relative overflow-hidden bg-ink lg:min-h-[calc(100svh-7rem)]">
      <img
        src="https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1600&q=80"
        alt="Indian Railways"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/85 via-ink/65 to-ink/85" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />

      <div className="relative mx-auto flex min-h-[inherit] max-w-5xl flex-col justify-center px-4 py-12 sm:px-6">
        <div className="text-center">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold text-white/90 ring-1 ring-white/20 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor" aria-hidden>
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
              <path d="M12 6a1 1 0 0 0-1 1v5a1 1 0 0 0 .29.71l3 3a1 1 0 1 0 1.41-1.41L13 11.59V7a1 1 0 0 0-1-1z" />
            </svg>
            Indian Railways · IRCTC
          </span>
          <h1 className="mx-auto max-w-xl text-[34px] font-extrabold leading-[1.1] text-white sm:text-[40px]">
            Book Train Tickets Online
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-6 text-white/80">
            Pick your route and travel date, then complete your booking securely on IRCTC.
          </p>
        </div>

        <div className="mx-auto mt-8 w-full">
          <TrainSearchForm />
        </div>
      </div>
    </section>
  );
}
