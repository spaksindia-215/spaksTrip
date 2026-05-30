"use client";

import { Suspense } from "react";
import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import TaxiResultsPage from "@/components/taxi/TaxiResultsPage";
import TaxiResultsSkeleton from "@/components/taxi/TaxiResultsSkeleton";

export default function TaxiPackageResultsRoute() {
  return (
    <div className="min-h-screen bg-surface-muted text-ink">
      <Header />
      <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><TaxiResultsSkeleton /></main>}>
        <TaxiResultsPage />
      </Suspense>
      <Footer />
      <BackToTop />
    </div>
  );
}
