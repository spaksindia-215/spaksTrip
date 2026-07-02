import type { Metadata } from "next";
import HotelHero from "@/components/accommodation/HotelHero";
import TopHotelChoices from "@/components/accommodation/TopHotelChoices";
import HotelPartnerCTA from "@/components/accommodation/HotelPartnerCTA";
import WhyChooseUsOYO from "@/components/shared/WhyChooseUsOYO";
import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import { generateServiceMetadata } from "@/lib/seo/metadata";
import { ServiceSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = generateServiceMetadata("hotel");

export default function HotelPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <ServiceSchema
        serviceType="Hotel Booking"
        url="https://www.spakstrip.com/hotel"
        description="Find and book hotels, resorts, and accommodations online."
      />
      <Header />
      <main>
        <HotelHero />
        <TopHotelChoices />
        <HotelPartnerCTA />
        <WhyChooseUsOYO />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
