import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import RefundPolicyLanding from "@/components/refund/RefundPolicyLanding";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <RefundPolicyLanding />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
