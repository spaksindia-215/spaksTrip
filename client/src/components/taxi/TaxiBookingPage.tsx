"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import { fareBreakdown, findTaxiPackage, formatCurrency } from "@/lib/taxiPackage";
import type { TaxiBookingDraft } from "@/types/taxi";
import { CheckIcon, ShieldIcon } from "./TaxiIcons";

type Props = {
  slug: string;
};

const savedPassengers = ["Muskan Sharma", "Rahul Kapoor"];

export default function TaxiBookingPage({ slug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pkg = findTaxiPackage(slug);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState<TaxiBookingDraft>({
    leadPassenger: "",
    phone: "",
    email: "",
    passengers: 1,
    pickupInstructions: "",
    coupon: "",
  });

  const breakdown = useMemo(() => (pkg ? fareBreakdown(pkg, draft.coupon) : null), [draft.coupon, pkg]);

  if (!pkg || !breakdown) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <EmptyState title="Taxi package not found" subtitle="Please choose another package to continue booking." />
      </main>
    );
  }

  const packageSlug = pkg.slug;

  function setField<Key extends keyof TaxiBookingDraft>(key: Key, value: TaxiBookingDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    window.setTimeout(() => {
      router.push(`/taxi-package/${packageSlug}/confirmation?name=${encodeURIComponent(draft.leadPassenger || "Guest")}`);
    }, 650);
  }

  const pickupDate = searchParams.get("pickupDate") || new Date().toISOString().slice(0, 10);
  const pickupTime = searchParams.get("pickupTime") || "09:00";

  return (
    <main className="bg-surface-muted">
      <section className="border-b border-border-soft bg-white px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-[12px] font-bold uppercase tracking-wide text-brand-600">Taxi booking</p>
          <h1 className="mt-2 text-3xl font-extrabold text-ink">{pkg.title}</h1>
          <p className="mt-2 text-[14px] text-ink-muted">{pickupDate} at {pickupTime} · {pkg.cabName}</p>
        </div>
      </section>

      <form onSubmit={submit} className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-lg border border-border-soft bg-white p-5">
            <h2 className="text-xl font-extrabold text-ink">Passenger details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="Lead passenger" value={draft.leadPassenger} onChange={(event) => setField("leadPassenger", event.target.value)} placeholder="Full name" required />
              <Input label="Passengers" type="number" min={1} max={pkg.seats} value={draft.passengers} onChange={(event) => setField("passengers", Number(event.target.value) || 1)} required />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {savedPassengers.map((name) => (
                <button key={name} type="button" onClick={() => setField("leadPassenger", name)} className="rounded-full bg-brand-50 px-3 py-1 text-[12px] font-bold text-brand-700">
                  Use {name}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border-soft bg-white p-5">
            <h2 className="text-xl font-extrabold text-ink">Contact information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="Phone number" type="tel" value={draft.phone} onChange={(event) => setField("phone", event.target.value)} placeholder="+91 98765 43210" required />
              <Input label="Email" type="email" value={draft.email} onChange={(event) => setField("email", event.target.value)} placeholder="you@example.com" required />
            </div>
          </section>

          <section className="rounded-lg border border-border-soft bg-white p-5">
            <h2 className="text-xl font-extrabold text-ink">Pickup instructions</h2>
            <textarea
              value={draft.pickupInstructions}
              onChange={(event) => setField("pickupInstructions", event.target.value)}
              placeholder="Add landmark, gate number, flight number, or driver note"
              className="mt-4 min-h-28 w-full rounded-md border border-border bg-white px-3 py-3 text-[14px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </section>

          <section className="rounded-lg border border-border-soft bg-white p-5">
            <h2 className="text-xl font-extrabold text-ink">Coupon</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input value={draft.coupon} onChange={(event) => setField("coupon", event.target.value.toUpperCase())} placeholder="Try SPAKS500" />
              <Button type="button" variant="secondary" onClick={() => setField("coupon", "SPAKS500")}>Apply SPAKS500</Button>
            </div>
            {breakdown.couponDiscount > 0 ? (
              <p className="mt-2 inline-flex items-center gap-2 text-[13px] font-bold text-success-700">
                <CheckIcon className="h-4 w-4" /> Coupon applied. You saved {formatCurrency(breakdown.couponDiscount)}.
              </p>
            ) : null}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-border-soft bg-white p-5 shadow-[var(--shadow-lg)]">
            <img src={pkg.image} alt={pkg.cabName} className="h-36 w-full rounded-md object-cover" />
            <h2 className="mt-4 text-lg font-extrabold text-ink">{pkg.cabName}</h2>
            <p className="mt-1 text-[13px] text-ink-muted">{pkg.pickupCity} to {pkg.destination}</p>
            <div className="mt-4 space-y-2 border-t border-border-soft pt-4 text-[13px]">
              <SummaryRow label="Base fare" value={breakdown.baseFare} />
              <SummaryRow label="Service fee" value={breakdown.serviceFee} />
              <SummaryRow label="Taxes" value={breakdown.taxes} />
              {breakdown.couponDiscount ? <SummaryRow label="Coupon discount" value={-breakdown.couponDiscount} success /> : null}
              <SummaryRow label="Toll estimate" value={pkg.tollsEstimate} muted />
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border-soft pt-4">
              <span className="font-extrabold text-ink">Total payable</span>
              <span className="text-2xl font-extrabold text-ink">{formatCurrency(breakdown.total + pkg.tollsEstimate)}</span>
            </div>
            <Button type="submit" variant="accent" size="lg" fullWidth className="mt-5" loading={submitting}>
              Confirm Booking
            </Button>
            <p className="mt-3 inline-flex gap-2 text-[12px] leading-5 text-ink-muted">
              <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-success-600" />
              Payment gateway is not connected yet. This creates a frontend confirmation only.
            </p>
          </div>
        </aside>
      </form>
    </main>
  );
}

export function TaxiConfirmationPage({ slug, name }: { slug: string; name: string }) {
  const pkg = findTaxiPackage(slug);
  if (!pkg) {
    return <EmptyState title="Booking not found" subtitle="Please start a new taxi booking." />;
  }

  return (
    <main className="grid min-h-[70vh] place-items-center bg-surface-muted px-4 py-12 sm:px-6">
      <motion.section
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-2xl rounded-lg border border-border-soft bg-white p-6 text-center shadow-[var(--shadow-lg)]"
      >
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success-50 text-success-700">
          <CheckIcon className="h-8 w-8" />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold text-ink">Taxi booking confirmed</h1>
        <p className="mx-auto mt-2 max-w-xl text-[14px] leading-6 text-ink-muted">
          Thanks, {name}. Your {pkg.cabName} for {pkg.pickupCity} to {pkg.destination} is reserved in the demo booking flow.
        </p>
        <div className="mt-6 rounded-md bg-surface-muted p-4 text-left">
          <p className="text-[13px] font-bold text-ink">Booking ID: STX-{pkg.slug.slice(0, 8).toUpperCase()}</p>
          <p className="mt-1 text-[13px] text-ink-muted">Driver and cab details will be shared before pickup once backend dispatch is connected.</p>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button type="button" variant="secondary" onClick={() => window.location.assign("/taxi-package")}>Book another cab</Button>
          <Button type="button" onClick={() => window.location.assign("/my-trips")}>Open My Trips</Button>
        </div>
      </motion.section>
    </main>
  );
}

function SummaryRow({ label, value, muted, success }: { label: string; value: number; muted?: boolean; success?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-ink-muted" : "text-ink"}>{label}</span>
      <span className={success ? "font-bold text-success-700" : muted ? "text-ink-muted" : "font-semibold text-ink"}>{formatCurrency(value)}</span>
    </div>
  );
}
