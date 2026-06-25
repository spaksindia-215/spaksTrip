"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function TaxiPartnerCTA() {
  return (
    <section className="bg-surface-muted py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-border-soft bg-white p-8 shadow-(--shadow-sm) sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="text-[12px] font-bold uppercase tracking-wide text-brand-600">Partner with us</p>
            <h2 className="mt-1 text-2xl font-extrabold text-ink">Own a taxi?</h2>
            <p className="mt-2 max-w-xl text-[14px] leading-6 text-ink-muted">
              List your vehicles and connect with millions of travelers.
            </p>
          </div>
          <Link href="/partner/taxis/register" className="flex-shrink-0">
            <Button variant="accent" size="lg">
              List Your Taxi
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
