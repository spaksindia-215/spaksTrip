"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import CruiseResultCard from "@/components/cruise/CruiseResultCard";
import Chip from "@/components/ui/Chip";
import type { CruiseOffer } from "@/lib/mock/cruises";
import { sleep } from "@/services/delay";
import Skeleton from "@/components/ui/Skeleton";
import InventoryUnavailable from "@/components/shared/InventoryUnavailable";

export default function CruiseResultsPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <CruiseResultsInner />
    </Suspense>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />
      <main className="flex-1 p-8 max-w-4xl mx-auto w-full flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </main>
      <Footer />
    </div>
  );
}

const NIGHT_FILTERS = [
  { label: "All", value: "all" },
  { label: "3N", value: "3" },
  { label: "5N", value: "5" },
  { label: "7N", value: "7" },
  { label: "10N", value: "10" },
  { label: "14N", value: "14" },
];

function CruiseResultsInner() {
  const sp = useSearchParams();
  const port = sp.get("port") ?? "Mumbai";
  const month = sp.get("month") ?? "any";
  const nightsParam = sp.get("nights") ?? "any";

  return (
    <CruiseResultsContent
      key={`${port}-${month}-${nightsParam}`}
      port={port}
      month={month}
      nightsParam={nightsParam}
    />
  );
}

function CruiseResultsContent({
  port,
  month,
  nightsParam,
}: {
  port: string;
  month: string;
  nightsParam: string;
}) {

  const [cruises, setCruises] = useState<CruiseOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [nightFilter, setNightFilter] = useState(
    nightsParam && nightsParam !== "any" ? nightsParam : "all",
  );

  useEffect(() => {
    sleep(700).then(() => {
      // No live cruise supplier is connected yet, so no inventory is returned.
      // The empty state below renders <InventoryUnavailable /> instead of
      // fabricated sailings (matches the taxi/cabs services which return []).
      setCruises([]);
      setLoading(false);
    });
  }, [port, month]);

  const displayed = useMemo(() => {
    const nightsNum = nightFilter !== "all" ? parseInt(nightFilter) : null;
    return nightsNum ? cruises.filter((c) => c.nights === nightsNum) : cruises;
  }, [cruises, nightFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header />

      <div className="bg-brand-900 text-white px-4 py-3 text-[13px] font-medium">
        <div className="mx-auto max-w-4xl flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-bold text-[15px]">Cruises from {port}</span>
          {month !== "any" && <span className="text-white/70">{month}</span>}
        </div>
      </div>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 md:px-6 py-6">
          {/* Night filter chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {NIGHT_FILTERS.map((f) => (
              <Chip key={f.value} active={nightFilter === f.value} onClick={() => setNightFilter(f.value)}>
                {f.label}
              </Chip>
            ))}
          </div>

          {loading && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          )}

          {!loading && (
            <div className="flex flex-col gap-3" aria-live="polite">
              {displayed.length === 0 ? (
                <InventoryUnavailable
                  title="Cruise inventory is currently unavailable"
                  subtitle="Live cruise sailings have not been connected yet, so no generated itineraries are shown."
                  href="/cruise"
                  ctaLabel="Back to Cruise Search"
                />
              ) : (
                displayed.map((cruise) => (
                  <CruiseResultCard key={cruise.id} cruise={cruise} />
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
