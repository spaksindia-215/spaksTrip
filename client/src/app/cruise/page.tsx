import type { Metadata } from "next";
import CruiseHero from "@/components/cruise/CruiseHero";
import PopularDestinations from "@/components/cruise/PopularDestinations";
import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import { generateServiceMetadata } from "@/lib/seo/metadata";
import { ServiceSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = generateServiceMetadata("cruise");

export default function CruisePage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <ServiceSchema
        serviceType="Cruise Booking"
        url="https://www.spakstrip.com/cruise"
        description="Explore luxury cruise vacations and island getaways."
      />
      <Header />
      <main>
        <CruiseHero />
        <PopularDestinations />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
