import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import CorporateContent from "@/components/events/CorporateContent";

export const metadata: Metadata = {
  title: "Corporate Event Management in Delhi NCR | SpaksTrip Events",
  description: "Professional corporate event planning in Delhi, Gurgaon, and Noida. Conferences, team building, award nights, and product launches by SpaksTrip Events.",
};

export default function CorporateEventsPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main>
        <div className="bg-[#f4f6f9] border-b border-zinc-200 py-6 text-center">
          <h1 className="text-3xl font-extrabold text-[#0E1E3A]">Corporate Events</h1>
          <p className="mt-1 text-sm text-zinc-500">Home / Events / Corporate Events</p>
        </div>
        <CorporateContent />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
