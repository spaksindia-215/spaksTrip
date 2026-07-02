import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import TrainSearchLanding from "@/components/rail/TrainSearchLanding";
import { generatePageMetadata } from "@/lib/seo/metadata";
import { ServiceSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = generatePageMetadata(
  "Train Booking",
  "Book train tickets for domestic travel across India.",
  "/train/search"
);

export default function TrainSearchPage() {
  return (
    <div className="min-h-screen bg-white">
      <ServiceSchema
        serviceType="Train Booking"
        url="https://www.spakstrip.com/train/search"
        description="Book train tickets for domestic travel across India."
      />
      <Header />
      <main>
        <TrainSearchLanding />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
