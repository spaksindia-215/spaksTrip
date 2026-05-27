import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import BirthdayContent from "@/components/events/BirthdayContent";

export const metadata: Metadata = {
  title: "Birthday Party Planner in Delhi & Gurgaon | SpaksTrip Events",
  description: "Best birthday party organisers in Delhi NCR for kids, teenagers, and adults. Themed setups, entertainment, and full event management.",
};

export default function BirthdayPartyPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main>
        <div className="bg-[#f4f6f9] border-b border-zinc-200 py-6 text-center">
          <h1 className="text-3xl font-extrabold text-[#0E1E3A]">Birthday Party Planner</h1>
          <p className="mt-1 text-sm text-zinc-500">Home / Events / Birthday Party Planner</p>
        </div>
        <BirthdayContent />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
