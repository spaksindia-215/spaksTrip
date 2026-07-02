import type { Metadata } from "next";
import PackagePageHero from "@/components/holiday-packages/PackagePageHero";
import MarketplaceGrid from "@/components/holiday-packages/MarketplaceGrid";
import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import { generateServiceMetadata } from "@/lib/seo/metadata";
import { ServiceSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = generateServiceMetadata("nationalTour");

export default function NationalTourPackagesPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <ServiceSchema
        serviceType="Domestic Tour Packages"
        url="https://www.spakstrip.com/national-tour-packages"
        description="Discover amazing domestic tour packages across India's best destinations."
      />
      <Header />
      <main>
        <PackagePageHero title="National Tour Packages" image="/forest.jpg" />
        <section className="mx-auto max-w-7xl px-6 py-16">
          <MarketplaceGrid kind="holiday" scope="domestic" emptyHint="National holiday packages will appear here once operators list them." />
        </section>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
