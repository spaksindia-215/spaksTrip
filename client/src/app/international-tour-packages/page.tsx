import type { Metadata } from "next";
import PackagePageHero from "@/components/holiday-packages/PackagePageHero";
import MarketplaceGrid from "@/components/holiday-packages/MarketplaceGrid";
import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import { generateServiceMetadata } from "@/lib/seo/metadata";
import { ServiceSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = generateServiceMetadata("internationalTour");

export default function InternationalTourPackagesPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <ServiceSchema
        serviceType="International Tour Packages"
        url="https://www.spakstrip.com/international-tour-packages"
        description="Explore world-class international tour packages with expert guides."
      />
      <Header />
      <main>
        <PackagePageHero title="International Tour Packages" image="/forest.jpg" />
        <section className="mx-auto max-w-7xl px-6 py-16">
          <MarketplaceGrid kind="holiday" scope="international" emptyHint="International holiday packages will appear here once operators list them." />
        </section>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
