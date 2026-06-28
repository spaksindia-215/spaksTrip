import FlightSearchForm from "./FlightSearchForm";
import Image from "next/image";

export default function FlightHero() {
  return (
    <section aria-label="Flight booking" className="relative isolate">
      <div className="relative h-[480px] w-full overflow-hidden">
        <div className="relative h-full w-full">
          <Image
            src="/aeroplane.png"
            alt=""
            aria-hidden
            fill
            className="object-cover"
            loading="eager"
          />
        </div>
        <div className=" absolute inset-0 bg-gradient-to-b from-brand-950/55 via-brand-900/40 to-brand-900/60" />
        <div className="absolute inset-x-0 top-0 mx-auto max-w-7xl px-6 pt-6 text-white">
          <span className="inline-flex items-center my-3 gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[12px] font-semibold tracking-wide uppercase border border-white/20">
            Domestic & International
          </span>
          <h1 className=" text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow">
            Find your next flight
          </h1>

        </div>
      </div>

      <div className="relative z-10 -mt-84 px-6 pb-12">
        <div className="mx-auto max-w-7xl">
          <FlightSearchForm variant="hero" />
        </div>
      </div>
    </section>
  );
}
