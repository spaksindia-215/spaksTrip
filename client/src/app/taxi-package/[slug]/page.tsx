import type { Metadata } from "next";
import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import TaxiDetailPage from "@/components/taxi/TaxiDetailPage";
import { findTaxiPackage } from "@/lib/taxiPackage";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pkg = findTaxiPackage(slug);
  return {
    title: pkg ? `${pkg.title} | SpaksTrip Taxi` : "Taxi Package | SpaksTrip",
    description: pkg ? `${pkg.cabName} with ${pkg.includedKm} km included from ${pkg.pickupCity} to ${pkg.destination}.` : "Taxi package details on SpaksTrip.",
    openGraph: {
      title: pkg ? `${pkg.title} | SpaksTrip Taxi` : "Taxi Package | SpaksTrip",
      description: pkg ? `${pkg.cabName} taxi package with transparent fare and verified driver.` : "Taxi package details on SpaksTrip.",
      images: pkg ? [{ url: pkg.image }] : undefined,
    },
  };
}

export default async function TaxiPackageDetailRoute({ params }: Props) {
  const { slug } = await params;
  return (
    <div className="min-h-screen bg-white text-ink">
      <Header />
      <TaxiDetailPage slug={slug} />
      <Footer />
      <BackToTop />
    </div>
  );
}
