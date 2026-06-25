import Link from "next/link";
import EventsBrowser from "@/components/events/EventsBrowser";
import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";

// Bookable events listing — discover and book concerts, comedy, workshops, food
// festivals and more, plus curated picks from partner platforms. Private event
// planning (weddings/corporate/etc.) now lives at /events/services.
export default function EventsPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main>
        {/* Hero band */}
        <section className="bg-[#0E1E3A] text-white">
          <div className="mx-auto max-w-6xl px-6 py-16 text-center">
            <h1 className="text-3xl font-bold sm:text-4xl">Discover Events Near You</h1>
            <p className="mx-auto mt-3 max-w-2xl text-white/80">
              Concerts, comedy, workshops, food festivals and more — find your next experience and book in seconds.
            </p>
            <div className="mt-6">
              <Link
                href="/events/services"
                className="inline-block rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-[#0E1E3A]"
              >
                Planning a wedding or private event? →
              </Link>
            </div>
          </div>
        </section>

        <EventsBrowser />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
