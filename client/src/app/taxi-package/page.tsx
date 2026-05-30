"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import TaxiLandingPage from "@/components/taxi/TaxiLandingPage";
import {
  TAXI_PACKAGE_DESTINATIONS_ROUTE,
  shouldOpenTaxiDestinations,
} from "@/lib/taxiRoles";
import { useAuthStore } from "@/state/authStore";

export default function TaxiPackagePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const hydrate = useAuthStore((state) => state.hydrate);

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

  if (user && shouldOpenTaxiDestinations(user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-ink">
      <Header />
      <TaxiLandingPage />
      <Footer />
      <BackToTop />
    </div>
  );
}
