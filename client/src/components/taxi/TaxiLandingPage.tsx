"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { popularTaxiRoutes, taxiPackages } from "@/data/taxi/packages";
import { categoryLabel, formatCurrency } from "@/lib/taxiPackage";
import TaxiSearchForm from "./TaxiSearchForm";
import { CarIcon, CheckIcon, ShieldIcon, StarIcon, UsersIcon } from "./TaxiIcons";

const heroImage = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=82";

const whyItems = [
  { title: "Verified drivers", text: "Background-checked driver partners with trip ratings and live support.", icon: ShieldIcon },
  { title: "Transparent fares", text: "Included kilometres, extra charges and driver allowance shown before booking.", icon: CheckIcon },
  { title: "Cab choices", text: "Hatchbacks, sedans, SUVs, premium cars and travellers for every trip size.", icon: CarIcon },
  { title: "Travel desk", text: "Human support for pickup coordination, route changes and trip emergencies.", icon: UsersIcon },
];

const destinations = [
  { city: "Agra", routes: "Taj Mahal day trips", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=700&q=80" },
  { city: "Mysore", routes: "Palace and family rides", image: "https://images.unsplash.com/photo-1591726093769-3cd9df2e7ad1?auto=format&fit=crop&w=700&q=80" },
  { city: "Jaipur", routes: "Heritage local cabs", image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=700&q=80" },
  { city: "Goa", routes: "Airport and hotel transfers", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80" },
];

const faqs = [
  ["Are tolls included?", "Package cards show toll estimates separately. Final tolls and parking are payable as applicable unless listed in inclusions."],
  ["Can I choose the exact car model?", "You book a cab category. The assigned model may vary, but seating, AC and luggage capacity remain equivalent."],
  ["Is airport pickup tracked by flight?", "Airport transfer packages include pickup instructions and flight-aware coordination in the booking flow."],
  ["Can I cancel my booking?", "Most packages allow free cancellation until 24 hours before pickup. The detail page shows the full policy."],
];

export default function TaxiLandingPage() {
  return (
    <main className="bg-white">
      <section className="relative min-h-[680px] overflow-hidden bg-ink">
        <img src={heroImage} alt="Premium road trip taxi in mountains" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/88 via-ink/58 to-ink/20" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-14 pt-24 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:pt-32">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="flex flex-col justify-center text-white">
            <Badge tone="accent" className="mb-4 w-fit bg-white/14 text-white ring-1 ring-white/25">
              SpaksTrip Taxi Packages
            </Badge>
            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Private cabs for city rides, airport transfers and outstation escapes
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/82">
              Search curated cab packages with fixed inclusions, verified drivers, clear fare rules and support that stays with you until drop-off.
            </p>
            <div className="mt-7 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["500+", "routes"],
                ["4.7/5", "avg rating"],
                ["24x7", "support"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-md border border-white/18 bg-white/10 p-3 backdrop-blur">
                  <div className="text-2xl font-extrabold">{value}</div>
                  <div className="text-[12px] font-medium text-white/72">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/taxi-package/list-your-taxi">
                <Button type="button" variant="secondary" className="bg-white text-ink hover:bg-white/90">
                  Add Your Taxi
                </Button>
              </Link>
              <Link href="/partner/my-taxis">
                <Button type="button" variant="outline" className="border-white/35 bg-white/10 text-white hover:bg-white/15">
                  Manage My Taxis
                </Button>
              </Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }} className="self-end lg:pt-28">
            <TaxiSearchForm />
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wide text-brand-600">Popular taxi packages</p>
            <h2 className="mt-1 text-2xl font-extrabold text-ink">Fixed fare rides travellers book often</h2>
          </div>
          <Link href="/taxi-package/results" className="text-[13px] font-bold text-brand-700 hover:text-brand-800">
            View all packages
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {popularTaxiRoutes.map((pkg) => (
            <Link key={pkg.slug} href={`/taxi-package/${pkg.slug}`} className="group overflow-hidden rounded-lg border border-border-soft bg-white shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
              <div className="relative h-44 overflow-hidden">
                <img src={pkg.image} alt={pkg.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute left-3 top-3 flex gap-2">
                  {pkg.recommended ? <Badge tone="accent">Recommended</Badge> : null}
                  {pkg.popular ? <Badge tone="brand">Popular</Badge> : null}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-[16px] font-extrabold text-ink">{pkg.title}</h3>
                <p className="mt-1 text-[13px] text-ink-muted">{pkg.cabName} · {categoryLabel(pkg.category)} · {pkg.includedKm} km included</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-muted">
                    <StarIcon className="h-4 w-4 text-accent-500" /> {pkg.rating} ({pkg.reviewCount})
                  </span>
                  <span className="text-xl font-extrabold text-ink">{formatCurrency(pkg.price)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-surface-muted py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {whyItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-lg border border-border-soft bg-white p-5 shadow-[var(--shadow-xs)]">
                  <span className="grid h-11 w-11 place-items-center rounded-md bg-brand-50 text-brand-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-extrabold text-ink">{item.title}</h3>
                  <p className="mt-2 text-[13px] leading-6 text-ink-muted">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 rounded-lg border border-brand-100 bg-brand-50 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wide text-brand-700">For taxi operators</p>
            <h2 className="mt-2 text-2xl font-extrabold text-ink">Add your taxi fleet to SpaksTrip</h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-ink-muted">
              Submit vehicle details, operating routes, pricing, amenities, availability and photos. Your listings stay separate from customer search until reviewed.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/taxi-package/list-your-taxi">
              <Button type="button" variant="primary" size="lg">
                Add Your Taxi
              </Button>
            </Link>
            <Link href="/partner/my-taxis">
              <Button type="button" variant="outline" size="lg">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wide text-brand-600">Top destinations</p>
            <h2 className="mt-1 text-2xl font-extrabold text-ink">Cab-ready routes across India</h2>
            <p className="mt-3 text-[14px] leading-6 text-ink-muted">
              Browse local city packages, hill station runs, weekend outstation rides and airport transfers with fare clarity before booking.
            </p>
            <Button className="mt-5" variant="secondary" onClick={() => window.location.assign("/taxi-package/results")}>
              Explore Cabs
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {destinations.map((destination) => (
              <div key={destination.city} className="relative min-h-44 overflow-hidden rounded-lg">
                <img src={destination.image} alt={destination.city} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/78 to-transparent" />
                <div className="absolute bottom-0 p-4 text-white">
                  <h3 className="text-xl font-extrabold">{destination.city}</h3>
                  <p className="text-[13px] text-white/80">{destination.routes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border-soft bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6">
            <p className="text-[12px] font-bold uppercase tracking-wide text-brand-600">Available cab types</p>
            <h2 className="mt-1 text-2xl font-extrabold text-ink">Choose comfort by passenger count</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {["Hatchback", "Sedan", "SUV", "Premium", "Traveller"].map((type, index) => (
              <div key={type} className="rounded-lg border border-border-soft bg-surface-muted p-4">
                <CarIcon className="h-6 w-6 text-brand-700" />
                <h3 className="mt-4 font-extrabold text-ink">{type}</h3>
                <p className="mt-1 text-[12px] leading-5 text-ink-muted">
                  {index < 2 ? "Best for 2-4 passengers" : index === 2 ? "Best for families" : index === 3 ? "Executive comfort" : "Groups and luggage"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wide text-brand-600">Customer testimonials</p>
          <h2 className="mt-1 text-2xl font-extrabold text-ink">Travelers notice the details</h2>
          <div className="mt-5 grid gap-3">
            {taxiPackages.slice(0, 3).map((pkg) => (
              <div key={pkg.slug} className="rounded-lg border border-border-soft p-4">
                <div className="mb-2 flex items-center gap-1 text-accent-500">
                  {Array.from({ length: 5 }, (_, index) => <StarIcon key={index} className="h-4 w-4" />)}
                </div>
                <p className="text-[14px] leading-6 text-ink">&ldquo;{pkg.reviews[0]?.text}&rdquo;</p>
                <p className="mt-2 text-[12px] font-semibold text-ink-muted">{pkg.reviews[0]?.name} · {pkg.reviews[0]?.route}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wide text-brand-600">FAQ</p>
          <h2 className="mt-1 text-2xl font-extrabold text-ink">Before you book</h2>
          <div className="mt-5 divide-y divide-border-soft rounded-lg border border-border-soft">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group p-4">
                <summary className="cursor-pointer list-none text-[14px] font-bold text-ink">{question}</summary>
                <p className="mt-2 text-[13px] leading-6 text-ink-muted">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
