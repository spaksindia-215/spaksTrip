import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import TermsConditionsLanding from "@/components/terms/TermsConditionsLanding";

export const metadata: Metadata = {
  title: "Terms & Conditions - SpaksTrip",
};

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
