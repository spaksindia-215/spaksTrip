import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import CruiseDetailContent from "@/components/cruise/CruiseDetailContent";
import { generateCruises } from "@/lib/mock/cruises";

type Props = { params: Promise<{ id: string }> };

function getCruiseById(id: string) {
  // ID format: CRZ-{port}-{month}-{index}
  const parts = id.split("-");
  if (parts.length < 4 || parts[0] !== "CRZ") return null;
  const index = parseInt(parts[parts.length - 1]);
  const month = parts[parts.length - 2];
  const port = parts.slice(1, parts.length - 2).join("-");
  if (Number.isNaN(index)) return null;
  const cruises = generateCruises(port, month);
  return cruises[index] ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cruise = getCruiseById(id);
  if (!cruise) return { title: "Cruise Not Found | SpaksTrip" };
  return {
    title: `${cruise.shipName} — ${cruise.nights} Nights | SpaksTrip Cruises`,
    description: `Book ${cruise.shipName} by ${cruise.line}. ${cruise.nights}-night cruise visiting ${cruise.itinerary.join(", ")}. Starting from ₹${cruise.pricePerPerson.toLocaleString("en-IN")} per person.`,
  };
}

export default async function CruiseDetailPage({ params }: Props) {
  const { id } = await params;
  const cruise = getCruiseById(id);
  if (!cruise) notFound();

  return (
    <div className="min-h-screen bg-surface-muted text-[#0E1E3A]">
      <Header />
      <main>
        <div className="bg-brand-900 text-white px-4 py-4">
          <div className="mx-auto max-w-6xl text-[13px] text-white/70">
            <span>Cruises</span>
            <span className="mx-2">/</span>
            <span className="text-white font-medium">{cruise.shipName}</span>
          </div>
        </div>
        <CruiseDetailContent cruise={cruise} />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
