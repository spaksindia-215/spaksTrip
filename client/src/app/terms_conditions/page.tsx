import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";

export const metadata: Metadata = {
  title: "Terms & Conditions — SpaksTrip",
};

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="mb-6 text-3xl font-extrabold text-ink">Terms &amp; Conditions</h1>
        <p className="mb-4 text-[14px] leading-relaxed text-ink-muted">
          Last updated: May 2026
        </p>

        <Section title="1. Acceptance of Terms">
          By accessing or using SpaksTrip, you agree to be bound by these Terms &amp; Conditions and our Privacy Policy. If you do not agree, please do not use our services.
        </Section>

        <Section title="2. Services">
          SpaksTrip provides an online platform to search and book travel services including flights, hotels, holiday packages, cabs, rail, and visas. We act as an intermediary between you and the service providers.
        </Section>

        <Section title="3. Booking & Payment">
          All bookings are subject to availability and confirmation by the respective service provider. Prices are displayed inclusive of applicable taxes unless stated otherwise. Payment must be completed at the time of booking.
        </Section>

        <Section title="4. Cancellations & Refunds">
          Cancellation policies vary by service and provider. Please review the specific policy shown at the time of booking. Refunds, where applicable, are processed within 7–14 business days.
        </Section>

        <Section title="5. User Responsibilities">
          You are responsible for ensuring that the travel details you provide are accurate. SpaksTrip is not liable for losses arising from incorrect information provided by the user.
        </Section>

        <Section title="6. Limitation of Liability">
          SpaksTrip shall not be liable for any indirect, incidental, or consequential damages arising from the use of our platform or travel services booked through it.
        </Section>

        <Section title="7. Changes to Terms">
          We reserve the right to update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the revised Terms.
        </Section>

        <Section title="8. Contact">
          For any queries regarding these Terms, please contact us at support@spakstrip.com.
        </Section>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-2 text-[16px] font-bold text-ink">{title}</h2>
      <p className="text-[14px] leading-relaxed text-ink-muted">{children}</p>
    </div>
  );
}
