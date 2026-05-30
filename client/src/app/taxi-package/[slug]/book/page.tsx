"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import TaxiBookingPage from "@/components/taxi/TaxiBookingPage";
import Skeleton from "@/components/ui/Skeleton";

export default function TaxiBookingRoute() {
  const params = useParams<{ slug: string }>();
  return (
    <div className="min-h-screen bg-surface-muted text-ink">
      <Header />
      <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><Skeleton className="h-[520px] rounded-lg" /></main>}>
        <TaxiBookingPage slug={params.slug} />
      </Suspense>
      <Footer />
      <BackToTop />
    </div>
  );
}
