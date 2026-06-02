import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import TaxiPartnerRegistration from "@/components/partner/TaxiPartnerRegistration";

export default function PartnerTaxisRegisterPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main>
        <TaxiPartnerRegistration />
      </main>
      <Footer />
    </div>
  );
}
