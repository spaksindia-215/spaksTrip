import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import WeddingContent from "@/components/events/WeddingContent";

export const metadata: Metadata = {
  title: "Wedding Planner in Delhi NCR | SpaksTrip Events",
  description: "Premier wedding management services in Delhi, Gurgaon, and Noida. Venue, decor, catering, and full coordination by SpaksTrip Events.",
};

export default function WeddingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main>
        <div className="bg-[#f4f6f9] border-b border-zinc-200 py-6 text-center">
          <h1 className="text-3xl font-extrabold text-[#0E1E3A]">Wedding Planner</h1>
          <p className="mt-1 text-sm text-zinc-500">Home / Events / Wedding Planner</p>
        </div>
        <WeddingContent />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
