"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import ErrorState from "@/components/ui/ErrorState";
import { taxiPackagesClient } from "@/lib/taxiPackagesClient";
import { formatINR } from "@/lib/format";
import { buildPackageUrl, formatDuration } from "@/lib/taxi-packages-utils";
import type { TaxiPackageDestination, TaxiPackage } from "@/types/taxiPackages";

export default function DestinationPackagesPage() {
  const params = useParams();
  const destinationSlug = params.destinationSlug as string;

  const [destination, setDestination] = useState<TaxiPackageDestination | null>(null);
  const [packages, setPackages] = useState<TaxiPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [destinationData, packagesData] = await Promise.all([
          taxiPackagesClient.getDestination(destinationSlug),
          taxiPackagesClient.listPackagesByDestination(destinationSlug, currentPage, ITEMS_PER_PAGE),
        ]);

        setDestination(destinationData);
        setPackages(packagesData.items);
        setTotalPages(packagesData.pagination?.pages || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load packages");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [destinationSlug, currentPage]);

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />

      <main>
        {/* Destination Hero */}
        {destination && (
          <section className="relative h-64 md:h-80 overflow-hidden">
            <img
              src={destination.coverImage}
              alt={destination.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
              <h1 className="text-4xl font-bold text-white md:text-5xl">{destination.name}</h1>
              {destination.description && (
                <p className="mt-2 max-w-2xl text-gray-100">{destination.description}</p>
              )}
            </div>
          </section>
        )}

        {/* Packages Section */}
        <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600"></div>
            </div>
          )}

          {error && <ErrorState message={error} />}

          {!loading && packages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No packages available for this destination.</p>
            </div>
          )}

          {!loading && packages.length > 0 && (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold">Available Packages</h2>
                <p className="mt-2 text-gray-600">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(currentPage * ITEMS_PER_PAGE, packages.length)} packages
                </p>
              </div>

              <div className="space-y-4">
                {packages.map((pkg) => (
                  <Link
                    key={pkg.id}
                    href={buildPackageUrl(destinationSlug, pkg.metadata.slug)}
                    className="group block"
                  >
                    <div className="overflow-hidden rounded-lg border border-gray-200 transition-all hover:shadow-lg">
                      <div className="flex flex-col md:flex-row">
                        {/* Image */}
                        <div className="relative w-full overflow-hidden bg-gray-100 md:h-48 md:w-48 flex-shrink-0">
                          <img
                            src={pkg.metadata.coverImage}
                            alt={pkg.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-grow p-5 md:p-6">
                          <div className="mb-2 flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-bold group-hover:text-orange-600">
                                {pkg.title}
                              </h3>
                              <p className="mt-1 text-sm text-gray-600">
                                {pkg.metadata.pickupLocation} → {pkg.metadata.dropLocation}
                              </p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <div className="text-xs font-semibold text-gray-500 uppercase">
                                {formatDuration(pkg.metadata.durationDays, pkg.metadata.durationNights)}
                              </div>
                              <div className="mt-1 text-2xl font-bold text-orange-600">
                                {formatINR(pkg.metadata.basePrice)}
                              </div>
                            </div>
                          </div>

                          <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                            {pkg.description}
                          </p>

                          {/* Inclusions Preview */}
                          {pkg.metadata.inclusions.length > 0 && (
                            <div className="mb-4">
                              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                Includes
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {pkg.metadata.inclusions.slice(0, 3).map((inclusion, idx) => (
                                  <span
                                    key={idx}
                                    className="rounded-full bg-orange-50 px-3 py-1 text-xs text-orange-700"
                                  >
                                    ✓ {inclusion}
                                  </span>
                                ))}
                                {pkg.metadata.inclusions.length > 3 && (
                                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                                    +{pkg.metadata.inclusions.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-orange-600 font-semibold text-sm">
                            View Details <span>→</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-200 px-4 py-2 font-medium disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`rounded-lg px-3 py-2 font-medium transition ${
                          currentPage === page
                            ? "bg-orange-600 text-white"
                            : "border border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-200 px-4 py-2 font-medium disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
