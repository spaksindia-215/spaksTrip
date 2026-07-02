import type { Metadata } from "next";
import CabSearchForm from "@/components/transport/CabSearchForm";
import TaxiPartnerCTA from "@/components/transport/TaxiPartnerCTA";
import WhyChooseUsOYO from "@/components/shared/WhyChooseUsOYO";
import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import { generateServiceMetadata } from "@/lib/seo/metadata";
import { ServiceSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = generateServiceMetadata("cabs");

export default function CabsPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <ServiceSchema
        serviceType="Taxi Booking"
        url="https://www.spakstrip.com/cabs"
        description="Book cabs for local rides and point-to-point transfers."
      />
      <Header />
      <main>
        <CabSearchForm />
        <TaxiPartnerCTA />
        <WhyChooseUsOYO />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
// Add IRCTC	Make your Flight booking flow handle edge cases: infant booking, wheelchair SSR, multi-pax with different surnames
// Add Transfer	Make your Hotel detail page show real reviews, photo gallery zoom, map integration
// Add Self-Drive	Make your Payment page handle failure states, retry logic, timeout handling
// Add Sightseeing	Make your My Trips handle cancellations, modifications, download e-ticke