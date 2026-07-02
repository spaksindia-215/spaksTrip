import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import TermsConditionsLanding from "@/components/terms/TermsConditionsLanding";
import { generatePageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generatePageMetadata(
  "Terms & Conditions",
  "Read SpaksTrip's terms and conditions for using our travel booking services.",
  "/terms_conditions"
);

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <Header />
      <main>
        <TermsConditionsLanding />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
