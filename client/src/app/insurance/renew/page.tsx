import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import InsuranceRenewContent from "@/components/insurance/InsuranceRenewContent";

export const metadata: Metadata = {
  title: "Renew Insurance | SpaksTrip",
  description: "Renew your car, health, or two-wheeler insurance policy online. Quick renewal with reference ID confirmation within 24 hours.",
};

export default function InsuranceRenewPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main>
        <InsuranceRenewContent />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
