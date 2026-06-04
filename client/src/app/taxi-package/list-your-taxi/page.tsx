"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import TaxiListingForm from "@/components/transport/list-your-taxi/TaxiListingForm";
import { isTaxiManagerRole } from "@/lib/taxiRoles";
import { useAuthStore } from "@/state/authStore";

const ROUTE = "/taxi-package/list-your-taxi";

export default function ListYourTaxiPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    if (status === "idle") void hydrate();
  }, [hydrate, status]);

  useEffect(() => {
    if (status !== "ready") return;
    if (!user) {
      router.replace(`/auth?role=partner&redirect=${encodeURIComponent(ROUTE)}`);
    }
  }, [router, status, user]);

  if (status !== "ready" || !user) {
    return (
      <div className="min-h-screen bg-surface-muted text-ink">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="rounded-[28px] border border-border-soft bg-white p-8 text-center shadow-(--shadow-xs)">
            <p className="text-[14px] text-ink-muted">Checking access...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isTaxiManagerRole(user.role)) {
    return (
      <div className="min-h-screen bg-surface-muted text-ink">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-xl rounded-[28px] border border-danger-100 bg-white p-10 text-center shadow-(--shadow-sm)">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger-50">
              <svg
                viewBox="0 0 24 24"
                width={28}
                height={28}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-danger-500"
                aria-hidden
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <h2 className="mt-5 text-2xl font-black text-ink">Access Restricted</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-muted">
              Only <strong className="text-ink">Partners</strong> and{" "}
              <strong className="text-ink">Agents</strong> can list taxis on this platform.
              Customer accounts do not have access to taxi operator features.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/taxi-package"
                className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Browse Taxi Packages
              </Link>
              <Link
                href="/auth?mode=register&role=partner"
                className="inline-flex items-center justify-center rounded-xl border border-border-soft px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted"
              >
                Register as Partner
              </Link>
            </div>
          </div>
        </main>
        <Footer />
        <BackToTop />
      </div>
    );
  }

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
