import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import CocktailContent from "@/components/events/CocktailContent";

export const metadata: Metadata = {
  title: "Cocktail Party Planner in Delhi & NCR | SpaksTrip Events",
  description: "Elegant cocktail party planning in Delhi, Gurgaon, and Noida. Rooftop setups, premium bar, live music, and full event management.",
};

export default function CocktailPartyPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main>
        <div className="bg-[#f4f6f9] border-b border-zinc-200 py-6 text-center">
          <h1 className="text-3xl font-extrabold text-[#0E1E3A]">Cocktail Party</h1>
          <p className="mt-1 text-sm text-zinc-500">Home / Events / Cocktail Party</p>
        </div>
        <CocktailContent />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
