"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import { TaxiConfirmationPage } from "@/components/taxi/TaxiBookingPage";
import Skeleton from "@/components/ui/Skeleton";

export default function TaxiConfirmationRoute() {
  const params = useParams<{ slug: string }>();
  return (
    <div className="min-h-screen bg-surface-muted text-ink">
      <Header />
      <Suspense fallback={<main className="mx-auto max-w-3xl px-4 py-12 sm:px-6"><Skeleton className="h-80 rounded-lg" /></main>}>
        <ConfirmationInner slug={params.slug} />
      </Suspense>
      <Footer />
      <BackToTop />
    </div>
  );
}

function ConfirmationInner({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  return <TaxiConfirmationPage slug={slug} name={searchParams.get("name") || "Guest"} />;
}
