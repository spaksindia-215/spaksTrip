"use client";

import { motion } from "framer-motion";
import AndamanCruiseSearchForm from "./AndamanCruiseSearchForm";

const HIGHLIGHTS = ["Port Blair", "Havelock Island", "Neil Island", "Fast Ferry Bookings"];

export default function AndamanCruiseHero() {
  return (
    <section className="relative overflow-hidden bg-[#071426]">
      <img
        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=80"
        alt="Andaman blue waters with boats and island coastline"
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,246,0.22),transparent_32%),linear-gradient(115deg,rgba(4,14,29,0.92),rgba(4,14,29,0.62)_52%,rgba(4,14,29,0.2))]" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
              Andaman Ferry Booking
            </div>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Book Cruises for Andaman
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/78 sm:text-lg">
              Search premium ferry and cruise sailings between Port Blair, Havelock and Neil Island with instant confirmations and trusted operators.
            </p>

            <div className="mt-7 flex flex-wrap gap-2.5">
              {HIGHLIGHTS.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/90 backdrop-blur-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="lg:translate-y-8"
          >
            <AndamanCruiseSearchForm />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
