"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import {
  TAXI_PACKAGE_DESTINATIONS_ROUTE,
  shouldOpenTaxiDestinations,
} from "@/lib/taxiRoles";
import { useAuthStore } from "@/state/authStore";
import { taxiPackagesClient } from "@/lib/taxiPackagesClient";
import type { TaxiPackageDestination } from "@/types/taxiPackages";

function DestinationsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-gray-200">
          <div className="h-48 animate-pulse bg-gray-200" />
          <div className="p-5 space-y-3">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TaxiPackagePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const hydrate = useAuthStore((state) => state.hydrate);

  const [destinations, setDestinations] = useState<TaxiPackageDestination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "idle") {
      void hydrate();
    }
  }, [hydrate, status]);

  useEffect(() => {
    if (user && shouldOpenTaxiDestinations(user.role)) {
      router.replace(TAXI_PACKAGE_DESTINATIONS_ROUTE);
    }
  }, [router, user]);

  useEffect(() => {
    taxiPackagesClient
      .listDestinations()
      .then((data) => setDestinations(data))
      .catch(() => setDestinations([]))
      .finally(() => setLoading(false));
  }, []);

  if (user && shouldOpenTaxiDestinations(user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-[#0E1E3A] text-white">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1464219222984-216ebffaaf85?auto=format&fit=crop&w=1800&q=75)",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
            <p className="text-sm font-semibold uppercase tracking-widest text-orange-400">
              All India Holiday Taxi Packages
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
              Explore India with Curated Taxi Tour Packages
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/80">
              Multi-day pilgrimage tours, hill station escapes, heritage circuits, and round-trip
              packages — with dedicated driver, toll included, and transparent pricing.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#destinations"
                className="inline-flex items-center rounded-lg bg-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                Browse Destinations
              </a>
              <Link
                href="/taxi-package/list-your-taxi"
                className="inline-flex items-center rounded-lg border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                List Your Taxi
              </Link>
            </div>
          </div>
        </section>

        {/* ── Why Choose ─────────────────────────────────────────── */}
        <section className="bg-orange-50 px-4 py-10">
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
            {[
              {
                icon: "🚗",
                title: "Dedicated Vehicle",
                text: "One vehicle, one driver for the entire tour. No sharing, no stops.",
              },
              {
                icon: "🗓️",
                title: "Fixed Itinerary",
                text: "Day-by-day planned routes with confirmed pickup times and sightseeing stops.",
              },
              {
                icon: "✓",
                title: "All-Inclusive Fare",
                text: "Toll, tax, parking, driver allowances, and fuel — all included in the quoted price.",
              },
            ].map(({ icon, title, text }) => (
              <div key={title} className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-3 text-3xl">{icon}</div>
                <h3 className="mb-1 font-bold text-[#0E1E3A]">{title}</h3>
                <p className="text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Destinations ────────────────────────────────────────── */}
        <section id="destinations" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="mb-2 text-2xl font-extrabold text-[#0E1E3A]">
            Popular Tour Destinations
          </h2>
          <p className="mb-8 text-gray-600">
            Pick a region and browse packages that suit your group size and budget.
          </p>

          {loading && <DestinationsSkeleton />}

          {!loading && destinations.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
              <p className="text-gray-500">
                No tour packages are available at the moment. Check back soon.
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Are you a partner?{" "}
                <Link href="/taxi-package/add-your-taxi" className="text-orange-600 underline">
                  Add your taxi package
                </Link>
              </p>
            </div>
          )}

          {!loading && destinations.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((dest) => (
                <Link
                  key={dest.id}
                  href={`/taxi-packages/${dest.slug}`}
                  className="group overflow-hidden rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-lg"
                >
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img
                      src={dest.coverImage}
                      alt={dest.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <span className="absolute bottom-3 left-4 text-lg font-bold text-white drop-shadow">
                      {dest.name}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-2 text-sm text-gray-600">
                      {dest.description || `Explore taxi tour packages for ${dest.name}.`}
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-orange-600">
                      View Packages <span aria-hidden>→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── How It Works ─────────────────────────────────────────── */}
        <section className="bg-gray-50 px-4 py-14">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-10 text-2xl font-extrabold text-[#0E1E3A]">How It Works</h2>
            <div className="grid gap-8 sm:grid-cols-4">
              {[
                { step: "1", label: "Choose Destination", text: "Browse destinations and tour categories." },
                { step: "2", label: "Select Package", text: "Compare itineraries, durations, and prices." },
                { step: "3", label: "Pick Vehicle", text: "Sedan, SUV, Tempo Traveller — choose what fits." },
                { step: "4", label: "Book & Travel", text: "Confirm details, get driver contact, enjoy the trip." },
              ].map(({ step, label, text }) => (
                <div key={step} className="flex flex-col items-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-lg font-extrabold text-white">
                    {step}
                  </div>
                  <h4 className="mb-1 font-bold text-[#0E1E3A]">{label}</h4>
                  <p className="text-sm text-gray-500">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Partner CTA ───────────────────────────────────────────── */}
        <section className="bg-[#0E1E3A] px-4 py-12 text-white">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-extrabold">Are you a taxi partner?</h2>
            <p className="mt-3 text-white/75">
              List your vehicles and start receiving taxi tour bookings through SpaksTrip. No
              duplicate registration needed — one vehicle for both taxi and package bookings.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/taxi-package/add-your-taxi"
                className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                Add Your Taxi Package
              </Link>
              <Link
                href="/taxi-package/list-your-taxi"
                className="rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                List Your Taxi Vehicle
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
