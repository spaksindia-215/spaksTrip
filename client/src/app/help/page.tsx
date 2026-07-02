import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import HelpLanding from "@/components/help/HelpLanding";
import { generatePageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generatePageMetadata(
  "Help & Support",
  "Get help with your bookings, account, and travel queries. Contact support.",
  "/help"
);

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HelpLanding />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
