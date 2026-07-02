"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import CabResultCard from "@/components/transport/CabResultCard";
import Chip from "@/components/ui/Chip";
import { searchCabs, type CabOffer, type CabType } from "@/services/cabs";
import Skeleton from "@/components/ui/Skeleton";
import InventoryUnavailable from "@/components/shared/InventoryUnavailable";

export default function CabResultsPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <CabResultsInner />
    </Suspense>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <main className="flex-1 p-8 max-w-3xl mx-auto w-full flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </main>
      <Footer />
    </div>
  );
}

const CAB_TYPE_ORDER: CabType[] = ["Mini", "Sedan", "SUV", "Luxury", "Van"];

function CabResultsInner() {
  const sp = useSearchParams();
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const date = sp.get("date") ?? "";

  return (
    <CabResultsContent
      key={`${from}-${to}-${date}`}
      from={from}
      to={to}
      date={date}
      searchParams={sp.toString()}
    />
  );
}

function CabResultsContent({
  from,
  to,
  date,
  searchParams,
}: {
  from: string;
  to: string;
  date: string;
  searchParams: string;
}) {

  const [cabs, setCabs] = useState<CabOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<CabType | "All">("All");

  useEffect(() => {
    if (!from || !to || !date) return;
    searchCabs({ from, to, date }).then((results) => {
      setCabs(results);
      setLoading(false);
    });
  }, [from, to, date]);

  const displayed = typeFilter === "All" ? cabs : cabs.filter((c) => c.type === typeFilter);

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />

      <div className="bg-brand-900 text-white px-4 py-3 text-[13px] font-medium">
        <div className="mx-auto max-w-3xl flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-bold text-[15px]">{from} → {to}</span>
          {date && <span className="text-white/70">{date}</span>}
        </div>
      </div>

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-6">
          {/* Type filter chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Chip active={typeFilter === "All"} onClick={() => setTypeFilter("All")}>All</Chip>
            {CAB_TYPE_ORDER.map((t) => (
              <Chip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>{t}</Chip>
            ))}
          </div>

          {loading && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          )}

          {!loading && (
            <div className="flex flex-col gap-3" aria-live="polite">
              {displayed.length === 0 ? (
                <InventoryUnavailable
                  title="Cab inventory is currently unavailable"
                  subtitle="This cab flow no longer uses generated vehicles. Connect a live supplier to restore results."
                  href="/taxi"
                  ctaLabel="Back to Taxi Search"
                />
              ) : (
                displayed.map((cab) => (
                  <CabResultCard key={cab.id} cab={cab} searchParams={searchParams} />
                ))
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
