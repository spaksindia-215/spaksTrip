import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import EngagementContent from "@/components/events/EngagementContent";

export const metadata: Metadata = {
  title: "Engagement Planner in Delhi, Noida & Gurgaon | SpaksTrip Events",
  description: "Heartfelt engagement ceremony planning in Delhi NCR. Personalised ring setups, floral decor, photography, and catering by SpaksTrip Events.",
};

export default function EngagementPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main>
        <div className="bg-[#f4f6f9] border-b border-zinc-200 py-6 text-center">
          <h1 className="text-3xl font-extrabold text-[#0E1E3A]">Engagement Planner</h1>
          <p className="mt-1 text-sm text-zinc-500">Home / Events / Engagement Planner</p>
        </div>
        <EngagementContent />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
