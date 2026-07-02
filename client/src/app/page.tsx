import type { Metadata } from "next";
import AboutUs from "@/components/landing/AboutUs";
import BackToTop from "@/components/landing/BackToTop";
import Destinations from "@/components/landing/Destinations";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import HeroCarousel from "@/components/landing/HeroCarousel";
import RecentSearches from "@/components/landing/RecentSearches";
import Testimonials from "@/components/landing/Testimonials";
import TopHotelDeals from "@/components/landing/TopHotelDeals";
import WhyChooseUs from "@/components/landing/WhyChooseUs";
import { HomepageSchema } from "@/lib/seo/schemas";
import { generateBaseMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generateBaseMetadata();

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <HomepageSchema />
      <Header />
      <main>
        <HeroCarousel />
        <RecentSearches />
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
