import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import DestinationWeddingContent from "@/components/events/DestinationWeddingContent";

export const metadata: Metadata = {
  title: "Destination Wedding Planner | Goa, Rajasthan & Beyond | SpaksTrip Events",
  description: "Plan your dream destination wedding in Goa, Rajasthan, Kerala, or international venues. End-to-end coordination by SpaksTrip Events.",
};

export default function DestinationWeddingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main>
        <div className="bg-[#f4f6f9] border-b border-zinc-200 py-6 text-center">
          <h1 className="text-3xl font-extrabold text-[#0E1E3A]">Destination Wedding</h1>
          <p className="mt-1 text-sm text-zinc-500">Home / Events / Destination Wedding</p>
        </div>
        <DestinationWeddingContent />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
