"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function TaxiPartnerCTA() {
  return (
    <section className="bg-gradient-to-r from-brand-600 to-brand-700 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white">Own a taxi?</h2>
            <p className="mt-2 text-white/90">
              List your vehicles and connect with millions of travelers
            </p>
          </div>
          <Link href="/partner/taxis/register" className="flex-shrink-0">
            <Button variant="secondary" size="lg">
              List Your Taxi
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
