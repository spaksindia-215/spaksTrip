import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import RefundPolicyLanding from "@/components/refund/RefundPolicyLanding";
import { generatePageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generatePageMetadata(
  "Refund Policy",
  "Understand SpaksTrip's refund policy for bookings and cancellations.",
  "/refund_policy"
);

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
