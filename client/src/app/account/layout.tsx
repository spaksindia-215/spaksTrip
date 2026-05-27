import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";
import AccountSidebar from "@/components/account/AccountSidebar";

export const metadata: Metadata = {
  title: { default: "My Account | SpaksTrip", template: "%s | SpaksTrip" },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#0E1E3A]">
      <Header />
      <main className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <AccountSidebar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
