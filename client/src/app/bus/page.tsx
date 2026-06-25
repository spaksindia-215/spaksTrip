"use client";

import { useState } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import BusSearchForm from "@/components/bus/BusSearchForm";
import { toIsoDate } from "@/lib/format";
import { openRedbusSearch } from "@/lib/redbus";

const today = toIsoDate(new Date());

const INFO = [
  {
    title: "Every operator, one search",
    sub: "Pick your route and date, then jump straight into RedBus's full list of operators.",
  },
  {
    title: "Secure on RedBus",
    sub: "Seat selection, boarding points and payment all happen on RedBus's official platform.",
  },
  {
    title: "Tickets & cancellations on RedBus",
    sub: "Manage bookings, M-tickets and cancellations directly in your RedBus account.",
  },
];

export default function BusPage() {
  const [source, setSource] = useState("Delhi");
  const [destination, setDestination] = useState("Jaipur");
  const [travelDate, setTravelDate] = useState(today);
  const [error, setError] = useState<string | null>(null);

  // Bus booking is a hand-off to RedBus — we collect the journey and deep-link into
  // RedBus's search results (route + date pre-filled). See src/lib/redbus.ts.
  const goToRedbus = () => {
    if (source === destination) {
      setError("Source and destination must be different.");
      return;
    }
    setError(null);
    openRedbusSearch({ source, destination, date: travelDate });
  };

  return (
    <div className="min-h-screen bg-surface-muted">
      <Header />
      <main>
        <section className="relative overflow-hidden bg-ink lg:min-h-[calc(100svh-7rem)]">
          <img
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1800&q=80"
            alt="Intercity bus on a highway at dusk"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/65 to-ink/35" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface-muted to-transparent" />

          <div className="relative mx-auto flex min-h-[inherit] max-w-6xl flex-col justify-center px-4 py-12 sm:px-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-full bg-white/12 px-3 py-1 text-[12px] font-semibold text-white/85 ring-1 ring-white/20">
                Bus tickets · powered by RedBus
              </span>
              <h1 className="mt-4 max-w-xl text-[34px] font-extrabold leading-[1.1] text-white sm:text-[42px]">
                Book intercity bus tickets online
              </h1>
              <p className="mt-3 max-w-md text-[15px] leading-6 text-white/80">
                Pick your route and travel date, then complete your booking securely on RedBus.
              </p>
            </div>

            <div className="mt-8">
              <BusSearchForm
                source={source}
                destination={destination}
                travelDate={travelDate}
                error={error ?? undefined}
                onChange={(field, value) => {
                  if (field === "source") setSource(value);
                  if (field === "destination") setDestination(value);
                  if (field === "travelDate") setTravelDate(value);
                }}
                onSwap={() => {
                  setSource(destination);
                  setDestination(source);
                }}
                onSubmit={goToRedbus}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {INFO.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border-soft bg-white p-5 shadow-(--shadow-xs)">
                <p className="text-[15px] font-extrabold text-ink">{item.title}</p>
                <p className="mt-1.5 text-[13px] leading-6 text-ink-muted">{item.sub}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
