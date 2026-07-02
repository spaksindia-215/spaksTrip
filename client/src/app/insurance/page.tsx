import type { Metadata } from "next";
import InsuranceBuy from "@/components/insurance/InsuranceBuy";
import InsurancePlansTable from "@/components/insurance/InsurancePlansTable";
import InsuranceCredentials from "@/components/insurance/InsuranceCredentials";
import InsuranceReviews from "@/components/insurance/InsuranceReviews";
import InsuranceFAQ from "@/components/insurance/InsuranceFAQ";
import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import { generateServiceMetadata } from "@/lib/seo/metadata";
import { ServiceSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = generateServiceMetadata("insurance");

export default function InsurancePage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <ServiceSchema
        serviceType="Travel Insurance"
        url="https://www.spakstrip.com/insurance"
        description="Protect your trips with comprehensive travel insurance."
      />
      <Header />
      <main>
        <InsuranceBuy />
        <InsurancePlansTable />
        <InsuranceCredentials />
        <InsuranceReviews />
        <InsuranceFAQ />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
