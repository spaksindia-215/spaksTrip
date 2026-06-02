"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import ErrorState from "@/components/ui/ErrorState";
import { taxiPackagesClient } from "@/lib/taxiPackagesClient";
import type { TaxiPackageDestination } from "@/types/taxiPackages";
import { formatINR } from "@/lib/format";

export default function TaxiPackagesPage() {
  const [destinations, setDestinations] = useState<TaxiPackageDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await taxiPackagesClient.listDestinations();
        setDestinations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load destinations");
      } finally {
        setLoading(false);
      }
    };

    loadDestinations();
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />

      <main className="py-12 md:py-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-16 text-center md:py-24">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">Taxi Tour Packages</h1>
            <p className="text-lg text-gray-700">
              Explore India with our curated multi-day taxi tour packages. Perfect for families, groups, and solo travelers.
            </p>
          </div>
        </section>

        {/* Destinations Grid */}
        <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600"></div>
            </div>
          )}

          {error && <ErrorState message={error} />}

          {!loading && destinations.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No destinations available yet.</p>
            </div>
          )}

          {!loading && destinations.length > 0 && (
            <div>
              <h2 className="mb-8 text-2xl font-bold">Explore Destinations</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {destinations.map((destination) => (
                  <Link
                    key={destination.id}
                    href={`/taxi-packages/${destination.slug}`}
                    className="group overflow-hidden rounded-xl border border-gray-200 transition-all hover:shadow-lg"
                  >
                    <div className="relative overflow-hidden bg-gray-100">
                      <img
                        src={destination.coverImage}
                        alt={destination.name}
                        className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    </div>

                    <div className="p-5">
                      <h3 className="mb-2 text-xl font-bold group-hover:text-orange-600">
                        {destination.name}
                      </h3>
                      <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                        {destination.description}
                      </p>
                      <div className="flex items-center gap-2 text-orange-600 font-semibold text-sm">
                        Explore Packages <span>→</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Benefits Section */}
        <section className="bg-gray-50 px-4 py-12 md:py-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-12 text-center text-2xl font-bold">Why Choose Our Taxi Tours?</h2>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-lg bg-white p-6 text-center shadow-sm">
                <div className="mb-4 text-4xl">🚗</div>
                <h3 className="mb-2 font-bold">Professional Drivers</h3>
                <p className="text-sm text-gray-600">
                  Experienced and courteous drivers who know the best routes and hidden gems.
                </p>
              </div>

              <div className="rounded-lg bg-white p-6 text-center shadow-sm">
                <div className="mb-4 text-4xl">🗓️</div>
                <h3 className="mb-2 font-bold">Flexible Itineraries</h3>
                <p className="text-sm text-gray-600">
                  Customizable routes and schedules to match your preferences and budget.
                </p>
              </div>

              <div className="rounded-lg bg-white p-6 text-center shadow-sm">
                <div className="mb-4 text-4xl">✓</div>
                <h3 className="mb-2 font-bold">All-Inclusive Pricing</h3>
                <p className="text-sm text-gray-600">
                  Transparent pricing with no hidden charges. Fuel, toll, and driver allowances included.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
