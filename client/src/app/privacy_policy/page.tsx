import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import PrivacyPolicyLanding from "@/components/privacy/PrivacyPolicyLanding";
import { generatePageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generatePageMetadata(
  "Privacy Policy",
  "Learn how SpaksTrip collects, uses, and protects your personal information.",
  "/privacy_policy"
);

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <PrivacyPolicyLanding />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
