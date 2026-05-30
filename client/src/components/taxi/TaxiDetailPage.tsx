"use client";

import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { fareBreakdown, findTaxiPackage, formatCurrency, getSimilarTaxiPackages } from "@/lib/taxiPackage";
import { CarIcon, CheckIcon, ShieldIcon, StarIcon, UsersIcon } from "./TaxiIcons";
import TaxiPackageCard from "./TaxiPackageCard";
import { defaultTaxiSearch } from "@/lib/taxiPackage";

type Props = {
  slug: string;
};

export default function TaxiDetailPage({ slug }: Props) {
  const pkg = findTaxiPackage(slug);

  if (!pkg) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <EmptyState title="Taxi package not found" subtitle="This cab package may have moved or is no longer available." />
      </main>
    );
  }

  const breakdown = fareBreakdown(pkg, "");
  const similar = getSimilarTaxiPackages(pkg);

  return (
    <main className="bg-white">
      <section className="bg-surface-muted px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5">
            <Link href="/taxi-package/results" className="text-[13px] font-bold text-brand-700 hover:text-brand-800">
              Back to taxi results
            </Link>
            <h1 className="mt-3 text-3xl font-extrabold text-ink">{pkg.title}</h1>
            <p className="mt-2 text-[14px] text-ink-muted">{pkg.cabName} · {pkg.pickupCity} to {pkg.destination}</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="relative min-h-[360px] overflow-hidden rounded-lg">
              <img src={pkg.image} alt={pkg.title} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute left-4 top-4 flex gap-2">
                {pkg.recommended ? <Badge tone="accent">Recommended</Badge> : null}
                {pkg.popular ? <Badge tone="brand">Popular</Badge> : null}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {pkg.gallery.map((image, index) => (
                <img key={image} src={image} alt={`${pkg.title} gallery ${index + 1}`} className="h-36 w-full rounded-lg object-cover sm:h-full lg:h-[112px]" loading="lazy" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-4">
            {([
              [UsersIcon, `${pkg.seats} seats`, `${pkg.bags} bags`],
              [CarIcon, pkg.ac ? "AC cab" : "Non-AC cab", pkg.category],
              [StarIcon, `${pkg.rating} rating`, `${pkg.reviewCount} reviews`],
              [ShieldIcon, "Verified", "Driver partner"],
            ] as Array<[typeof UsersIcon, string, string]>).map(([TypedIcon, title, subtitle]) => {
              return (
                <div key={String(title)} className="rounded-lg border border-border-soft p-4">
                  <TypedIcon className="h-5 w-5 text-brand-700" />
                  <p className="mt-3 text-[14px] font-extrabold text-ink">{title}</p>
                  <p className="text-[12px] text-ink-muted">{subtitle}</p>
                </div>
              );
            })}
          </div>

          <Section title="Inclusions">
            <div className="grid gap-2 sm:grid-cols-2">
              {pkg.inclusions.map((item) => (
                <p key={item} className="inline-flex items-center gap-2 text-[14px] text-ink-muted">
                  <CheckIcon className="h-4 w-4 text-success-600" /> {item}
                </p>
              ))}
            </div>
          </Section>

          <Section title="Exclusions">
            <ul className="grid gap-2 sm:grid-cols-2">
              {pkg.exclusions.map((item) => (
                <li key={item} className="text-[14px] text-ink-muted">{item}</li>
              ))}
            </ul>
          </Section>

          <Section title="Package itinerary">
            <div className="space-y-4">
              {pkg.itinerary.map((stop) => (
                <div key={`${stop.time}-${stop.title}`} className="grid gap-3 border-l-2 border-brand-100 pl-4 sm:grid-cols-[90px_1fr]">
                  <span className="text-[13px] font-extrabold text-brand-700">{stop.time}</span>
                  <div>
                    <h3 className="text-[15px] font-extrabold text-ink">{stop.title}</h3>
                    <p className="mt-1 text-[13px] leading-6 text-ink-muted">{stop.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Pickup & drop details">
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Pickup city" value={pkg.pickupCity} />
              <Info label="Pickup location" value={pkg.pickupLocation} />
              <Info label="Destination" value={pkg.destination} />
              <Info label="Estimated duration" value={pkg.duration} />
            </div>
          </Section>

          <Section title="Cab specifications">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {pkg.specs.map((spec) => (
                <Info key={spec.label} label={spec.label} value={spec.value} />
              ))}
              <Info label="Fuel type" value={pkg.fuelType} />
              <Info label="Transmission" value={pkg.transmission} />
            </div>
          </Section>

          <Section title="Cancellation policy">
            <ul className="space-y-2">
              {pkg.cancellation.map((item) => <li key={item} className="text-[14px] leading-6 text-ink-muted">{item}</li>)}
            </ul>
          </Section>

          <Section title="Terms & conditions">
            <ul className="space-y-2">
              {pkg.terms.map((item) => <li key={item} className="text-[14px] leading-6 text-ink-muted">{item}</li>)}
            </ul>
          </Section>

          <Section title="Customer reviews">
            <div className="grid gap-3 sm:grid-cols-2">
              {pkg.reviews.map((review) => (
                <div key={review.name} className="rounded-lg border border-border-soft p-4">
                  <div className="mb-2 inline-flex items-center gap-1 text-accent-500">
                    <StarIcon className="h-4 w-4" /> <span className="text-[13px] font-bold text-ink">{review.rating}</span>
                  </div>
                  <p className="text-[14px] leading-6 text-ink">&ldquo;{review.text}&rdquo;</p>
                  <p className="mt-2 text-[12px] font-semibold text-ink-muted">{review.name} · {review.route}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-border-soft bg-white p-5 shadow-[var(--shadow-lg)]">
            <p className="text-[13px] font-semibold text-ink-muted">Starting from</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-3xl font-extrabold text-ink">{formatCurrency(pkg.price)}</span>
              {pkg.strikePrice ? <span className="pb-1 text-[13px] text-ink-subtle line-through">{formatCurrency(pkg.strikePrice)}</span> : null}
            </div>
            <div className="mt-4 space-y-2 border-t border-border-soft pt-4 text-[13px]">
              <FareRow label="Base fare" value={breakdown.baseFare} />
              <FareRow label="Service fee" value={breakdown.serviceFee} />
              <FareRow label="Taxes" value={breakdown.taxes} />
              <FareRow label="Estimated tolls" value={pkg.tollsEstimate} muted />
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border-soft pt-4">
              <span className="font-extrabold text-ink">Payable estimate</span>
              <span className="text-xl font-extrabold text-ink">{formatCurrency(breakdown.total + pkg.tollsEstimate)}</span>
            </div>
            <Link href={`/taxi-package/${pkg.slug}/book`} className="mt-5 block">
              <Button type="button" variant="accent" size="lg" fullWidth>Continue Booking</Button>
            </Link>
            <p className="mt-3 text-center text-[12px] text-ink-muted">No backend payment will be charged in this demo flow.</p>
          </div>
        </aside>
      </section>

      {similar.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
          <h2 className="mb-4 text-xl font-extrabold text-ink">Similar taxi packages</h2>
          <div className="space-y-4">
            {similar.map((item) => <TaxiPackageCard key={item.slug} pkg={item} search={defaultTaxiSearch} />)}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border-soft bg-white p-5">
      <h2 className="mb-4 text-xl font-extrabold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface-muted p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-[14px] font-bold text-ink">{value}</p>
    </div>
  );
}

function FareRow({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-ink-muted" : "text-ink"}>{label}</span>
      <span className={muted ? "text-ink-muted" : "font-semibold text-ink"}>{formatCurrency(value)}</span>
    </div>
  );
}
