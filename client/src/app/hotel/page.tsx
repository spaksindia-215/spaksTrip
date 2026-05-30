import HotelHero from "@/components/accommodation/HotelHero";
import TopHotelChoices from "@/components/accommodation/TopHotelChoices";
import HotelPartnerCTA from "@/components/accommodation/HotelPartnerCTA";
import WhyChooseUsOYO from "@/components/shared/WhyChooseUsOYO";
import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";

export default function HotelPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
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
