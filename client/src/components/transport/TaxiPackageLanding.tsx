import OutstationSearch from "./OutstationSearch";

export default function TaxiPackageLanding() {
  return (
    <section aria-label="Taxi package booking" className="relative isolate">
      <div className="relative h-105 w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=2000&q=80"
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b from-brand-950/55 via-brand-900/40 to-brand-900/60" />
        <div className="absolute inset-x-0 top-0 mx-auto max-w-7xl px-6 pt-16 text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[12px] font-semibold tracking-wide uppercase border border-white/20">
            Reliable & Affordable
          </span>
          <h1 className="mt-3 text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow">
            Book Your Taxi Package
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] md:text-[17px] font-medium text-white/90">
            Travel in comfort with professional drivers. Best rates for local & outstation rides.
          </p>
        </div>
      </div>

      <div className="relative z-10 -mt-28 px-6 pb-12">
        <div className="mx-auto max-w-7xl">
          <OutstationSearch />
        </div>
      </div>
    </section>
  );
}
