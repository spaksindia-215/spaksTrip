"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import InventoryUnavailable from "@/components/shared/InventoryUnavailable";

const OPERATOR_NAMES = ["Makruzz", "Green Ocean", "Nautika", "ITT Majestic"];

export default function AndamanCruiseResultsPage() {
  return (
    <Suspense fallback={<ResultsFallback />}>
      <AndamanCruiseResultsContent />
    </Suspense>
  );
}

function ResultsFallback() {
  return (
    <div className="min-h-screen bg-slate-50 text-[#0E1E3A]">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="animate-pulse rounded-3xl bg-white p-8 shadow-(--shadow-lg)">
          <div className="h-7 w-56 rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-full max-w-2xl rounded-full bg-slate-200" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function AndamanCruiseResultsContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "Port Blair";
  const to = searchParams.get("to") ?? "Havelock Island";
  const date = searchParams.get("date") ?? "";
  const returnDate = searchParams.get("returnDate") ?? "";
  const tripType = searchParams.get("tripType") ?? "one-way";
  const travellers = searchParams.get("travellers") ?? "2";

  return (
    <div className="min-h-screen bg-slate-50 text-[#0E1E3A]">
      <Header />
      <main className="pb-14">
        <section className="bg-gradient-to-r from-brand-900 via-[#0b1f4d] to-brand-800 text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:px-6">
            <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
              Andaman Cruise Search
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold sm:text-4xl">
                  {from} to {to}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-white/75 sm:text-base">
                  Your search has been captured successfully. Live Andaman ferry inventory will appear here once connected.
                </p>
              </div>
              <Link
                href="/cruise/andaman"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-white/15"
              >
                Modify Search
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SummaryCard label="Departure Port" value={from} />
            <SummaryCard label="Destination" value={to} />
            <SummaryCard label="Departure Date" value={formatDate(date)} />
            <SummaryCard label="Trip Type" value={tripType === "round-trip" ? "Round Trip" : "One Way"} />
            <SummaryCard label="Travellers" value={`${travellers} Passenger${travellers === "1" ? "" : "s"}`} />
          </div>

          {tripType === "round-trip" && returnDate ? (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-4 text-[14px] text-ink shadow-(--shadow-xs)">
              <span className="font-semibold text-brand-700">Return Sailing:</span>{" "}
              {formatDate(returnDate)}
            </div>
          ) : null}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
            <InventoryUnavailable
              title="Andaman cruise inventory will appear here"
              subtitle="This placeholder results page is ready for the final supplier connection. Your selected route and passenger details are already being passed correctly in the URL."
              href="/cruise/andaman"
              ctaLabel="Search Again"
            />

            <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-(--shadow-sm)">
              <h2 className="text-lg font-extrabold text-[#0E1E3A]">Popular Operators on this route</h2>
              <div className="mt-4 space-y-3">
                {OPERATOR_NAMES.map((operator) => (
                  <div
                    key={operator}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-[14px] font-semibold text-ink">{operator}</p>
                      <p className="text-[12px] text-ink-muted">Fast ferry and premium seating options</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      Popular
                    </span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-(--shadow-xs)">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{label}</p>
      <p className="mt-2 text-[15px] font-bold text-ink">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  if (!value) return "Not selected";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
