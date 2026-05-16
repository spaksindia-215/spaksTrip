import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import TaxiListingForm from "@/components/transport/list-your-taxi/TaxiListingForm";

export default function ListYourTaxiPage() {
  return (
    <div className="min-h-screen bg-surface-muted text-ink">
      <Header />

      <main>
        <section className="bg-brand-900 text-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-200">
                Taxi Partner Onboarding
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
                List Your Taxi and start receiving bookings through SpaksTrip
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/78 sm:text-base">
                Add your vehicle details, availability, pricing, and documents in one place. This
                route is fully additive and stays separate from the current Taxi Package search and
                booking experience.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto -mt-8 max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
          <TaxiListingForm />
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
