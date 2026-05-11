import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import HelpLanding from "@/components/help/HelpLanding";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HelpLanding />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
