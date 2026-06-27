import PackagePageHero from "@/components/holiday-packages/PackagePageHero";
import MarketplaceGrid from "@/components/holiday-packages/MarketplaceGrid";
import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";

export default function InternationalTourPackagesPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
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
