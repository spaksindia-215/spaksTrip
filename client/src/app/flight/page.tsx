import type { Metadata } from "next";
import FlightHero from "@/components/flight/FlightHero";
import AboutUs from "@/components/landing/AboutUs";
import BackToTop from "@/components/landing/BackToTop";
import Destinations from "@/components/landing/Destinations";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import Testimonials from "@/components/landing/Testimonials";
import TopHotelDeals from "@/components/landing/TopHotelDeals";
import WhyChooseUs from "@/components/landing/WhyChooseUs";
import { generateServiceMetadata } from "@/lib/seo/metadata";
import { ServiceSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = generateServiceMetadata("flight");

export default function FlightPage() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <ServiceSchema
        serviceType="Flight Booking"
        url="https://www.spakstrip.com/flight"
        description="Search and book flights across India and international destinations with best prices."
      />
      <Header />
      <main>
        <FlightHero />
        <Destinations />
        <WhyChooseUs />
        <TopHotelDeals />
        <AboutUs />
        <Testimonials />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
