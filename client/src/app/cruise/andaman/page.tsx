import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import AndamanCruiseHero from "@/components/cruise/AndamanCruiseHero";
import PopularRoutesSection from "@/components/cruise/PopularRoutesSection";
import CruiseOperatorsSection from "@/components/cruise/CruiseOperatorsSection";
import WhyChooseAndamanCruise from "@/components/cruise/WhyChooseAndamanCruise";
import AndamanCruiseFAQ from "@/components/cruise/AndamanCruiseFAQ";

export const metadata: Metadata = {
  title: "Cruise for Andaman | SpaksTrip",
  description: "Book Andaman ferry and cruise tickets online.",
};

export default function AndamanCruisePage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main>
        <AndamanCruiseHero />
        <PopularRoutesSection />
        <CruiseOperatorsSection />
        <WhyChooseAndamanCruise />
        <AndamanCruiseFAQ />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
